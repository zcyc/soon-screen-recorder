'use server';

import { z } from 'zod';
import { createAccount, login, logout, getCurrentUser, updatePassword } from '@/lib/auth/server-auth';
import { activityService, ActivityType } from '@/lib/services/activity-service';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-forwarded-for')?.split(',')[0] || 
         headersList.get('x-real-ip') || 
         '0.0.0.0';
}

async function logActivity(
  userId: string,
  type: ActivityType,
  ipAddress?: string,
  metadata?: string
) {
  try {
    const ip = ipAddress || await getClientIP();
    await activityService.logActivity({
      userId,
      action: type,
      ipAddress: ip,
      metadata
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failure shouldn't break auth flow
  }
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export async function signInAction(prevState: ActionState, formData: FormData) {
  const result = signInSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { email, password } = result.data;

  try {
    // Sign in with Appwrite
    await login(email, password);
    
    // Get current user for activity logging
    const user = await getCurrentUser();
    if (user) {
      await logActivity(user.$id, ActivityType.SIGN_IN);
    }

    redirect('/');
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      error: error.message || 'Invalid email or password. Please try again.',
      email,
      password
    };
  }
}

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100)
});

export async function signUpAction(prevState: ActionState, formData: FormData) {
  const result = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { email, password, name } = result.data;

  try {
    // Create account with Appwrite
    const user = await createAccount(email, password, name);
    
    // Sign in automatically after registration
    await login(email, password);
    
    // Log activity
    await logActivity(user.$id, ActivityType.SIGN_UP);

    redirect('/');
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      error: error.message || 'Failed to create account. Please try again.',
      email,
      password,
      name
    };
  }
}

export async function signOutAction() {
  try {
    // Get current user before logout for activity logging
    const user = await getCurrentUser();
    
    // Sign out from Appwrite
    await logout();
    
    // Log activity if user was found
    if (user) {
      await logActivity(user.$id, ActivityType.SIGN_OUT);
    }

    redirect('/sign-in');
  } catch (error: any) {
    console.error('Sign out error:', error);
    // Even if logging fails, redirect to sign-in
    redirect('/sign-in');
  }
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export async function updatePasswordAction(prevState: ActionState, formData: FormData) {
  const result = updatePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { currentPassword, newPassword, confirmPassword } = result.data;

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' };
  }

  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    // Update password in Appwrite
    await updatePassword(currentPassword, newPassword);
    
    // Log activity
    await logActivity(user.$id, ActivityType.UPDATE_PASSWORD);

    return { success: 'Password updated successfully.' };
  } catch (error: any) {
    console.error('Update password error:', error);
    return {
      error: error.message || 'Failed to update password. Please check your current password.',
      currentPassword,
      newPassword,
      confirmPassword
    };
  }
}

const deleteAccountSchema = z.object({
  confirmText: z.string().refine((val) => val === 'DELETE', {
    message: 'Please type "DELETE" to confirm'
  })
});

export async function deleteAccountAction(prevState: ActionState, formData: FormData) {
  const result = deleteAccountSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    // Log activity before deletion
    await logActivity(user.$id, ActivityType.DELETE_ACCOUNT);

    // Note: Appwrite doesn't have a direct "delete user" method from client side
    // This would typically require an admin API call on the server side
    // For now, we'll just sign out and show a message
    await logout();

    return { 
      success: 'Account deletion requested. Please contact support to complete the process.',
    };
  } catch (error: any) {
    console.error('Delete account error:', error);
    return {
      error: error.message || 'Failed to delete account. Please try again.',
    };
  }
}