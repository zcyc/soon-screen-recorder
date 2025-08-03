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
    } catch (error: any) {
      console.error('Failed to fetch video:', error);
      
      // Provide more specific error messages for common cases
      if (error.code === 404) {
        throw new Error('Video not found or no longer available.');
      } else if (error.code === 401) {
        throw new Error('This video is private or requires authentication to view.');
      }
      
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
        // Check if this is likely an older video without proper permissions
        const videoCreatedAt = new Date(video.$createdAt);
        const cutoffDate = new Date('2024-12-22'); // Date when permission fixes were implemented
        const isOlderVideo = videoCreatedAt < cutoffDate;
        
        if (isOlderVideo) {
          // For older videos, don't attempt storage deletion to avoid 401 errors
          console.info('Skipping storage file deletion for older video (before permission fixes):', {
            videoId,
            fileId,
            createdAt: video.$createdAt,
            message: 'Storage file deletion not attempted due to legacy permissions'
          });
          storageDeleteSuccess = false;
        } else {
          // For newer videos with proper permissions, attempt storage deletion
          try {
            const { storage } = await import('./appwrite');
            await storage.deleteFile(
              process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
              fileId
            );
            console.log('Successfully deleted file from storage:', fileId);
          } catch (storageError: any) {
            storageDeleteSuccess = false;
            
            // Check if it's a permission issue (unexpected for newer videos)
            if (storageError.code === 401 || storageError.type === 'user_unauthorized') {
              console.warn('Unexpected permission error for newer video:', {
                videoId,
                fileId,
                createdAt: video.$createdAt,
                message: 'This should not happen for videos with proper permissions'
              });
            } else {
              // Log other types of storage errors normally
              console.error('Failed to delete file from storage:', storageError);
              console.log('Storage deletion error details:', {
                code: storageError.code,
                message: storageError.message,
                type: storageError.type,
                videoId,
                fileId
              });
            }
          }
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
      
      // Determine appropriate success message based on storage deletion result
      let successMessage;
      if (storageDeleteSuccess) {
        successMessage = '视频删除成功！';
      } else {
        const videoCreatedAt = new Date(video.$createdAt);
        const cutoffDate = new Date('2024-12-22');
        const isOlderVideo = videoCreatedAt < cutoffDate;
        
        if (isOlderVideo) {
          successMessage = '视频已成功删除！（旧视频文件保留在存储中）';
        } else {
          successMessage = '视频已从列表中删除（文件删除遇到问题）';
        }
      }
      
      return { 
        success: true, 
        storageDeleteSuccess,
        message: successMessage
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
      // First check if video exists and is accessible
      const video = await this.getVideoById(videoId);
      
      // Only increment views for public videos or if user has access
      if (video.isPublic) {
        try {
          await this.updateVideo(videoId, { views: video.views + 1 });
        } catch (updateError: any) {
          // If update fails due to permissions, try alternative approach
          if (updateError.code === 401 || updateError.code === 'document_invalid_permissions') {
            console.info('Unable to increment views due to permissions - this is normal for anonymous users viewing public videos');
            // Fail silently for anonymous users - view counting is not critical
            return;
          }
          throw updateError;
        }
      }
    } catch (error: any) {
      console.error('Failed to increment views:', error);
      // Don't throw error for view tracking failures to avoid breaking page load
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
            Permission.write(Role.user(userId)),
            Permission.delete(Role.user(userId))
          ]
        );
        return response as unknown as VideoReaction;
      }
    } catch (error: any) {
      console.error('Failed to add reaction:', error);
      
      // Provide more specific error messages
      if (error.code === 401) {
        throw new Error('You must be logged in to react to videos.');
      } else if (error.code === 'collection_invalid_permissions') {
        throw new Error('You do not have permission to add reactions to this video.');
      }
      
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
    } catch (error: any) {
      console.error('Failed to fetch reactions:', error);
      
      // If it's a permission error, return empty array instead of throwing
      // This allows anonymous users to view videos without reactions
      if (error.code === 401 || error.code === 'collection_invalid_permissions') {
        console.info('Anonymous user cannot access reactions - returning empty array');
        return [];
      }
      
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
