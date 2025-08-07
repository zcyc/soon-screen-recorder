import { createAdminClient, createSessionClient, config } from '@/lib/appwrite-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ID, Query, OAuthProvider } from 'node-appwrite';

/**
 * 统一的会话 cookie 设置选项
 */
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
};

/**
 * 设置会话 cookie
 */
async function setSessionCookie(secret: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('appwrite-session', secret, SESSION_COOKIE_OPTIONS);
}

/**
 * 删除会话 cookie
 */
async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('appwrite-session');
}

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
    await setSessionCookie(session.secret);

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
    await deleteSessionCookie();
  } catch (error: any) {
    // 即使删除会话失败，也要删除 cookie
    await deleteSessionCookie();
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
    
    console.log('Creating OAuth2 session for provider:', provider, {
      success,
      failure,
      nodeEnv: process.env.NODE_ENV
    });
    
    // createOAuth2Token 返回 OAuth URL 字符串
    const oauthUrl = await account.createOAuth2Token(
      oauthProvider,
      success,
      failure
    );
    
    console.log('OAuth2 URL created successfully');
    return oauthUrl;
  } catch (error: any) {
    console.error('OAuth2 session error:', error);
    throw new Error(error.message || 'Failed to create OAuth2 session');
  }
}

/**
 * 处理 OAuth 回调并建立会话
 */
export async function handleOAuthCallback(userId?: string, secret?: string): Promise<{ success: boolean; error?: string; user?: User }> {
  'use server';
  
  try {
    console.log('OAuth callback handler called with:', { userId, secret: secret ? '***' : undefined });
    console.log('Environment check:', {
      endpoint: process.env.NEXT_APPWRITE_ENDPOINT || 'MISSING',
      projectId: process.env.NEXT_APPWRITE_PROJECT_ID || 'MISSING',
      hasApiKey: !!process.env.NEXT_APPWRITE_API_KEY
    });
    
    if (!userId || !secret) {
      // 尝试从 URL 参数获取
      const cookieStore = await cookies();
      
      // 检查是否已有会话
      const existingSessionCookie = cookieStore.get('appwrite-session');
      if (existingSessionCookie?.value) {
        try {
          const user = await getCurrentUser();
          if (user) {
            console.log('OAuth callback: Found existing session for user:', user.$id);
            return { success: true, user };
          }
        } catch (error) {
          console.log('OAuth callback: Existing session invalid, continuing...');
        }
      }
      
      return { success: false, error: 'Missing OAuth callback parameters' };
    }
    
    // 使用提供的 secret 创建会话 cookie
    await setSessionCookie(secret);
    
    // 验证会话是否有效
    try {
      console.log('OAuth callback: Attempting to validate session with config:', {
        endpoint: config.endpoint,
        projectId: config.projectId,
        hasApiKey: !!config.apiKey
      });
      
      const user = await getCurrentUser();
      if (user) {
        console.log('OAuth callback success: Session established for user:', user.$id);
        return { success: true, user };
      } else {
        console.error('OAuth callback: getCurrentUser returned null');
        throw new Error('Failed to get user after setting session');
      }
    } catch (sessionError) {
      // 清理无效的 cookie
      await deleteSessionCookie();
      console.error('OAuth callback: Session validation failed:', sessionError);
      console.error('Session error details:', {
        message: sessionError instanceof Error ? sessionError.message : 'Unknown error',
        name: sessionError instanceof Error ? sessionError.name : 'UnknownError',
        stack: sessionError instanceof Error ? sessionError.stack : undefined
      });
      return { success: false, error: 'Failed to establish session' };
    }
    
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return { success: false, error: error.message || 'OAuth callback failed' };
  }
}

/**
 * 从 URL 搜索参数中提取 OAuth 回调数据
 */
export async function extractOAuthCallbackData(searchParams: URLSearchParams): Promise<{ userId?: string; secret?: string; error?: string }> {
  'use server';
  
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');
  const error = searchParams.get('error');
  
  console.log('Extracted OAuth callback data:', {
    hasUserId: !!userId,
    hasSecret: !!secret,
    error
  });
  
  return { userId: userId || undefined, secret: secret || undefined, error: error || undefined };
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