import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLang } from '@/context/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

const slides = [
  { titleKey: 'onboard1Title', descKey: 'onboard1Desc', emoji: '✨' },
  { titleKey: 'onboard2Title', descKey: 'onboard2Desc', emoji: '🎯' },
  { titleKey: 'onboard3Title', descKey: 'onboard3Desc', emoji: '📊' },
];

export default function OnboardingSlides({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const { t } = useLang();

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-between p-6">
      <div className="self-end pt-2">
        <LanguageToggle />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-sm"
        >
          <div className="text-7xl mb-8">{slides[current].emoji}</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {t(slides[current].titleKey)}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t(slides[current].descKey)}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="w-full max-w-sm space-y-4 pb-8">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-primary' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        <Button onClick={handleNext} className="w-full h-12 rounded-2xl text-base font-semibold">
          {current === slides.length - 1 ? t('getStarted') : t('next')}
        </Button>

        {current < slides.length - 1 && (
          <button onClick={onComplete} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('skip')}
          </button>
        )}
      </div>
    </div>
  );
}