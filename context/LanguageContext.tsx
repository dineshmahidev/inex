// ─────────────────────────────────────────────────────────────────────────────
//  LanguageContext.tsx — App-wide language state with AsyncStorage persistence
// ─────────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, Translations, getT, LANGUAGES, LanguageMeta } from '@/constants/i18n';

const LANG_KEY = '@tracksy_language_v1';

interface LanguageContextValue {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => Promise<void>;
  languages: LanguageMeta[];
  currentLangMeta: LanguageMeta;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  t: getT('en'),
  setLanguage: async () => {},
  languages: LANGUAGES,
  currentLangMeta: LANGUAGES[0],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>('en');

  // Load persisted language on mount
  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then((val) => {
        if (val && ['en', 'tanglish', 'ta', 'hi'].includes(val)) {
          setLangState(val as Language);
        }
      })
      .catch(() => {});
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLangState(lang);
    try {
      await AsyncStorage.setItem(LANG_KEY, lang);
    } catch (_) {}
  }, []);

  const value: LanguageContextValue = {
    language,
    t: getT(language),
    setLanguage,
    languages: LANGUAGES,
    currentLangMeta: LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Use in any component to get translations and language controls */
export function useLanguage() {
  return useContext(LanguageContext);
}
