import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, translations, LanguageInfo } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  supportedLanguages: SUPPORTED_LANGUAGES
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('dukaanos_language') as SupportedLanguage;
    if (saved && translations[saved]) {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('dukaanos_language', lang);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const currentDict = translations[language];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    // Fallback to English
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);

