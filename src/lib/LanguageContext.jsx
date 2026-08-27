import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'ka_language';
const LanguageContext = createContext(null);

function safeReadLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function safeWriteLanguage(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage may be blocked by privacy mode/browser policy. Language still works in memory.
  }
}

function initialLanguage() {
  if (typeof window === 'undefined') return 'id';
  const stored = safeReadLanguage();
  if (stored === 'id' || stored === 'en') return stored;
  if (window.location.pathname === '/en') return 'en';
  try {
    return navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en';
  } catch {
    return 'id';
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(initialLanguage);

  const setLanguage = (next) => {
    if (next !== 'id' && next !== 'en') return;
    safeWriteLanguage(next);
    setLanguageState(next);
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // DOM metadata must never block application rendering.
    }
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, isEnglish: language === 'en' }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
