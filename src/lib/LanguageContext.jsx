import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'ka_language';
const LanguageContext = createContext(null);

function initialLanguage() {
  if (typeof window === 'undefined') return 'id';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'id' || stored === 'en') return stored;
  if (window.location.pathname === '/en') return 'en';
  return navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(initialLanguage);

  const setLanguage = (next) => {
    if (next !== 'id' && next !== 'en') return;
    localStorage.setItem(STORAGE_KEY, next);
    setLanguageState(next);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, isEnglish: language === 'en' }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
