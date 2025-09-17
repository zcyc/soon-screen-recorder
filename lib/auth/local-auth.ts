import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database-config';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

// Verify JWT token
export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch {
    return null;
  }
}

// Register new user
export async function registerUser(email: string, password: string, name: string): Promise<AuthResult> {
  const client = await pool.connect();
  
  try {
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return { success: false, error: 'User with this email already exists' };
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Insert new user
    const result = await client.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, name, passwordHash]
    );
    
    const user = result.rows[0];
    const token = generateToken(user.id);
    
    // Store session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const tokenHash = await hashPassword(token);
    await client.query(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      token
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  } finally {
    client.release();
  }
}

// Sign in user
export async function signInUser(email: string, password: string): Promise<AuthResult> {
  const client = await pool.connect();
  
  try {
    // Find user by email
    const result = await client.query(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Store session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const tokenHash = await hashPassword(token);
    await client.query(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      token
    };
    
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Sign in failed' };
  } finally {
    client.release();
  }
}

// Get user by token
export async function getUserByToken(token: string): Promise<User | null> {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) return null;
    
    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    };
    
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  } finally {
    client.release();
  }
}

// Sign out user (invalidate session)
export async function signOutUser(token: string): Promise<boolean> {
  const decoded = verifyToken(token);
  if (!decoded) return false;
  
  const client = await pool.connect();
  
  try {
    await client.query('DELETE FROM sessions WHERE user_id = $1', [decoded.userId]);
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  } finally {
    client.release();
  }
}