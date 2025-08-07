// This file has been migrated to use Node SDK with Server Actions
// All database operations now use lib/server-database.ts

/*
import { databases, storage } from './appwrite';
import { ID, Permission, Role } from 'appwrite';
import { config } from './appwrite';

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
  isPublish: boolean;
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

export class DatabaseService {
  // Video management methods would be here
}
*/

// For backward compatibility
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
  isPublish: boolean;
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

export class DatabaseService {
  static async createVideoRecord() {
    throw new Error('DatabaseService has been migrated to Server Actions. Use server-database.ts functions instead.');
  }
  
  static async getUserVideos() {
    throw new Error('DatabaseService has been migrated to Server Actions. Use server-database.ts functions instead.');
  }
  
  static async getVideoById() {
    throw new Error('DatabaseService has been migrated to Server Actions. Use server-database.ts functions instead.');
  }
}