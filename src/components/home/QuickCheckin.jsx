import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { getTimeOfDay } from '@/utils/timeOfDay';
import { createCheckin } from '@/lib/database';

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
  const [selected, setSelected] = useState(null);

  const handleQuickCheckin = async (option) => {
    setSelected(option.mood);
    setLoading(true);
    try {
      const score = option.mood;
      const created = await createCheckin({
        energy: score,
        stress: Math.max(1, 6 - score),
        social: score,
        sleep: score,
        overall_mood: score,
        free_text: '',
        time_of_day: getTimeOfDay(),
        checkin_date: format(new Date(), 'yyyy-MM-dd'),
      });
      onCompleted && onCompleted(created);
      navigate(`/results/${created.id}`);
    } catch (err) {
      console.error('Quick checkin error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground text-center">{t('quickCheckin')}</p>
      <div className="flex justify-around">
        {quickOptions.map((opt) => (
          <motion.button
            key={opt.mood}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleQuickCheckin(opt)}
            disabled={loading}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading && selected === opt.mood ? (
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            ) : (
              <span className="text-3xl">{opt.emoji}</span>
            )}
            <span className="text-[10px] text-muted-foreground">{opt.label[lang] || opt.label.en}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}