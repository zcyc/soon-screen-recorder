import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';


import { getServerInitialTheme } from '@/lib/server-theme-detection';

export const metadata: Metadata = {
  title: 'SOON - Screen Recording Made Simple',
  description: 'Record your screen, camera, and audio with SOON - the simple and powerful screen recording tool.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial']
});

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Get the initial theme for SSR consistency
  const initialTheme = await getServerInitialTheme();
  
  return (
    <html
      lang="en"
      className={`${manrope.className}${initialTheme.shouldApplyDarkClass ? ' dark' : ''}`}
      style={{ 
        scrollbarGutter: 'stable',
        '--primary': initialTheme.themeColor.primary,
        '--primary-foreground': initialTheme.themeColor.primaryForeground
      } as React.CSSProperties}

      data-initial-theme={initialTheme.actualMode}
    >
      <head>
        <meta name="permissions-policy" content="display-capture=*, camera=*, microphone=*, screen-wake-lock=*" />
      </head>

      <body className="min-h-[100dvh] bg-background text-foreground" style={{ width: '100vw', maxWidth: '100%', overflowX: 'hidden' }}>
        <ThemeProvider>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
