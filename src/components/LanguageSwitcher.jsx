import React from 'react';
import { Globe2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSwitcher({ compact = false, className = '' }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div role="group" aria-label={language === 'id' ? 'Pilih bahasa' : 'Select language'} className={`inline-flex items-center rounded-xl border border-sky-400/20 bg-[#07111d]/85 p-1 ${className}`}>
      {!compact && <Globe2 className="mx-1.5 h-3.5 w-3.5 text-sky-300" aria-hidden="true" />}
      {['id', 'en'].map(code => (
        <button key={code} type="button" onClick={() => setLanguage(code)} aria-pressed={language === code}
          className={`min-h-8 rounded-lg px-2.5 text-[10px] font-extrabold transition ${language === code ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
