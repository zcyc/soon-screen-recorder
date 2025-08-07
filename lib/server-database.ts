'use server';

import { createAdminClient, createSessionClient, config, Query, ID } from './appwrite-server';

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
  subtitleFileId: string | null;
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

// Video management functions
export async function createVideoRecord(video: Omit<VideoRecord, '$id' | '$createdAt' | '$updatedAt' | 'views'>) {
  try {
    const { databases } = await createAdminClient();
    
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
    
    const response = await databases.createDocument(
      config.databaseId,
      config.collectionsId.videos,
      ID.unique(),
      documentData
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

export async function getUserVideos(userId: string) {
  try {
    const { databases } = await createAdminClient();
    
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

export async function getVideoById(videoId: string) {
  try {
    const { databases } = await createAdminClient();
    
    const response = await databases.getDocument(
      config.databaseId,
      config.collectionsId.videos,
      videoId
    );
    return response as unknown as VideoRecord;
  } catch (error: any) {
    console.error('Failed to fetch video:', error);
    
    if (error.code === 404) {
      throw new Error('Video not found or no longer available.');
    } else if (error.code === 401) {
      throw new Error('This video is private or requires authentication to view.');
    }
    
    throw error;
  }
}

export async function updateVideo(videoId: string, updates: Partial<VideoRecord>) {
  try {
    const { databases } = await createAdminClient();
    
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

export async function toggleVideoPrivacy(videoId: string, userId: string) {
  try {
    // First verify the user owns this video
    const video = await getVideoById(videoId);
    if (video.userId !== userId) {
      throw new Error('Unauthorized: You can only modify your own videos');
    }

    const newIsPublic = !video.isPublic;
    
    // Update the video privacy setting
    await updateVideo(videoId, { isPublic: newIsPublic });

    // Return the updated video record
    return await getVideoById(videoId);
  } catch (error: any) {
    console.error('Failed to toggle video privacy:', error);
    
    if (error.code === 401 || error.code === 'document_invalid_permissions') {
      throw new Error('You do not have permission to modify this video');
    }
    
    if (error.code === 404) {
      throw new Error('Video not found');
    }
    
    throw new Error(error.message || 'Failed to update privacy setting');
  }
}

export async function deleteVideo(videoId: string, fileId?: string) {
  let storageDeleteSuccess = true;
  let thumbnailDeleteSuccess = true;
  
  try {
    const { databases, storage } = await createAdminClient();
    
    // First verify the video exists and get its details
    const video = await getVideoById(videoId);
    console.log('Video to delete:', { videoId, fileId, video });
    
    // Delete thumbnail if exists
    if (video.thumbnailUrl) {
      try {
        const { ThumbnailService } = await import('@/lib/thumbnail-service');
        await ThumbnailService.deleteThumbnailOnVideoDelete(video.thumbnailUrl);
        console.log('Successfully deleted thumbnail:', video.thumbnailUrl);
      } catch (thumbnailError: any) {
        thumbnailDeleteSuccess = false;
        console.error('Failed to delete thumbnail:', thumbnailError);
      }
    }
    
    // Try to delete the file from storage first
    if (fileId) {
      try {
        await storage.deleteFile(config.bucketId, fileId);
        console.log('Successfully deleted file from storage:', fileId);
      } catch (storageError: any) {
        storageDeleteSuccess = false;
        console.error('Failed to delete file from storage:', storageError);
      }
    }
    
    // Delete the database record
    await databases.deleteDocument(
      config.databaseId,
      config.collectionsId.videos,
      videoId
    );
    
    console.log('Successfully deleted video document:', videoId);
    
    const allSuccess = storageDeleteSuccess && thumbnailDeleteSuccess;
    let message = '视频删除成功！';
    
    if (!allSuccess) {
      const issues = [];
      if (!storageDeleteSuccess) issues.push('文件删除遇到问题');
      if (!thumbnailDeleteSuccess) issues.push('缩略图删除遇到问题');
      message = `视频已从列表中删除（${issues.join('，')}）`;
    }
    
    return { 
      success: true, 
      storageDeleteSuccess,
      thumbnailDeleteSuccess,
      message
    };
  } catch (error: any) {
    console.error('Failed to delete video:', error);
    
    if (error.code === 401 || error.code === 'document_invalid_permissions') {
      throw new Error('您没有权限删除此视频。只有视频作者可以删除自己的视频。');
    } else if (error.code === 404) {
      throw new Error('视频不存在或已被删除。');
    } else {
      throw new Error(`删除视频失败: ${error.message || '未知错误'}`);
    }
  }
}

export async function incrementViews(videoId: string) {
  try {
    // First check if video exists and is accessible
    const video = await getVideoById(videoId);
    
    // Only increment views for public videos
    if (video.isPublic) {
      try {
        await updateVideo(videoId, { views: video.views + 1 });
      } catch (updateError: any) {
        console.info('Unable to increment views:', updateError);
        // Fail silently for view counting failures
        return;
      }
    }
  } catch (error: any) {
    console.error('Failed to increment views:', error);
    // Don't throw error for view tracking failures
  }
}

// Reactions management
export async function addReaction(videoId: string, userId: string, userName: string, emoji: string) {
  try {
    const { databases } = await createAdminClient();
    
    // Check if user already reacted with this emoji
    const existingReactions = await getVideoReactions(videoId);
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
        }
      );
      return response as unknown as VideoReaction;
    }
  } catch (error: any) {
    console.error('Failed to add reaction:', error);
    
    if (error.code === 401) {
      throw new Error('You must be logged in to react to videos.');
    } else if (error.code === 'collection_invalid_permissions') {
      throw new Error('You do not have permission to add reactions to this video.');
    }
    
    throw error;
  }
}

export async function getVideoReactions(videoId: string) {
  try {
    const { databases } = await createAdminClient();
    
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
    
    // If it's a permission error, return empty array
    if (error.code === 401 || error.code === 'collection_invalid_permissions') {
      console.info('Cannot access reactions - returning empty array');
      return [];
    }
    
    throw error;
  }
}

// Public videos for discovery
export async function getPublicVideos(limit = 20) {
  try {
    const { databases } = await createAdminClient();
    
    const response = await databases.listDocuments(
      config.databaseId,
      config.collectionsId.videos,
      [
        Query.equal('isPublic', true),
        Query.limit(limit)
      ]
    );
    return response.documents as unknown as VideoRecord[];
  } catch (error) {
    console.error('Failed to fetch public videos:', error);
    throw error;
  }
}

// Thumbnail management
export async function updateVideoThumbnail(videoId: string, thumbnailUrl: string, userId: string) {
  try {
    // Verify the user owns this video
    const video = await getVideoById(videoId);
    if (video.userId !== userId) {
      throw new Error('Unauthorized: You can only update your own videos');
    }

    const response = await updateVideo(videoId, { thumbnailUrl });
    return response;
  } catch (error) {
    console.error('Failed to update video thumbnail:', error);
    throw error;
  }
}

// Upload file to storage
export async function uploadFile(file: File, bucketId?: string) {
  try {
    const { storage } = await createAdminClient();
    
    const response = await storage.createFile(
      bucketId || config.bucketId,
      ID.unique(),
      file
    );
    
    return response;
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw error;
  }
}

// Delete file from storage
export async function deleteFile(fileId: string, bucketId?: string) {
  try {
    const { storage } = await createAdminClient();
    
    await storage.deleteFile(
      bucketId || config.bucketId,
      fileId
    );
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw error;
  }
}

// Get file URL
export async function getFileUrl(fileId: string, bucketId?: string) {
  const { storage } = await createAdminClient();
  
  // 在 Node SDK 中，我们需要构建文件的 URL
  // 使用 getFileDownload 来获取文件的下载 URL
  const fileUrl = `${config.endpoint}/storage/buckets/${bucketId || config.bucketId}/files/${fileId}/view?project=${config.projectId}`;
  
  return fileUrl;
}