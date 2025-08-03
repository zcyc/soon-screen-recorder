'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nContext, Locale, translations, type I18nContextType } from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
}

export default function I18nProvider({ children, defaultLocale = 'zh' }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  // Load locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('soon-locale') as Locale;
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'zh')) {
        setLocale(savedLocale);
      }
    }
  }, []);

  // Save locale to localStorage when it changes
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
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