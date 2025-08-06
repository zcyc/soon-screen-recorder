// This file has been migrated to use Node SDK with Server Actions
// Authentication middleware is now handled by Next.js middleware.ts

/*
import { redirect } from 'next/navigation';
import { AuthService, User } from '@/lib/auth/appwrite-auth';

export interface ActionState {
  error?: string;
  success?: string;
  [key: string]: any;
}

// Higher-order function to wrap server actions with authentication
export function withAuth<T extends any[]>(
  action: (user: User, ...args: T) => Promise<ActionState>
) {
  return async (prevState: ActionState, formData: FormData) => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        redirect('/sign-in');
        return { error: 'User is not authenticated' };
      }
      
      return await action(user, ...([] as any));
    } catch (error: any) {
      console.error('Authentication middleware error:', error);
      return { error: 'Authentication failed' };
    }
  };
}

// Authentication guard for server actions
export async function requireAuth(): Promise<User> {
  const user = await AuthService.getCurrentUser();
  if (!user) {
    redirect('/sign-in');
    throw new Error('User is not authenticated');
  }
  return user;
}

// Optional authentication (doesn't redirect if not authenticated)
export async function optionalAuth(): Promise<User | null> {
  try {
    return await AuthService.getCurrentUser();
  } catch (error) {
    return null;
  }
}

// Middleware for form actions that require authentication
export function requireAuthAction<T extends any[]>(
  action: (user: User, formData: FormData, ...args: T) => Promise<ActionState>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      redirect('/sign-in');
      throw new Error('User is not authenticated');
    }
    return await action(user, formData);
  };
}
*/

// For backward compatibility
export interface ActionState {
  error?: string;
  success?: string;
  [key: string]: any;
}

export function withAuth<T extends any[]>() {
  throw new Error('Authentication middleware has been migrated to use Server Actions. Use getCurrentUser() from server-auth.ts instead.');
}

export async function requireAuth() {
  throw new Error('Authentication middleware has been migrated to use Server Actions. Use getCurrentUser() from server-auth.ts instead.');
}

export async function optionalAuth() {
  throw new Error('Authentication middleware has been migrated to use Server Actions. Use getCurrentUser() from server-auth.ts instead.');
}