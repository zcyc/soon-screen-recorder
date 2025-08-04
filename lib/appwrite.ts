import { Client, Account, Databases, Storage, Functions, Query } from 'appwrite';

// Debug: Log environment variables
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_OAUTH_DEBUG === 'true') {
  console.log('Appwrite config:', {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL
  });
}

// Create Appwrite client with optimized configuration for cookie handling
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// Configure client for better third-party cookie handling
if (typeof window !== 'undefined') {
  // Set the locale for better user experience
  client.setLocale('en');
  
  // Additional client configuration for browser environment
  // This helps with cookie handling in cross-domain scenarios
  if (window.location.origin !== 'http://localhost:3000' && 
      window.location.origin !== 'https://localhost:3000') {
    // Production environment configurations
    if (process.env.NEXT_PUBLIC_OAUTH_DEBUG === 'true') {
      console.log('Production OAuth configuration active for origin:', window.location.origin);
    }
  }
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { Query };
export default client;

// Configuration constants
export const config = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
  // Collections
  collectionsId: {
    videos: 'videos',
    reactions: 'reactions',
    activity_logs: 'activity_logs'
  }
};