'use client';

export interface AuthResult {
  success: boolean;
  error?: string;
  url?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    created_at: string;
  };
}

export async function signInWithEmailPassword(
  email: string, 
  password: string, 
  name?: string
): Promise<AuthResult> {
  try {
    const endpoint = name ? '/api/auth/register' : '/api/auth/login';
    const body = name ? { email, password, name } : { email, password };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Authentication failed' };
    }
    
    return { success: true, user: data.user };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function signInWithGithub(): Promise<AuthResult> {
  // For now, return error - GitHub OAuth not implemented with local auth
  return { 
    success: false, 
    error: 'GitHub login is not available in the current preview version. Please use email login.' 
  };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  // For now, return error - Google OAuth not implemented with local auth
  return { 
    success: false, 
    error: 'Google login is not available in the current preview version. Please use email login.' 
  };
}

export async function signOut(): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });
    
    if (!response.ok) {
      return { success: false, error: 'Logout failed' };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function getCurrentUser(): Promise<AuthResult> {
  try {
    const response = await fetch('/api/user');
    
    if (!response.ok) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const data = await response.json();
    return { success: true, user: data.user };
    
  } catch (error) {
    console.error('Get user error:', error);
    return { success: false, error: 'Network error' };
  }
}