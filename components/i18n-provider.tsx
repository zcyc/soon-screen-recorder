'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nContext, Locale, translations, type I18nContextType } from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

// Helper function to get the server-detected locale from document
function getServerDetectedLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  return document.documentElement.getAttribute('data-detected-locale') as Locale;
}

// Helper function to get saved locale from localStorage
function getSavedLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('soon-locale') as Locale;
  return (saved === 'en' || saved === 'zh') ? saved : null;
}

// Helper function to detect browser language
function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}

export default function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // Initialize state with the server-provided locale to ensure SSR consistency
  // This prevents hydration mismatches
  const [locale, setLocale] = useState<Locale>(() => {
    // Always use initialLocale from server for SSR consistency
    // Client-side adjustments will happen after hydration
    return initialLocale || 'en';
  });
  
  const [mounted, setMounted] = useState(false);

  // Client-side hydration and preference handling
  useEffect(() => {
    setMounted(true);
    
    // Only perform client-side logic after component is mounted
    // This prevents hydration mismatches
    
    // Check for saved user preference
    const savedLocale = getSavedLocale();
    
    if (savedLocale && savedLocale !== locale) {
      // User has a saved preference that differs from server detection
      setLocale(savedLocale);
    } else if (!savedLocale && initialLocale) {
      // No saved preference, so save the server-detected locale
      localStorage.setItem('soon-locale', initialLocale);
    }
  }, []); // Empty dependency array - run only once after mount

  // Save locale to localStorage when it changes
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    if (mounted) {
      localStorage.setItem('soon-locale', newLocale);
    }
  };

  const contextValue: I18nContextType = {
    locale,
    setLocale: handleSetLocale,
    t: translations[locale],
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}