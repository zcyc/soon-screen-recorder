import { Client, Account, Databases, Storage, Users, Query, ID } from 'node-appwrite';
import { cookies } from 'next/headers';

// 服务端配置
export const config = {
  endpoint: process.env.NEXT_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_APPWRITE_DATABASE_ID!,
  bucketId: process.env.NEXT_APPWRITE_BUCKET_ID!,
  apiKey: process.env.NEXT_APPWRITE_API_KEY || '',
  collectionsId: {
    videos: process.env.NEXT_APPWRITE_COLLECTION_VIDEO_ID || 'videos',
    reactions: process.env.NEXT_APPWRITE_COLLECTION_VIDEO_REACTIONS_ID || 'reactions',
    activity_logs: 'activity_logs'
  }
};

// 创建服务端客户端（使用 API Key 进行管理员级别的操作）
export async function createAdminClient() {
  if (!config.apiKey) {
    throw new Error('NEXT_APPWRITE_API_KEY is required for admin operations');
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
    users: new Users(client),
  };
}

// 创建会话客户端（使用用户 session 进行用户级别的操作）
export async function createSessionClient() {
  const cookieStore = await cookies();
  const session = cookieStore.get('appwrite-session');

  if (!session) {
    throw new Error('No session found');
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setSession(session.value);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

// 导出 Query 和 ID 用于其他文件
export { Query, ID };

// 导出配置常量
export const COLLECTIONS = config.collectionsId;
export const DATABASE_ID = config.databaseId;
export const BUCKET_ID = config.bucketId;