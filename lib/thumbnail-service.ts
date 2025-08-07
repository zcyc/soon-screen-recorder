/**
 * 缩略图服务
 * 提供缩略图删除功能
 */

import { deleteFile } from './server-database';

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
   * 删除视频时同时删除其缩略图
   */
  static async deleteThumbnailOnVideoDelete(thumbnailUrl: string): Promise<boolean> {
    try {
      console.log('🗑️ Attempting to delete thumbnail:', thumbnailUrl);
      
      // 从URL中提取文件ID
      // URL格式: https://appwrite.p6s.fun/v1/storage/buckets/videos/files/{fileId}/view?project=soon
      const match = thumbnailUrl.match(/\/files\/([^\/\?]+)/);
      
      if (!match || !match[1]) {
        console.error('❌ Could not extract fileId from URL:', thumbnailUrl);
        return false;
      }
      
      const fileId = match[1];
      console.log('📄 Extracted fileId:', fileId);
      
      await deleteFile(fileId);
      console.log(`✅ Thumbnail deleted successfully: ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete thumbnail:', error);
      return false;
    }
  }
}