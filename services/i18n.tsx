import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Lang = 'es' | 'en';

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  voiceLocale: 'es-ES' | 'en-US';
};

import es from '../i18n/es.json';
import en from '../i18n/en.json';

const dictionaries: Record<Lang, Record<string, string>> = { es, en } as const;

function format(str: string, params?: Record<string, string | number>) {
  if (!params) return str;
  return str.replace(/\{(.*?)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export const I18nContext = createContext<I18nContextType>({
  lang: 'es',
  setLang: () => {},
  t: (k: string) => k,
  voiceLocale: 'es-ES',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem('lang')) || 'es';
    return saved === 'en' ? 'en' : 'es';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', lang);
    }
  }, [lang]);

  const t = useMemo(() => {
    const dict = dictionaries[lang];
    const fallback = dictionaries['es'];
    return (key: string, params?: Record<string, string | number>) => {
      const phrase = dict[key] ?? fallback[key] ?? key;
      return format(phrase, params);
    };
  }, [lang]);

  const value: I18nContextType = useMemo(() => ({
    lang,
    setLang: setLangState,
    t,
    voiceLocale: lang === 'en' ? 'en-US' : 'es-ES',
  }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  return useContext(I18nContext);
}