import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';



export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Handle OAuth callback route
  if (pathname === '/oauth') {
    const response = NextResponse.next();
    response.headers.set('x-oauth-callback', 'true');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Add debug headers in development
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('x-oauth-params', JSON.stringify(Array.from(searchParams.entries())));
    }
    
    return response;
  }
  
  // Handle OAuth error callbacks to sign-in page
  if (pathname.startsWith('/sign-in') && searchParams.has('error')) {
    const response = NextResponse.next();
    response.headers.set('x-oauth-error', searchParams.get('error') || 'unknown');
    return response;
  }
  
  // Create response
  const response = NextResponse.next();
  
  // Add security headers for OAuth and auth pages
  if (pathname.includes('sign-in') || pathname.includes('sign-up') || pathname === '/dashboard' || pathname === '/oauth') {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
  runtime: 'nodejs'
};