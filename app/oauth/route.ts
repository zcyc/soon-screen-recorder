import { createAdminClient } from "@/lib/appwrite-server";
import { registrationConfig } from "@/lib/config";
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
      const headersList = await headers();
      const redirectOrigin = headersList.get('host') 
        ? `https://${headersList.get('host')}` 
        : url.origin;
      return NextResponse.redirect(`${redirectOrigin}/sign-in?error=oauth_incomplete`);
    }

    // 使用 Admin Client 创建会话
    const { account, users } = await createAdminClient();
    console.log('OAuth: Creating session with Admin Client');
    
    // 检查注册是否被禁用
    if (!registrationConfig.enableRegistration) {
      try {
        // 先创建会话来检查用户是否存在
        const session = await account.createSession(userId, secret);
        
        // 获取用户信息检查创建时间
        const user = await users.get(userId);
        const userCreationTime = new Date(user.$createdAt).getTime();
        const sessionCreationTime = new Date(session.$createdAt).getTime();
        const timeDiff = Math.abs(sessionCreationTime - userCreationTime);
        
        // 如果用户和会话创建时间相近（小于5分钟），认为是新注册
        if (timeDiff < 300000) { // 5分钟
          console.log('OAuth: New user registration detected and registration disabled');
          
          // 删除刚创建的会话
          try {
            await account.deleteSession(session.$id);
          } catch (sessionError) {
            console.warn('OAuth: Failed to delete session:', sessionError);
          }
          
          // 删除新用户
          try {
            await users.delete(userId);
            console.log('OAuth: New user deleted due to registration disabled');
          } catch (deleteError) {
            console.warn('OAuth: Failed to delete new user:', deleteError);
          }
          
          const headersList = await headers();
          const redirectOrigin = headersList.get('host') 
            ? `https://${headersList.get('host')}` 
            : url.origin;
          return NextResponse.redirect(`${redirectOrigin}/oauth-complete?error=registration_disabled`);
        }
        
        console.log('OAuth: Existing user login allowed');
        // 会话已创建，继续正常流程
      } catch (error) {
        console.error('OAuth: Error checking user registration status:', error);
        // 如果检查失败，为了安全起见，阻止登录
        const headersList = await headers();
        const redirectOrigin = headersList.get('host') 
          ? `https://${headersList.get('host')}` 
          : url.origin;
        return NextResponse.redirect(`${redirectOrigin}/oauth-complete?error=registration_disabled`);
      }
    } else {
      // 注册允许，正常创建会话
      const session = await account.createSession(userId, secret);
      console.log('OAuth: Session created successfully');
    }
    
    // 会话在上面的逻辑中已经创建

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
      
      // 检测 OAuth 提供商类型（通过 referer 或者其他方式）
      const referer = headersList.get('referer') || '';
      let oauthProvider = 'OAuth';
      if (referer.includes('github.com')) {
        oauthProvider = 'GitHub OAuth';
      } else if (referer.includes('google.com') || referer.includes('accounts.google.com')) {
        oauthProvider = 'Google OAuth';
      }
      
      await activityService.logActivity({
        userId,
        action: ActivityType.SIGN_IN,
        ipAddress,
        metadata: `${oauthProvider} login`
      });

      console.log('OAuth: Activity logged successfully for:', oauthProvider);
    } catch (activityError) {
      console.warn('OAuth: Failed to log activity:', activityError);
      // 不让活动记录失败影响登录流程
    }

    // 重定向到OAuth完成页面 - 用于处理弹窗关闭
    const headersList = await headers();
    const redirectOrigin = headersList.get('host') 
      ? `https://${headersList.get('host')}` 
      : url.origin;
    
    console.log('OAuth: Redirecting to oauth-complete at:', `${redirectOrigin}/oauth-complete`);
    return NextResponse.redirect(`${redirectOrigin}/oauth-complete`);

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
    const headersList = await headers();
    const redirectOrigin = headersList.get('host') 
      ? `https://${headersList.get('host')}` 
      : url.origin;
    return NextResponse.redirect(`${redirectOrigin}/sign-in?error=oauth_session_failed`);
  }
}