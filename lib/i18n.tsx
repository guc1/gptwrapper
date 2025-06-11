export type Language = 'en' | 'nl';

export const translations = {
  en: {
    newChat: 'New Chat',
    deploy: 'Deploy',
    upgrade: 'Upgrade',
    loadingAuthStatus: 'Loading auth status',
    guest: 'Guest',
    toggleMode: 'Toggle {mode} mode',
    loginToAccount: 'Login to your account',
    signOut: 'Sign out',
    switchToDutch: 'Switch to Dutch',
    switchToEnglish: 'Switch to English',
  },
  nl: {
    newChat: 'Nieuw gesprek',
    deploy: 'Deploy',
    upgrade: 'Upgrade',
    loadingAuthStatus: 'Authenticatiestatus laden',
    guest: 'Gast',
    toggleMode: 'Schakel naar {mode}-modus',
    loginToAccount: 'Inloggen op je account',
    signOut: 'Uitloggen',
    switchToDutch: 'Schakel naar Nederlands',
    switchToEnglish: 'Schakel naar Engels',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function translate(
  lang: Language,
  key: TranslationKey,
  vars?: Record<string, string>,
): string {
  let text = translations[lang][key] as string;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}

import { useLanguage } from '@/components/language-provider';
import React from 'react';

export function useTranslation() {
  const { lang } = useLanguage();
  return React.useCallback(
    (key: TranslationKey, vars?: Record<string, string>) =>
      translate(lang, key, vars),
    [lang],
  );
}
