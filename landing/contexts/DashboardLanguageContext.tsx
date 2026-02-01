'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'pl';

interface DashboardLanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  dict: any;
}

const DashboardLanguageContext = createContext<DashboardLanguageContextType | undefined>(undefined);

export function DashboardLanguageProvider({
  children,
  initialDict
}: {
  children: ReactNode;
  initialDict: any;
}) {
  const [lang, setLangState] = useState<Language>('en');
  const [dict, setDict] = useState(initialDict);

  useEffect(() => {
    // Load language from localStorage
    const savedLang = localStorage.getItem('dashboard_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'pl')) {
      setLangState(savedLang);
      loadDictionary(savedLang);
    }
  }, []);

  const loadDictionary = async (language: Language) => {
    try {
      const response = await fetch(`/api/dashboard-dictionary?lang=${language}`);
      const newDict = await response.json();
      setDict(newDict);
    } catch (error) {
      console.error('Failed to load dictionary:', error);
    }
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('dashboard_lang', newLang);
    loadDictionary(newLang);
  };

  return (
    <DashboardLanguageContext.Provider value={{ lang, setLang, dict }}>
      {children}
    </DashboardLanguageContext.Provider>
  );
}

export function useDashboardLanguage() {
  const context = useContext(DashboardLanguageContext);
  if (context === undefined) {
    throw new Error('useDashboardLanguage must be used within a DashboardLanguageProvider');
  }
  return context;
}
