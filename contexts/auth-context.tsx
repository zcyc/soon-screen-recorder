'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, User } from '../lib/auth/appwrite-auth';

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
      // First try to get current user (handles both regular sessions and OAuth callbacks)
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      
      // If we got a user but we're on a login page, might be an OAuth callback
      if (currentUser && typeof window !== 'undefined') {
        const isLoginPage = window.location.pathname.includes('sign-in') || 
                           window.location.pathname.includes('sign-up');
        if (isLoginPage && !window.location.search.includes('error')) {
          // Successful OAuth callback, redirect to dashboard
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      // If we're on a potential OAuth callback URL, try handling it
      if (typeof window !== 'undefined' && 
          window.location.pathname.includes('dashboard') && 
          window.location.search) {
        try {
          const user = await AuthService.handleOAuthCallback();
          setUser(user);
          return;
        } catch (callbackError) {
          console.error('OAuth callback failed:', callbackError);
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await AuthService.login(email, password);
      const user = await AuthService.getCurrentUser();
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      await AuthService.createAccount(email, password, name);
      await AuthService.login(email, password);
      const user = await AuthService.getCurrentUser();
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const loginWithGitHub = async () => {
    try {
      await AuthService.loginWithGitHub();
      // OAuth redirect will handle the rest
      // The session check will be handled by the redirect URL
    } catch (error) {
      console.error('GitHub OAuth initiation failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
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