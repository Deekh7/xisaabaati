import { createContext, useContext, useState, useEffect } from 'react';
import { translations, rtlLanguages } from '../i18n/translations';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('xi_lang') || 'so');

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  const isRTL = rtlLanguages.includes(lang);

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('xi_lang', newLang);
  };

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  return (
    <LangContext.Provider value={{ lang, t, isRTL, changeLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
