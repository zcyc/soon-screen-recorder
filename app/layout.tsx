import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import Header from '@/components/header';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';
import I18nProvider from '@/components/i18n-provider';
import { getServerDetectedLocale } from '@/lib/locale-detection';

export const metadata: Metadata = {
  title: 'soon - Screen Recording Made Simple',
  description: 'Record your screen, camera, and audio with soon - the simple and powerful screen recording tool.'
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
  // Get the server-detected locale for SSR consistency
  const detectedLocale = await getServerDetectedLocale();
  
  return (
    <html
      lang={detectedLocale === 'zh' ? 'zh-CN' : 'en'}
      className={`${manrope.className}`}
      style={{ scrollbarGutter: 'stable' }}
      data-detected-locale={detectedLocale}
    >
      <body className="min-h-[100dvh] bg-background text-foreground" style={{ width: '100vw', maxWidth: '100%', overflowX: 'hidden' }}>
        <ThemeProvider>
          <I18nProvider initialLocale={detectedLocale}>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                {children}
              </div>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
