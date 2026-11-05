import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';

interface LanguageSelectorProps {
  className?: string;
  isDark?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  isDark = true
}) => {
  const { language, setLanguage, supportedLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
          isDark
            ? 'bg-[#17181c] text-white hover:bg-[#22242a] border border-zinc-800'
            : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200'
        }`}
        title="Select Language / भाषा चुनें / భాషను ఎంచుకోండి"
      >
        <Globe className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-zinc-200' : 'text-black'}`} />
        <span className="font-medium truncate max-w-[80px] sm:max-w-none">{currentLang.nativeName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform text-zinc-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden z-50 animate-fade-in text-zinc-900 py-1.5">
          <div className="px-3.5 py-2 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Select Language</span>
            <span className="text-[10px] font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
              8 Languages
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code as SupportedLanguage);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-zinc-100 font-bold text-black'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.nativeName}</span>
                    <span className="text-[11px] text-zinc-400 font-normal">({lang.name})</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-black shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

