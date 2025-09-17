import { cookies } from 'next/headers';
import { getUserByToken } from './local-auth';

export interface User {
  $id: string; // 为了兼容性，使用Appwrite的格式  
  id: number;
  email: string;
  name: string;
  created_at: string;
}

/**
 * 获取当前用户 - 本地JWT认证版本
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    const user = await getUserByToken(token);
    
    if (!user) {
      return null;
    }
    
    // 转换为兼容Appwrite格式的用户对象
    return {
      $id: user.id.toString(), // 将数字ID转换为字符串，保持兼容性
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    };
    
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * 验证用户是否已认证
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * 获取用户ID（兼容Appwrite格式）
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user ? user.$id : null;
}