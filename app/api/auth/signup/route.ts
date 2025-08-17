import { NextRequest, NextResponse } from 'next/server';
import { createAccount, login } from '@/lib/auth/server-auth';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signUpSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    // 创建账户
    await createAccount(email, password, name);
    
    // 自动登录
    await login(email, password);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sign up API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}