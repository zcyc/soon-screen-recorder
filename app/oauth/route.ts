import { createAdminClient } from "@/lib/appwrite-server";
import { registrationConfig } from "@/lib/config";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { activityService, ActivityType } from "@/lib/services/activity-service";
import { headers } from "next/headers";

/**
 * OAuth callback handler
 * Implemented according to Appwrite official documentation
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

    // Check required parameters
    if (!userId || !secret) {
      console.error('OAuth callback missing parameters:', { userId: !!userId, secret: !!secret });
      const headersList = await headers();
      const redirectOrigin = headersList.get('host') 
        ? `https://${headersList.get('host')}` 
        : url.origin;
      return NextResponse.redirect(`${redirectOrigin}/sign-in?error=oauth_incomplete`);
    }

    // Create session using Admin Client
    const { account, users } = await createAdminClient();
    console.log('OAuth: Creating session with Admin Client');
    
    let session: any;
    
    // Check if registration is disabled
    if (!registrationConfig.enableRegistration) {
      try {
        // First create session to check if user exists
        session = await account.createSession(userId, secret);
        
        // Get user info to check creation time
        const user = await users.get(userId);
        const userCreationTime = new Date(user.$createdAt).getTime();
        const sessionCreationTime = new Date(session.$createdAt).getTime();
        const timeDiff = Math.abs(sessionCreationTime - userCreationTime);
        
        // If user and session creation times are close (less than 5 minutes), consider it a new registration
        if (timeDiff < 300000) { // 5 minutes
          console.log('OAuth: New user registration detected and registration disabled');
          
          // Delete the newly created session
          try {
            await account.deleteSession(session.$id);
          } catch (sessionError) {
            console.warn('OAuth: Failed to delete session:', sessionError);
          }
          
          // Delete the new user
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
        // Session already created, continue normal flow
      } catch (error) {
        console.error('OAuth: Error checking user registration status:', error);
        // If check fails, block login for security reasons
        const headersList = await headers();
        const redirectOrigin = headersList.get('host') 
          ? `https://${headersList.get('host')}` 
          : url.origin;
        return NextResponse.redirect(`${redirectOrigin}/oauth-complete?error=registration_disabled`);
      }
    } else {
      // Registration allowed, create session normally
      session = await account.createSession(userId, secret);
      console.log('OAuth: Session created successfully');
    }
    
    // Only set cookie if session exists
    if (!session) {
      console.error('OAuth: Session not created');
      const headersList = await headers();
      const redirectOrigin = headersList.get('host') 
        ? `https://${headersList.get('host')}` 
        : url.origin;
      return NextResponse.redirect(`${redirectOrigin}/oauth-complete?error=registration_disabled`);
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    console.log('OAuth: Session cookie set');

    // Record login activity
    try {
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                       headersList.get('x-real-ip') || 
                       '0.0.0.0';
      
      // Detect OAuth provider type (via referer or other methods)
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
      // Don't let activity logging failure affect login flow
    }

    // Redirect to OAuth completion page - for handling popup closure
    const headersList = await headers();
    const redirectOrigin = headersList.get('host') 
      ? `https://${headersList.get('host')}` 
      : url.origin;
    
    console.log('OAuth: Redirecting to oauth-complete at:', `${redirectOrigin}/oauth-complete`);
    return NextResponse.redirect(`${redirectOrigin}/oauth-complete`);

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    
    // Clean up potentially invalid cookies
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
    
    // Also redirect to oauth-complete page in catch block to properly close popup
    return NextResponse.redirect(`${redirectOrigin}/oauth-complete?error=oauth_session_failed`);
  }
}