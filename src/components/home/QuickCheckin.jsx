import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Loader2, Check, Sparkles } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { getTimeOfDay } from '@/utils/timeOfDay';
import { createCheckin } from '@/lib/database';
import ShimmerButton from '@/components/ui/shimmer-button';

const quickOptions = [
  { emoji: '😔', label: { en: 'Low', th: 'แย่' }, mood: 1 },
  { emoji: '😐', label: { en: 'Okay', th: 'พอใช้' }, mood: 2 },
  { emoji: '🙂', label: { en: 'Good', th: 'ดี' }, mood: 3 },
  { emoji: '😄', label: { en: 'Great', th: 'ดีมาก' }, mood: 4 },
];

export default function QuickCheckin({ onCompleted }) {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const selectedOption = quickOptions.find((opt) => opt.mood === selectedMood);

  const handleSelect = (option) => {
    if (loading) return;
    setSelectedMood(option.mood);
  };

  const handleConfirmCheckin = async () => {
    if (!selectedOption || loading) return;
    setLoading(true);
    try {
      const score = selectedOption.mood;
      const created = await createCheckin({
        energy: score,
        stress: Math.max(1, 6 - score),
        social: score,
        sleep: score,
        overall_mood: score,
        free_text: '',
        time_of_day: getTimeOfDay(),
        checkin_date: format(new Date(), 'yyyy-MM-dd'),
        checkin_time: format(new Date(), 'HH:mm'),
      });
      onCompleted && onCompleted(created);
      navigate(`/results/${created.id}`);
    } catch (err) {
      console.error('Quick checkin error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="bg-card/85 dark:bg-card/75 backdrop-blur-xl rounded-3xl border border-border/70 p-5 space-y-4 shadow-xl shadow-black/5 dark:shadow-black/25 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <p className="text-sm font-bold text-foreground tracking-tight">
            {t('quickCheckin')}
          </p>
        </div>
        {selectedMood && !loading && (
          <button
            type="button"
            onClick={() => setSelectedMood(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {t('cancelSelection')}
          </button>
        )}
      </div>

      {/* Emoji Selector Row */}
      <div className="flex justify-around items-center pt-1 pb-2">
        {quickOptions.map((opt) => {
          const isSelected = selectedMood === opt.mood;
          const isDimmed = selectedMood !== null && !isSelected;

          return (
            <motion.button
              key={opt.mood}
              type="button"
              layout
              onClick={() => handleSelect(opt)}
              disabled={loading}
              animate={
                isSelected
                  ? { scale: 1.28, y: -6 }
                  : isDimmed
                  ? { scale: 0.92, opacity: 0.6, y: 0 }
                  : { scale: 1, opacity: 1, y: 0 }
              }
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              aria-pressed={isSelected}
              aria-label={opt.label[lang] || opt.label.en}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'bg-primary/15 dark:bg-primary/25 ring-2 ring-primary shadow-lg shadow-primary/25'
                  : 'hover:bg-secondary/80'
              }`}
            >
              {/* Pulsing Aura Halo for Selected State */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/30 to-amber-400/20 blur-sm pointer-events-none -z-10"
                />
              )}

              <span className="text-3xl sm:text-4xl select-none filter drop-shadow-sm">
                {opt.emoji}
              </span>
              <span
                className={`text-[11px] font-bold tracking-tight transition-colors ${
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {opt.label[lang] || opt.label.en}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Confirmation Slide-up Action Panel */}
      <AnimatePresence mode="wait">
        {selectedOption && (
          <motion.div
            key="confirm-box"
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-3 pt-2 border-t border-border/50 overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-muted-foreground">
                {lang === 'th' ? 'อารมณ์ที่คุณเลือก:' : 'Selected Mood:'}
              </span>
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <span className="text-base">{selectedOption.emoji}</span>
                <span>{selectedOption.label[lang] || selectedOption.label.en}</span>
              </span>
            </div>

            <ShimmerButton
              onClick={handleConfirmCheckin}
              disabled={loading}
              className="w-full h-11 text-sm font-bold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'th' ? 'กำลังบันทึก...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{t('confirmQuickCheckin')}</span>
                </>
              )}
            </ShimmerButton>

            <p className="text-[11px] text-center text-muted-foreground/80">
              {t('tapToChange')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}