/**
 * 缩略图生成服务
 * 提供上传时生成、批量生成等功能
 */

import { uploadFile, getFileUrl, updateVideoThumbnail, getUserVideos, deleteFile } from './server-database';
import { createAdminClient, config, ID } from './appwrite-server';
import { generateVideoThumbnailBlob } from './video-utils';

export interface ThumbnailGenerationOptions {
  width?: number;
  height?: number;
  time?: number; // 截取时间点（秒）
  quality?: number; // 图片质量 0-1
  format?: 'jpeg' | 'png' | 'webp';
}

export class ThumbnailService {
  
  /**
   * 为新上传的视频生成缩略图
   * 在视频上传完成后调用
   */
  static async generateThumbnailOnUpload(
    videoId: string,
    videoUrl: string,
    userId: string,
    options: ThumbnailGenerationOptions = {}
  ): Promise<string | null> {
    const {
      width = 320,
      height = 180,
      time = 1,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    try {
      console.log(`Generating thumbnail for video ${videoId}...`);
      
      // 在服务端环境中，我们不能使用浏览器 API 生成缩略图
      // 这里跳过自动生成，返回 null 让前端使用占位图
      console.log(`ℹ️ Skipping server-side thumbnail generation for video ${videoId} (not supported in Node.js environment)`);
      return null;
      
    } catch (error) {
      console.error(`❌ Failed to generate thumbnail for video ${videoId}:`, error);
      return null;
    }
  }

  /**
   * 批量为现有视频生成缩略图
   * 管理员工具，用于处理历史数据
   */
  static async batchGenerateThumbnails(
    userId: string,
    options: ThumbnailGenerationOptions = {}
  ): Promise<{success: number, failed: number, results: Array<{videoId: string, success: boolean, error?: string}>}> {
    
    const results: Array<{videoId: string, success: boolean, error?: string}> = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      // 获取用户所有没有缩略图的视频
      const videos = await getUserVideos(userId);
      const videosWithoutThumbnails = videos.filter(video => !video.thumbnailUrl);
      
      console.log(`Found ${videosWithoutThumbnails.length} videos without thumbnails`);
      console.log(`ℹ️ Server-side thumbnail generation is disabled. Videos will use placeholder thumbnails.`);

      for (const video of videosWithoutThumbnails) {
        // 在服务端环境中，我们不生成缩略图，而是让前端使用占位图
        results.push({ videoId: video.$id, success: false, error: 'Server-side generation not supported' });
        failedCount++;
      }

      return { success: successCount, failed: failedCount, results };
      
    } catch (error) {
      console.error('Batch thumbnail generation failed:', error);
      throw error;
    }
  }

  /**
   * 检查并生成单个视频的缩略图（如果不存在）
   * 用于懒加载场景
   */
  static async ensureThumbnailExists(
    video: any,
    userId: string,
    options: ThumbnailGenerationOptions = {}
  ): Promise<string> {
    
    // 如果已有缩略图，直接返回
    if (video.thumbnailUrl) {
      return video.thumbnailUrl;
    }

    // 在服务端环境中，我们不生成缩略图，直接返回占位图
    const { generatePlaceholderThumbnail } = await import('./video-utils');
    return generatePlaceholderThumbnail(320, 180, video.title);
  }

  /**
   * 删除视频时同时删除其缩略图
   */
  static async deleteThumbnailOnVideoDelete(thumbnailUrl: string): Promise<boolean> {
    try {
      // 从URL中提取文件ID
      const urlParts = thumbnailUrl.split('/');
      const fileId = urlParts[urlParts.length - 1];
      
      if (fileId) {
        await deleteFile(fileId);
        console.log(`✅ Thumbnail deleted: ${fileId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete thumbnail:', error);
      return false;
    }
  }

  /**
   * 获取缩略图生成统计
   */
  static async getThumbnailStats(userId: string): Promise<{
    total: number;
    withThumbnail: number;
    withoutThumbnail: number;
    percentage: number;
  }> {
    try {
      const videos = await getUserVideos(userId);
      const total = videos.length;
      const withThumbnail = videos.filter(v => v.thumbnailUrl).length;
      const withoutThumbnail = total - withThumbnail;
      const percentage = total > 0 ? Math.round((withThumbnail / total) * 100) : 0;

      return {
        total,
        withThumbnail,
        withoutThumbnail,
        percentage
      };
    } catch (error) {
      console.error('Failed to get thumbnail stats:', error);
      return { total: 0, withThumbnail: 0, withoutThumbnail: 0, percentage: 0 };
    }
  }
}