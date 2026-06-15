'use client';
import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const langs = [
    { code: 'en' as const, label: 'EN', full: 'English' },
    { code: 'hi' as const, label: 'हि', full: 'Hindi' },
    { code: 'gu' as const, label: 'ગુ', full: 'Gujarati' },
  ];

  return (
    <div className="flex items-center gap-1 bg-emerald-50 rounded-full p-1 border border-emerald-200">
      {langs.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          title={lang.full}
          className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${
            locale === lang.code
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
