import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define supported locales
const locales = ['en', 'zh'] as const;
type Locale = (typeof locales)[number];

// Parse Accept-Language header and determine best matching locale
function getLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return 'en';
  
  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q = '1'] = lang.trim().split(';q=');
      return { locale: locale.toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);
  
  // Find the first matching supported locale
  for (const { locale } of languages) {
    if (locale.startsWith('zh')) return 'zh';
    if (locale.startsWith('en')) return 'en';
  }
  
  return 'en'; // Default fallback
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Handle OAuth callback scenarios
  if (pathname === '/dashboard' && searchParams.has('userId')) {
    // This looks like an OAuth callback from Appwrite
    // Add headers to help with session establishment
    const response = NextResponse.next();
    response.headers.set('x-oauth-callback', 'true');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
  
  // Handle OAuth error callbacks
  if (pathname.startsWith('/sign-in') && searchParams.has('error')) {
    const response = NextResponse.next();
    response.headers.set('x-oauth-error', searchParams.get('error') || 'unknown');
    return response;
  }
  
  // Detect user's preferred language from Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  const detectedLocale = getLocale(acceptLanguage);
  
  // Create response with detected locale in headers
  const response = NextResponse.next();
  response.headers.set('x-detected-locale', detectedLocale);
  
  // Add security headers for OAuth pages
  if (pathname.includes('sign-in') || pathname.includes('sign-up') || pathname === '/dashboard') {
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