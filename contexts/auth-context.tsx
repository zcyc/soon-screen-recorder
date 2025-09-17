'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut as localSignOut } from '@/lib/auth/client-auth-local';

interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

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
      // Get current user from local auth
      const result = await getCurrentUser();
      
      if (result.success && result.user) {
        setUser(result.user);
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
    // GitHub OAuth is not available with local authentication
    throw new Error('GitHub login is not available in the current preview version. Please use email login.');
  };

  const logout = async () => {
    try {
      await localSignOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      console.log('AuthContext: refreshUser called');
      const result = await getCurrentUser();
      console.log('AuthContext: getCurrentUser result:', result);
      
      if (result.success && result.user) {
        console.log('AuthContext: setting user state:', {
          userId: result.user.id,
          userName: result.user.name,
          userEmail: result.user.email
        });
        setUser(result.user);
      } else {
        console.log('AuthContext: clearing user state, reason:', result.error || 'unknown');
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