import { headers } from 'next/headers';
import type { Locale } from './i18n';

/**
 * Get the detected locale from server-side headers
 * This function should be called in Server Components
 */
export async function getServerDetectedLocale(): Promise<Locale> {
  try {
    const headersList = await headers();
    const detectedLocale = headersList.get('x-detected-locale') as Locale;
    return detectedLocale && (detectedLocale === 'en' || detectedLocale === 'zh') 
      ? detectedLocale 
      : 'en';
  } catch (error) {
    // Fallback to English if headers are not available
    return 'en';
  }
}