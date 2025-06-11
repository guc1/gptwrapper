'use client';
import React from 'react';
import type { Language } from '@/lib/i18n';

const LANGUAGE_COOKIE_NAME = 'language';
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageProvider({
  children,
  defaultLang,
}: {
  children: React.ReactNode;
  defaultLang: Language;
}) {
  const [lang, setLangState] = React.useState<Language>(defaultLang);

  React.useEffect(() => {
    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${LANGUAGE_COOKIE_NAME}=`))
      ?.split('=')[1];
    if (value === 'en' || value === 'nl') {
      setLangState(value as Language);
    }
  }, []);

  const setLang = React.useCallback((newLang: Language) => {
    setLangState(newLang);
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${newLang}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}`;
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
