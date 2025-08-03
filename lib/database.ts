import { databases, config, Query } from './appwrite';
import { ID, Permission, Role } from 'appwrite';

export interface VideoRecord {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  fileId: string;
  quality: string;
  userId: string;
  userName: string;
  duration: number;
  views: number;
  isPublic: boolean;
  thumbnailUrl: string;
}

export interface VideoReaction {
  $id: string;
  $createdAt: string;
  videoId: string;
  userId: string;
  userName: string;
  emoji: string;
}

export type Video = VideoRecord;

export class DatabaseService {
  // Video management
  static async createVideoRecord(video: Omit<VideoRecord, '$id' | '$createdAt' | '$updatedAt' | 'views'>) {
    try {
      const documentData = {
        ...video,
        views: 0
      };
      
      console.log('Attempting to create video document with data:', {
        databaseId: config.databaseId,
        collectionId: config.collectionsId.videos,
        documentData: documentData,
        documentKeys: Object.keys(documentData),
        config: config
      });
      
      // Log individual field values for debugging
      console.log('Individual document fields:', {
        title: documentData.title,
        fileId: documentData.fileId,
        duration: documentData.duration,
        quality: documentData.quality,
        isPublic: documentData.isPublic,
        userId: documentData.userId,
        userName: documentData.userName
      });
      
      const response = await databases.createDocument(
        config.databaseId,
        config.collectionsId.videos,
        ID.unique(),
        documentData,
        [
          Permission.read(Role.user(video.userId)),
          Permission.update(Role.user(video.userId)),
          Permission.delete(Role.user(video.userId)),
          ...(video.isPublic ? [Permission.read(Role.any())] : [])
        ]
      );
      
      console.log('Successfully created video document:', response);
      return response;
    } catch (error: any) {
      console.error('Failed to create video record. Error details:', {
        error: error,
        message: error.message,
        code: error.code,
        type: error.type,
        video: video,
        config: {
          databaseId: config.databaseId,
          collectionId: config.collectionsId.videos
        }
      });
      throw error;
    }
  }

  static async getUserVideos(userId: string) {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collectionsId.videos,
        [
          Query.equal('userId', userId)
        ]
      );
      return response.documents as unknown as VideoRecord[];
    } catch (error) {
      console.error('Failed to fetch user videos:', error);
      throw error;
    }
  }

  static async getVideoById(videoId: string) {
    try {
      const response = await databases.getDocument(
        config.databaseId,
        config.collectionsId.videos,
        videoId
      );
      return response as unknown as VideoRecord;
    } catch (error) {
      console.error('Failed to fetch video:', error);
      throw error;
    }
  }

  static async updateVideo(videoId: string, updates: Partial<VideoRecord>) {
    try {
      const response = await databases.updateDocument(
        config.databaseId,
        config.collectionsId.videos,
        videoId,
        updates as any
      );
      return response;
    } catch (error) {
      console.error('Failed to update video:', error);
      throw error;
    }
  }

  static async deleteVideo(videoId: string, fileId?: string) {
    let storageDeleteSuccess = true;
    let storageError: any = null;
    
    try {
      // First verify the video exists and get its details
      const video = await this.getVideoById(videoId);
      console.log('Video to delete:', { videoId, fileId, video });
      
      // Try to delete the file from storage first
      if (fileId) {
        try {
          const { storage } = await import('./appwrite');
          await storage.deleteFile(
            process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
            fileId
          );
          console.log('Successfully deleted file from storage:', fileId);
        } catch (storageError: any) {
          console.error('Failed to delete file from storage:', storageError);
          storageDeleteSuccess = false;
          storageError = storageError;
          
          // Log detailed error for debugging
          console.log('Storage deletion error details:', {
            code: storageError.code,
            message: storageError.message,
            type: storageError.type,
            videoId,
            fileId
          });
          
          // Continue with database deletion even if storage deletion fails
          // This is important for orphaned records where storage file might not exist
          // or have permission issues
        }
      }
      
      // Always attempt to delete the database record
      await databases.deleteDocument(
        config.databaseId,
        config.collectionsId.videos,
        videoId
      );
      
      console.log('Successfully deleted video document:', videoId);
      
      // If storage deletion failed but database deletion succeeded, 
      // log it but don't throw an error since the main goal (removing video from list) is achieved
      if (!storageDeleteSuccess) {
        console.warn('Video deleted from database but storage file deletion failed. This is usually due to permission issues with old videos.');
      }
      
      return { 
        success: true, 
        storageDeleteSuccess,
        message: storageDeleteSuccess ? '视频删除成功' : '视频已从列表中删除（文件删除遇到权限问题）'
      };
    } catch (error: any) {
      console.error('Failed to delete video:', error);
      console.error('Delete error details:', {
        code: error.code,
        message: error.message,
        type: error.type,
        videoId,
        fileId
      });
      
      // Provide more specific error messages
      if (error.code === 401 || error.code === 'document_invalid_permissions') {
        throw new Error('您没有权限删除此视频。只有视频作者可以删除自己的视频。\n\n如果您是视频作者，请尝试重新上传一个新视频，然后删除旧的。');
      } else if (error.code === 404) {
        throw new Error('视频不存在或已被删除。');
      } else {
        throw new Error(`删除视频失败: ${error.message || '未知错误'}\n\n错误码: ${error.code || 'N/A'}`);
      }
    }
  }

  static async incrementViews(videoId: string) {
    try {
      const video = await this.getVideoById(videoId);
      await this.updateVideo(videoId, { views: video.views + 1 });
    } catch (error) {
      console.error('Failed to increment views:', error);
      // Don't throw error for view tracking failures
    }
  }

  // Reactions management
  static async addReaction(videoId: string, userId: string, userName: string, emoji: string) {
    try {
      // Check if user already reacted with this emoji
      const existingReactions = await this.getVideoReactions(videoId);
      const existingReaction = existingReactions.find(
        r => r.userId === userId && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove existing reaction
        await databases.deleteDocument(
          config.databaseId,
          config.collectionsId.reactions,
          existingReaction.$id
        );
        return null;
      } else {
        // Add new reaction
        const response = await databases.createDocument(
          config.databaseId,
          config.collectionsId.reactions,
          ID.unique(),
          {
            videoId,
            userId,
            userName,
            emoji
          },
          [
            Permission.read(Role.any()),
            Permission.write(Role.user(userId))
          ]
        );
        return response as unknown as VideoReaction;
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  static async getVideoReactions(videoId: string) {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collectionsId.reactions,
        [
          Query.equal('videoId', videoId)
        ]
      );
      return response.documents as unknown as VideoReaction[];
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
      throw error;
    }
  }

  // Public videos for discovery
  static async getPublicVideos(limit = 20) {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collectionsId.videos,
        [
          Query.equal('isPublic', true)
        ]
      );
      return response.documents as unknown as VideoRecord[];
    } catch (error) {
      console.error('Failed to fetch public videos:', error);
      throw error;
    }
  }
}
