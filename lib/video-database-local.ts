import pool from './database-config';

export interface VideoRecord {
  $id: string; // For compatibility, use Appwrite format
  id: number; // Actual PostgreSQL ID
  $createdAt: string;
  $updatedAt: string;
  title: string;
  description: string;
  file_path: string;
  file_size: number;
  duration: number;
  thumbnail_path: string;
  user_id: number;
  userId: string; // Compatible format, string version of user_id
  userName: string; // Fetched from users table
  quality: string; // Default value
  views: number;
  isPublic: boolean;
  isPublish: boolean;
  fileId: string; // Compatible format, using file_path
  thumbnailUrl: string; // Compatible format, using thumbnail_path
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

// Create video record
export async function createVideoRecord(video: {
  title: string;
  description?: string;
  file_path: string;
  file_size: number;
  duration: number;
  thumbnail_path?: string;
  userId: string;
  userName: string;
  isPublic?: boolean;
  isPublish?: boolean;
}) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      INSERT INTO videos (title, description, file_path, file_size, duration, thumbnail_path, user_id, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      video.title,
      video.description || '',
      video.file_path,
      video.file_size,
      video.duration,
      video.thumbnail_path || '',
      parseInt(video.userId), // Convert to number
      video.isPublic || false
    ]);
    
    const videoRecord = result.rows[0];
    
    // Convert to compatible format
    return {
      $id: videoRecord.id.toString(),
      id: videoRecord.id,
      $createdAt: videoRecord.created_at,
      $updatedAt: videoRecord.updated_at,
      title: videoRecord.title,
      description: videoRecord.description,
      file_path: videoRecord.file_path,
      file_size: videoRecord.file_size,
      duration: videoRecord.duration,
      thumbnail_path: videoRecord.thumbnail_path,
      user_id: videoRecord.user_id,
      userId: videoRecord.user_id.toString(),
      userName: video.userName,
      quality: '1080p', // Default value
      views: 0,
      isPublic: videoRecord.is_public,
      isPublish: videoRecord.is_public,
      fileId: videoRecord.file_path,
      thumbnailUrl: videoRecord.thumbnail_path || '',
      subtitleFileId: null
    } as VideoRecord;
    
  } catch (error) {
    console.error('Failed to create video record:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get user videos
export async function getUserVideos(userId: string): Promise<VideoRecord[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT v.*, u.name as user_name
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.user_id = $1
      ORDER BY v.created_at DESC
    `, [parseInt(userId)]);
    
    return result.rows.map(row => ({
      $id: row.id.toString(),
      id: row.id,
      $createdAt: row.created_at,
      $updatedAt: row.updated_at,
      title: row.title,
      description: row.description,
      file_path: row.file_path,
      file_size: row.file_size,
      duration: row.duration,
      thumbnail_path: row.thumbnail_path,
      user_id: row.user_id,
      userId: row.user_id.toString(),
      userName: row.user_name,
      quality: '1080p',
      views: 0,
      isPublic: row.is_public,
      isPublish: row.is_public,
      fileId: row.file_path,
      thumbnailUrl: row.thumbnail_path || '',
      subtitleFileId: null
    } as VideoRecord));
    
  } catch (error) {
    console.error('Failed to fetch user videos:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get public videos
export async function getPublicVideos(): Promise<VideoRecord[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT v.*, u.name as user_name
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.is_public = true
      ORDER BY v.created_at DESC
    `);
    
    return result.rows.map(row => ({
      $id: row.id.toString(),
      id: row.id,
      $createdAt: row.created_at,
      $updatedAt: row.updated_at,
      title: row.title,
      description: row.description,
      file_path: row.file_path,
      file_size: row.file_size,
      duration: row.duration,
      thumbnail_path: row.thumbnail_path,
      user_id: row.user_id,
      userId: row.user_id.toString(),
      userName: row.user_name,
      quality: '1080p',
      views: 0,
      isPublic: row.is_public,
      isPublish: row.is_public,
      fileId: row.file_path,
      thumbnailUrl: row.thumbnail_path || '',
      subtitleFileId: null
    } as VideoRecord));
    
  } catch (error) {
    console.error('Failed to fetch public videos:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get video by ID
export async function getVideoById(videoId: string): Promise<VideoRecord> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT v.*, u.name as user_name
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = $1
    `, [parseInt(videoId)]);
    
    if (result.rows.length === 0) {
      throw new Error('Video not found');
    }
    
    const row = result.rows[0];
    return {
      $id: row.id.toString(),
      id: row.id,
      $createdAt: row.created_at,
      $updatedAt: row.updated_at,
      title: row.title,
      description: row.description,
      file_path: row.file_path,
      file_size: row.file_size,
      duration: row.duration,
      thumbnail_path: row.thumbnail_path,
      user_id: row.user_id,
      userId: row.user_id.toString(),
      userName: row.user_name,
      quality: '1080p',
      views: 0,
      isPublic: row.is_public,
      isPublish: row.is_public,
      fileId: row.file_path,
      thumbnailUrl: row.thumbnail_path || '',
      subtitleFileId: null
    } as VideoRecord;
    
  } catch (error) {
    console.error('Failed to fetch video by ID:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Toggle video privacy settings
export async function toggleVideoPrivacy(videoId: string, userId: string): Promise<VideoRecord> {
  const client = await pool.connect();
  
  try {
    // Verify user owns this video
    const checkResult = await client.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [parseInt(videoId), parseInt(userId)]
    );
    
    if (checkResult.rows.length === 0) {
      throw new Error('Unauthorized: You can only modify your own videos');
    }
    
    // Toggle privacy settings
    const result = await client.query(`
      UPDATE videos 
      SET is_public = NOT is_public, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [parseInt(videoId), parseInt(userId)]);
    
    return await getVideoById(videoId);
    
  } catch (error) {
    console.error('Failed to toggle video privacy:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Toggle video publish status (In local implementation, we use is_public as publish status)
export async function toggleVideoPublishStatus(videoId: string, userId: string): Promise<VideoRecord> {
  return await toggleVideoPrivacy(videoId, userId);
}

// Delete video
export async function deleteVideo(videoId: string, fileId?: string): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'DELETE FROM videos WHERE id = $1 RETURNING *',
      [parseInt(videoId)]
    );
    
    return (result.rowCount ?? 0) > 0;
    
  } catch (error) {
    console.error('Failed to delete video:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Temporarily return empty array, as we haven't implemented file storage yet
export async function uploadFile(): Promise<any> {
  throw new Error('File upload not implemented in local database');
}

// Temporarily return empty array, as we haven't implemented reaction system yet
export async function addReaction(videoId: string, userId: string, userName: string, emoji: string): Promise<VideoReaction> {
  throw new Error('Reactions not implemented in local database');
}

export async function getVideoReactions(videoId: string): Promise<VideoReaction[]> {
  return [];
}

export async function incrementViews(videoId: string): Promise<void> {
  // Temporarily don't implement view counting
}

export async function updateVideoThumbnail(videoId: string, thumbnailUrl: string): Promise<VideoRecord> {
  const client = await pool.connect();
  
  try {
    await client.query(
      'UPDATE videos SET thumbnail_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [thumbnailUrl, parseInt(videoId)]
    );
    
    return await getVideoById(videoId);
    
  } catch (error) {
    console.error('Failed to update video thumbnail:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getFileUrl(fileId: string): Promise<{ url: string } | null> {
  // For local storage, we can return a local URL
  // Temporarily return null here, will implement file service later
  return null;
}