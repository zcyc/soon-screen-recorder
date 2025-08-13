"use server";

import { createAdminClient } from "@/lib/appwrite-server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { OAuthProvider } from "node-appwrite";

/**
 * GitHub OAuth 登录
 * 根据 Appwrite 官方文档实现
 */
export async function signInWithGithub() {
  try {
    const { account } = await createAdminClient();

    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";
    
    console.log('OAuth: Creating GitHub OAuth2 token with origin:', origin);
    
    const redirectUrl = await account.createOAuth2Token(
      OAuthProvider.Github,
      `${origin}/oauth`, // 成功回调路由
      `${origin}/sign-in?error=oauth_failed`, // 失败回调
    );

    console.log('OAuth: Redirect URL created successfully');
    return redirect(redirectUrl);
  } catch (error: any) {
    // redirect() 抛出 NEXT_REDIRECT 是正常行为，不是错误
    if (error.message === 'NEXT_REDIRECT') {
      throw error; // 重新抛出以执行重定向
    }
    console.error('OAuth: GitHub sign in error:', error);
    throw new Error(`GitHub OAuth failed: ${error.message}`);
  }
}

/**
 * GitHub OAuth 注册
 */
export async function signUpWithGithub() {
  try {
    const { account } = await createAdminClient();

    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";
    
    console.log('OAuth: Creating GitHub OAuth2 token for signup with origin:', origin);
    
    const redirectUrl = await account.createOAuth2Token(
      OAuthProvider.Github,
      `${origin}/oauth`, // 成功回调路由
      `${origin}/sign-up?error=oauth_failed`, // 失败回调
    );

    console.log('OAuth: Signup redirect URL created successfully');
    return redirect(redirectUrl);
  } catch (error: any) {
    // redirect() 抛出 NEXT_REDIRECT 是正常行为，不是错误
    if (error.message === 'NEXT_REDIRECT') {
      throw error; // 重新抛出以执行重定向
    }
    console.error('OAuth: GitHub sign up error:', error);
    throw new Error(`GitHub OAuth signup failed: ${error.message}`);
  }
}

/**
 * Google OAuth 登录
 * 根据 Appwrite 官方文档实现
 */
export async function signInWithGoogle() {
  try {
    const { account } = await createAdminClient();

    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";
    
    console.log('OAuth: Creating Google OAuth2 token with origin:', origin);
    
    const redirectUrl = await account.createOAuth2Token(
      OAuthProvider.Google,
      `${origin}/oauth`, // 成功回调路由
      `${origin}/sign-in?error=oauth_failed`, // 失败回调
    );

    console.log('OAuth: Google redirect URL created successfully');
    return redirect(redirectUrl);
  } catch (error: any) {
    // redirect() 抛出 NEXT_REDIRECT 是正常行为，不是错误
    if (error.message === 'NEXT_REDIRECT') {
      throw error; // 重新抛出以执行重定向
    }
    console.error('OAuth: Google sign in error:', error);
    throw new Error(`Google OAuth failed: ${error.message}`);
  }
}

/**
 * Google OAuth 注册
 */
export async function signUpWithGoogle() {
  try {
    const { account } = await createAdminClient();

    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";
    
    console.log('OAuth: Creating Google OAuth2 token for signup with origin:', origin);
    
    const redirectUrl = await account.createOAuth2Token(
      OAuthProvider.Google,
      `${origin}/oauth`, // 成功回调路由
      `${origin}/sign-up?error=oauth_failed`, // 失败回调
    );

    console.log('OAuth: Google signup redirect URL created successfully');
    return redirect(redirectUrl);
  } catch (error: any) {
    // redirect() 抛出 NEXT_REDIRECT 是正常行为，不是错误
    if (error.message === 'NEXT_REDIRECT') {
      throw error; // 重新抛出以执行重定向
    }
    console.error('OAuth: Google sign up error:', error);
    throw new Error(`Google OAuth signup failed: ${error.message}`);
  }
}