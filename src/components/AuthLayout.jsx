import React from "react";
import { useLang } from "@/context/LanguageContext";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, headerAction, children }) {
  const { lang, toggleLang } = useLang();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 pt-11 relative">
          <div className="absolute top-4 right-4 z-10">
            {headerAction !== undefined ? headerAction : (
              <button
                type="button"
                onClick={toggleLang}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted/70 hover:bg-muted text-foreground border border-border/60 transition-all cursor-pointer shadow-2xs"
                title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
                aria-label="Toggle language"
              >
                <span className={lang === 'th' ? 'opacity-100 font-bold' : 'opacity-40 grayscale-[40%]'}>🇹🇭</span>
                <span className="text-muted-foreground/60 text-[10px]">/</span>
                <span className={lang === 'en' ? 'opacity-100 font-bold' : 'opacity-40 grayscale-[40%]'}>🇺🇸</span>
                <span className="text-[11px] font-bold uppercase tracking-wider ml-0.5">{lang === 'th' ? 'TH' : 'EN'}</span>
              </button>
            )}
          </div>
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
