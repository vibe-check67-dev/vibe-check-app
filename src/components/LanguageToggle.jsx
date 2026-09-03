import React from 'react';
import { useLang } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

export default function LanguageToggle() {
  const { lang, toggleLang } = useLang();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLang}
      className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide border-border hover:bg-secondary transition-all"
    >
      {lang === 'en' ? '🇹🇭 ไทย' : '🇬🇧 EN'}
    </Button>
  );
}