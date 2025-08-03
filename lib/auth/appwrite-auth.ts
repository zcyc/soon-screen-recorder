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
      // Redirect to GitHub OAuth
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/dashboard`
        : 'http://localhost:3000/dashboard';
      
      await account.createOAuth2Session(
        OAuthProvider.Github,
        redirectUrl, // Success URL
        `${window.location.origin}/sign-in?error=oauth_cancelled` // Failure URL
      );
    } catch (error) {
      throw error;
    }
  }
}