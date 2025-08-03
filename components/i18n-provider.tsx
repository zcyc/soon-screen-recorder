'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nContext, Locale, translations, type I18nContextType } from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
}

export default function I18nProvider({ children, defaultLocale = 'en' }: I18nProviderProps) {
  // Start with server-safe default, then update on client
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  // Initialize locale from client-side storage after mount
  useEffect(() => {
    setMounted(true);
    const savedLocale = localStorage.getItem('soon-locale') as Locale;
    
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'zh')) {
      // Only update if different from current locale to avoid unnecessary re-renders
      if (savedLocale !== locale) {
        setLocale(savedLocale);
      }
    } else {
      // Detect browser language preference
      const browserLang = navigator.language.toLowerCase();
      const detectedLocale: Locale = browserLang.startsWith('zh') ? 'zh' : 'en';
      
      if (detectedLocale !== locale) {
        setLocale(detectedLocale);
        localStorage.setItem('soon-locale', detectedLocale);
      }
    }
  }, [locale]);

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