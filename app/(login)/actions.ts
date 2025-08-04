'use server';

// This file has been migrated to use Appwrite Auth
// All authentication logic now uses Appwrite instead of Drizzle

export {
  signInAction as signIn,
  signUpAction as signUp,
  signOutAction as signOut,
  updatePasswordAction as updatePassword
} from './appwrite-actions';