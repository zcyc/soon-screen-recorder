'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../lib/auth/server-auth';
import { getCurrentUserAction, verifySessionAction } from '@/app/actions/user-actions';
import { signIn, signUp, signOut } from '@/app/(login)/actions';
import { createOAuth2SessionAction } from '@/app/actions/user-actions';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      // First try to get current user
      const result = await getCurrentUserAction();
      
      if (result.success && result.data) {
        setUser(result.data);
        
        // If we got a user but we're on a login page, might be an OAuth callback
        if (typeof window !== 'undefined') {
          const isLoginPage = window.location.pathname.includes('sign-in') || 
                             window.location.pathname.includes('sign-up');
          if (isLoginPage && !window.location.search.includes('error')) {
            // Successful OAuth callback, redirect to dashboard
            window.location.href = '/dashboard';
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Note: This function is kept for backward compatibility
    // The actual login should be handled by form actions
    throw new Error('Please use the login form actions instead');
  };

  const register = async (email: string, password: string, name: string) => {
    // Note: This function is kept for backward compatibility
    // The actual registration should be handled by form actions
    throw new Error('Please use the registration form actions instead');
  };

  const loginWithGitHub = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const redirectUrl = `${baseUrl}/auth/callback`;
      const failureUrl = `${baseUrl}/auth/callback?error=oauth_failed`;
      
      console.log('AuthContext: Initiating GitHub OAuth with:', { redirectUrl, failureUrl });
      
      const result = await createOAuth2SessionAction('github', redirectUrl, failureUrl);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // OAuth redirect will handle the rest
    } catch (error) {
      console.error('GitHub OAuth initiation failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Note: This function is kept for backward compatibility
    // The actual logout should be handled by form actions
    throw new Error('Please use the logout form action instead');
  };

  const refreshUser = async () => {
    try {
      const result = await getCurrentUserAction();
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    register,
    loginWithGitHub,
    logout,
    loading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}