// This file has been migrated to use Node SDK with Server Actions
// All authentication now uses lib/auth/server-auth.ts

/*
import { account } from '../appwrite';
import { Models, OAuthProvider } from 'appwrite';

export interface User extends Models.User<Models.Preferences> {}

export class AuthService {
  static async createAccount(email: string, password: string, name: string) {
    try {
      const user = await account.create('unique()', email, password, name);
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async login(email: string, password: string) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      return session;
    } catch (error) {
      throw error;
    }
  }

  static async logout() {
    try {
      await account.deleteSession('current');
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      return null;
    }
  }

  static async updatePreferences(prefs: Models.Preferences) {
    try {
      return await account.updatePrefs(prefs);
    } catch (error) {
      throw error;
    }
  }

  static async loginWithGitHub() {
    try {
      // Get base URL from environment or fallback to current origin
      const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
          return window.location.origin;
        }
        return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      };

      const baseUrl = getBaseUrl();
      const redirectUrl = `${baseUrl}/dashboard`;
      const failureUrl = `${baseUrl}/sign-in?error=oauth_failed`;
      
      // Debug logging in development
      if (process.env.NEXT_PUBLIC_OAUTH_DEBUG === 'true') {
        console.log('OAuth Configuration:', {
          baseUrl,
          redirectUrl,
          failureUrl,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
        });
      }
      
      await account.createOAuth2Session(
        OAuthProvider.Github,
        redirectUrl, // Success URL
        failureUrl // Failure URL
      );
    } catch (error: any) {
      console.error('GitHub OAuth session creation failed:', error);
      // Provide more specific error information
      const errorMessage = error.message || 'OAuth authentication failed';
      throw new Error(`GitHub OAuth Error: ${errorMessage}`);
    }
  }

  static async handleOAuthCallback() {
    try {
      // This method can be called after OAuth redirect to ensure session is established
      const user = await account.get();
      return user;
    } catch (error: any) {
      console.error('OAuth callback handling failed:', error);
      throw new Error('Failed to complete OAuth authentication');
    }
  }
}
*/

// For backward compatibility, throw an error suggesting migration
export class AuthService {
  static async createAccount() {
    throw new Error('AuthService has been migrated to Server Actions. Use server-auth.ts functions instead.');
  }
  
  static async login() {
    throw new Error('AuthService has been migrated to Server Actions. Use server-auth.ts functions instead.');
  }
  
  static async logout() {
    throw new Error('AuthService has been migrated to Server Actions. Use server-auth.ts functions instead.');
  }
  
  static async getCurrentUser() {
    throw new Error('AuthService has been migrated to Server Actions. Use server-auth.ts functions instead.');
  }
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