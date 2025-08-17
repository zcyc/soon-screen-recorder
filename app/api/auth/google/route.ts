import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { OAuthProvider } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const { account } = await createAdminClient();
    
    // 获取当前域名
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    console.log('API: Creating Google OAuth2 token with origin:', origin);
    
    const redirectUrl = await account.createOAuth2Token(
      OAuthProvider.Google,
      `${origin}/oauth`, // 成功回调路由
      `${origin}/?error=oauth_failed`, // 失败回调到主页
    );

    console.log('API: Google OAuth redirect URL created');
    
    return NextResponse.json({ 
      success: true, 
      url: redirectUrl 
    });
  } catch (error: any) {
    console.error('Google OAuth API error:', error);
    return NextResponse.json(
      { error: error.message || 'Google OAuth failed' },
      { status: 500 }
    );
  }
}