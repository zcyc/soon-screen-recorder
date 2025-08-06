import { createAdminClient, createSessionClient } from '@/lib/appwrite-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ID, Query, OAuthProvider } from 'node-appwrite';

export interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  registration: string;
  status: boolean;
  passwordUpdate: string;
  prefs: Record<string, any>;
}

/**
 * 创建用户账户
 */
export async function createAccount(email: string, password: string, name: string): Promise<User> {
  'use server';
  
  try {
    const { users } = await createAdminClient();
    
    // 使用 Admin Client 创建用户
    const user = await users.create(
      ID.unique(),
      email,
      undefined, // phone (optional)
      password,
      name
    );

    return user as User;
  } catch (error: any) {
    console.error('Create account error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
}

/**
 * 用户登录并创建会话
 */
export async function login(email: string, password: string) {
  'use server';
  
  try {
    const { account } = await createAdminClient();
    
    // 创建会话
    const session = await account.createEmailPasswordSession(email, password);
    
    // 设置会话 cookie
    const cookieStore = await cookies();
    cookieStore.set('appwrite-session', session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return session;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Invalid email or password');
  }
}

/**
 * 用户登出
 */
export async function logout() {
  'use server';
  
  try {
    const { account } = await createSessionClient();
    
    // 删除当前会话
    await account.deleteSession('current');
    
    // 删除会话 cookie
    const cookieStore = await cookies();
    cookieStore.delete('appwrite-session');
  } catch (error: any) {
    // 即使删除会话失败，也要删除 cookie
    const cookieStore = await cookies();
    cookieStore.delete('appwrite-session');
    console.error('Logout error:', error);
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(): Promise<User | null> {
  'use server';
  
  try {
    const { account } = await createSessionClient();
    const user = await account.get();
    return user as User;
  } catch (error) {
    return null;
  }
}

/**
 * 更新用户密码
 */
export async function updatePassword(oldPassword: string, newPassword: string) {
  'use server';
  
  try {
    const { account } = await createSessionClient();
    await account.updatePassword(newPassword, oldPassword);
  } catch (error: any) {
    console.error('Update password error:', error);
    throw new Error(error.message || 'Failed to update password');
  }
}

/**
 * 更新用户偏好设置
 */
export async function updatePreferences(prefs: Record<string, any>) {
  'use server';
  
  try {
    const { account } = await createSessionClient();
    return await account.updatePrefs(prefs);
  } catch (error: any) {
    console.error('Update preferences error:', error);
    throw new Error(error.message || 'Failed to update preferences');
  }
}

/**
 * 创建 OAuth2 会话
 */
export async function createOAuth2Session(provider: string, success?: string, failure?: string): Promise<string> {
  'use server';
  
  try {
    const { account } = await createAdminClient();
    
    // 在 Node SDK 中，我们需要使用 createOAuth2Token 方法
    // 将字符串 provider 转换为 OAuthProvider 枚举
    let oauthProvider: OAuthProvider;
    switch (provider.toLowerCase()) {
      case 'github':
        oauthProvider = OAuthProvider.Github;
        break;
      case 'google':
        oauthProvider = OAuthProvider.Google;
        break;
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    
    // createOAuth2Token 返回 OAuth URL 字符串
    const oauthUrl = await account.createOAuth2Token(
      oauthProvider,
      success,
      failure
    );
    
    return oauthUrl;
  } catch (error: any) {
    console.error('OAuth2 session error:', error);
    throw new Error(error.message || 'Failed to create OAuth2 session');
  }
}

/**
 * 验证用户会话
 */
export async function verifySession(): Promise<boolean> {
  'use server';
  
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    return false;
  }
}