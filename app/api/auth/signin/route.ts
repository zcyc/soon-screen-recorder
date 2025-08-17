import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth/server-auth';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signInSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // 使用server-auth登录
    await login(email, password);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sign in API error:', error);
    return NextResponse.json(
      { error: error.message || 'Invalid email or password' },
      { status: 401 }
    );
  }
}