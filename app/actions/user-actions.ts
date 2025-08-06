'use server';

import { getCurrentUser, verifySession, updatePreferences, createOAuth2Session, login, logout, createAccount } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type ActionResult = {
  success?: boolean;
  error?: string;
  data?: any;
};

// Get current user
export async function getCurrentUserAction(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'User not authenticated' };
    }

    return { success: true, data: user };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return { error: error.message || 'Failed to get user information' };
  }
}

// Verify user session
export async function verifySessionAction(): Promise<ActionResult> {
  try {
    const isValid = await verifySession();
    
    return { success: true, data: { isValid } };
  } catch (error: any) {
    console.error('Verify session error:', error);
    return { success: true, data: { isValid: false } };
  }
}

// Update user preferences
export async function updateUserPreferencesAction(preferences: Record<string, any>): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    const updatedPrefs = await updatePreferences(preferences);
    
    revalidatePath('/dashboard');
    
    return { success: true, data: updatedPrefs };
  } catch (error: any) {
    console.error('Update user preferences error:', error);
    return { error: error.message || 'Failed to update preferences' };
  }
}

// Login user
export async function loginAction(email: string, password: string): Promise<ActionResult> {
  try {
    await login(email, password);
    
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: error.message || 'Invalid email or password' };
  }
}

// Register user
export async function registerAction(email: string, password: string, name: string): Promise<ActionResult> {
  try {
    // 创建账户
    await createAccount(email, password, name);
    
    // 自动登录
    await login(email, password);
    
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { error: error.message || 'Failed to register user' };
  }
}

// Logout user
export async function logoutAction(): Promise<ActionResult> {
  try {
    await logout();
    
    revalidatePath('/');
    
    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { error: error.message || 'Failed to logout' };
  }
}

// Create OAuth2 session (for GitHub login)
export async function createOAuth2SessionAction(provider: string, success?: string, failure?: string): Promise<ActionResult> {
  try {
    await createOAuth2Session(provider, success, failure);
    
    return { success: true };
  } catch (error: any) {
    console.error('Create OAuth2 session error:', error);
    return { error: error.message || 'Failed to create OAuth2 session' };
  }
}