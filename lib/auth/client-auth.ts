'use client';

// 客户端登录服务，用于弹窗登录
export interface AuthResult {
  success: boolean;
  error?: string;
  url?: string;
}

// 客户端邮箱登录/注册
export async function signInWithEmailPassword(
  email: string, 
  password: string, 
  name?: string
): Promise<AuthResult> {
  try {
    const endpoint = name ? '/api/auth/signup' : '/api/auth/signin';
    const body = name ? { email, password, name } : { email, password };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Authentication failed'
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

// 客户端GitHub OAuth
export async function signInWithGithub(): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/github', {
      method: 'POST',
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'GitHub OAuth failed'
      };
    }

    return {
      success: true,
      url: result.url
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

// 客户端Google OAuth
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Google OAuth failed'
      };
    }

    return {
      success: true,
      url: result.url
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}