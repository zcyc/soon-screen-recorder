import { createAdminClient, config, Query, ID } from '@/lib/appwrite-server';

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  SHARE_CREATED = 'SHARE_CREATED',
  SHARE_ACCESSED = 'SHARE_ACCESSED',
  SHARE_UPDATED = 'SHARE_UPDATED',
  SHARE_DELETED = 'SHARE_DELETED',
}

export interface ActivityLog {
  $id: string;
  userId: string; // Appwrite user ID
  action: ActivityType;
  timestamp: string;
  ipAddress: string;
  metadata?: string;
  userName?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface NewActivityLog {
  userId: string;
  action: ActivityType;
  ipAddress?: string;
  metadata?: string;
}

class ActivityService {
  private readonly databaseId = config.databaseId;
  private readonly collectionId = 'activity_logs';

  async logActivity(data: NewActivityLog): Promise<ActivityLog> {
    try {
      const activityData = {
        userId: data.userId,
        action: data.action,
        ipAddress: data.ipAddress || '',
        metadata: data.metadata || null,
        timestamp: new Date().toISOString()
      };

      const { databases } = await createAdminClient();
      const result = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        activityData
      );

      return result as unknown as ActivityLog;
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }

  async getUserActivityLogs(userId: string, limit: number = 10): Promise<ActivityLog[]> {
    try {
      const { databases } = await createAdminClient();
      const result = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit)
        ]
      );

      return result.documents as unknown as ActivityLog[];
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      throw error;
    }
  }

  async getAllActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    try {
      const { databases } = await createAdminClient();
      const result = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(limit)
        ]
      );

      return result.documents as unknown as ActivityLog[];
    } catch (error) {
      console.error('Failed to fetch all activity logs:', error);
      throw error;
    }
  }
}

export const activityService = new ActivityService();