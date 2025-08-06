import { createAdminClient } from "@/lib/appwrite-server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { activityService, ActivityType } from "@/lib/services/activity-service";
import { headers } from "next/headers";

/**
 * OAuth 回调处理
 * 根据 Appwrite 官方文档实现
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const secret = url.searchParams.get("secret");

    console.log('OAuth callback received:', {
      userId: userId ? 'present' : 'missing',
      secret: secret ? 'present' : 'missing',
      url: url.toString()
    });

    // 检查必需参数
    if (!userId || !secret) {
      console.error('OAuth callback missing parameters:', { userId: !!userId, secret: !!secret });
      const redirectOrigin = url.origin.includes('localhost') 
        ? 'https://3000-a131201b2b93-web.clackypaas.com' 
        : url.origin;
      return NextResponse.redirect(`${redirectOrigin}/sign-in?error=oauth_incomplete`);
    }

    // 使用 Admin Client 创建会话
    const { account } = await createAdminClient();
    console.log('OAuth: Creating session with Admin Client');
    
    const session = await account.createSession(userId, secret);
    console.log('OAuth: Session created successfully');

    // 设置会话 cookie
    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    console.log('OAuth: Session cookie set');

    // 记录登录活动
    try {
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                       headersList.get('x-real-ip') || 
                       '0.0.0.0';
      
      await activityService.logActivity({
        userId,
        action: ActivityType.SIGN_IN,
        ipAddress,
        metadata: 'GitHub OAuth login'
      });

      console.log('OAuth: Activity logged successfully');
    } catch (activityError) {
      console.warn('OAuth: Failed to log activity:', activityError);
      // 不让活动记录失败影响登录流程
    }

    // 重定向到仪表板 - 使用正确的开发服务器地址
    const redirectOrigin = url.origin.includes('localhost') 
      ? 'https://3000-a131201b2b93-web.clackypaas.com' 
      : url.origin;
    
    console.log('OAuth: Redirecting to dashboard at:', `${redirectOrigin}/dashboard`);
    return NextResponse.redirect(`${redirectOrigin}/dashboard`);

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    
    // 清理可能设置的无效 cookie
    try {
      const cookieStore = await cookies();
      cookieStore.delete("appwrite-session");
    } catch (cookieError) {
      console.warn('Failed to clean up cookie:', cookieError);
    }

    const url = new URL(request.url);
    const redirectOrigin = url.origin.includes('localhost') 
      ? 'https://3000-a131201b2b93-web.clackypaas.com' 
      : url.origin;
    return NextResponse.redirect(`${redirectOrigin}/sign-in?error=oauth_session_failed`);
  }
}