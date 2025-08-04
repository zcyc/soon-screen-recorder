import { headers, cookies } from 'next/headers';
import type { Locale } from './i18n';

/**
 * Get the detected locale from server-side, prioritizing saved preferences
 * This function should be called in Server Components
 */
export async function getServerDetectedLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const headersList = await headers();
    
    // 优先使用保存在 cookie 中的用户偏好
    const savedLocale = cookieStore.get('soon-locale')?.value as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'zh')) {
      return savedLocale;
    }
    
    // 其次使用中间件检测的语言
    const detectedLocale = headersList.get('x-detected-locale') as Locale;
    const finalLocale = detectedLocale && (detectedLocale === 'en' || detectedLocale === 'zh') 
      ? detectedLocale 
      : 'en';
    
    return finalLocale;
  } catch (error) {
    // Fallback to English if headers/cookies are not available
    return 'en';
  }
}