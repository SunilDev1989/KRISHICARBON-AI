'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Locale = 'en' | 'hi' | 'gu';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const loadTranslations = useCallback(async (loc: Locale) => {
    try {
      const res = await fetch(`/locales/${loc}.json`);
      const data = await res.json();
      setTranslations(data);
    } catch {
      console.error(`Failed to load translations for locale: ${loc}`);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('krishicarbon_locale') as Locale | null;
    const initial: Locale = saved && ['en', 'hi', 'gu'].includes(saved) ? saved : 'en';
    setLocaleState(initial);
    loadTranslations(initial);
  }, [loadTranslations]);

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    localStorage.setItem('krishicarbon_locale', loc);
    loadTranslations(loc);
  };

  const t = useCallback(
    (key: string): string => {
      return translations[key] ?? key;
    },
    [translations]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
