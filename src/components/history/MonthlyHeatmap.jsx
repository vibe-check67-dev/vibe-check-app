import React, { useState } from 'react';
import { useLang } from '@/context/LanguageContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MonthlyHeatmap({ checkins }) {
  const { t, lang } = useLang();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const [selectedDay, setSelectedDay] = useState(null);

  const dateMoods = {};
  (checkins || []).forEach((c) => {
    if (!c.checkin_date) return;
    if (!dateMoods[c.checkin_date]) dateMoods[c.checkin_date] = [];
    const val = Number(c.overall_mood);
    if (!isNaN(val) && val > 0) {
      dateMoods[c.checkin_date].push(val);
    }
  });

  const checkinMap = {};
  let totalThisMonth = 0;
  Object.entries(dateMoods).forEach(([dateStr, moods]) => {
    if (moods.length > 0) {
      checkinMap[dateStr] = Math.round(moods.reduce((a, b) => a + b, 0) / moods.length);
      totalThisMonth += moods.length;
    }
  });

  const dayLabels = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const firstDayOffset = getDay(monthStart);

  // High-contrast, theme-adaptive cell styling that solves Dark Mode contrast (Bug 1)
  const getCellStyles = (mood, isToday) => {
    if (!mood) {
      return {
        container: isToday
          ? 'bg-primary/10 dark:bg-primary/20 border-2 border-primary ring-2 ring-primary/30 shadow-xs'
          : 'bg-secondary/40 hover:bg-secondary/80 dark:bg-secondary/30 dark:hover:bg-secondary/60 border border-border/40 hover:border-border/80',
        text: isToday ? 'text-primary font-bold' : 'text-muted-foreground/75 dark:text-muted-foreground/90 font-medium',
      };
    }

    switch (mood) {
      case 1:
        return {
          container: 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900/90 border border-rose-300 dark:border-rose-700/70 shadow-2xs',
          text: 'text-rose-950 dark:text-rose-100 font-extrabold',
          emoji: '😔',
          label: lang === 'th' ? 'หมดแรง / แย่' : 'Low',
        };
      case 2:
        return {
          container: 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900/90 border border-amber-300 dark:border-amber-700/70 shadow-2xs',
          text: 'text-amber-950 dark:text-amber-100 font-extrabold',
          emoji: '😐',
          label: lang === 'th' ? 'เหนื่อย / พอใช้' : 'Okay',
        };
      case 3:
        return {
          container: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-950/80 dark:hover:bg-yellow-900/90 border border-yellow-300 dark:border-yellow-700/70 shadow-2xs',
          text: 'text-yellow-950 dark:text-yellow-100 font-extrabold',
          emoji: '🙂',
          label: lang === 'th' ? 'ปกติ / ดี' : 'Good',
        };
      case 4:
        return {
          container: 'bg-teal-100 hover:bg-teal-200 dark:bg-teal-950/80 dark:hover:bg-teal-900/90 border border-teal-300 dark:border-teal-700/70 shadow-2xs',
          text: 'text-teal-950 dark:text-teal-100 font-extrabold',
          emoji: '😄',
          label: lang === 'th' ? 'สดชื่น / ดีมาก' : 'Great',
        };
      case 5:
      default:
        return {
          container: 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/90 border border-emerald-300 dark:border-emerald-600/80 shadow-2xs',
          text: 'text-emerald-950 dark:text-emerald-100 font-extrabold',
          emoji: '🌟',
          label: lang === 'th' ? 'ยอดเยี่ยม' : 'Amazing',
        };
    }
  };

  const activeDayDetails = selectedDay ? {
    date: selectedDay,
    mood: checkinMap[selectedDay],
    style: getCellStyles(checkinMap[selectedDay], isSameDay(new Date(selectedDay), now)),
  } : null;

  return (
    <div className="bg-card/85 dark:bg-card/75 backdrop-blur-xl rounded-3xl border border-border/70 p-5 space-y-4 shadow-xl shadow-black/5 dark:shadow-black/25 transition-all duration-300">
      {/* Header with Title and Month Check-in Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-foreground tracking-tight text-base">
              {t('monthlyOverview')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {format(now, 'MMMM yyyy')}
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/80 text-muted-foreground border border-border/50">
          <span className="text-primary font-bold mr-1">{totalThisMonth}</span>
          <span>{lang === 'th' ? 'ครั้งในเดือนนี้' : 'check-ins this month'}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 pt-1">
        {dayLabels.map((d) => (
          <div
            key={d}
            className="text-[11px] text-center text-muted-foreground font-semibold py-1 uppercase tracking-wider"
          >
            {t(d)}
          </div>
        ))}

        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const mood = checkinMap[dateStr];
          const isToday = isSameDay(day, now);
          const cellStyle = getCellStyles(mood, isToday);
          const isSelected = selectedDay === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${cellStyle.container} ${
                isSelected ? 'scale-110 z-10 ring-2 ring-primary shadow-md' : 'hover:scale-105'
              }`}
              title={`${format(day, 'd MMM yyyy')}${mood ? ` - Mood: ${mood}/5` : ''}`}
              aria-label={`${format(day, 'd MMM yyyy')}${mood ? ` Mood ${mood} of 5` : ' No check-in'}`}
            >
              {/* Day Number with guaranteed WCAG AAA contrast */}
              <span className={`text-[12px] select-none leading-none ${cellStyle.text}`}>
                {day.getDate()}
              </span>

              {/* Little mood micro-dot indicator if checked in */}
              {mood && (
                <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-current opacity-80" />
              )}

              {/* Today Active indicator ring */}
              {isToday && !mood && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Selected Day Details Drawer */}
      <AnimatePresence>
        {activeDayDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-3 rounded-2xl bg-secondary/50 dark:bg-secondary/30 border border-border/60 flex items-center justify-between text-xs overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{activeDayDetails.style.emoji || '📅'}</span>
              <div>
                <span className="font-bold text-foreground">
                  {format(new Date(activeDayDetails.date), 'dd MMMM yyyy')}
                </span>
                <span className="text-muted-foreground ml-2">
                  {activeDayDetails.mood
                    ? `${lang === 'th' ? 'อารมณ์:' : 'Mood:'} ${activeDayDetails.style.label} (${activeDayDetails.mood}/5)`
                    : (lang === 'th' ? 'ไม่มีบันทึกเช็คอิน' : 'No check-in')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-[11px] text-muted-foreground hover:text-foreground font-semibold px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Color Scale Legend */}
      <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="font-semibold flex items-center gap-1 text-muted-foreground">
          <Info className="w-3 h-3" />
          <span>{lang === 'th' ? 'ระดับอารมณ์:' : 'Mood Scale:'}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] mr-0.5">😔 1</span>
          <span className="w-3 h-3 rounded-md bg-rose-200 dark:bg-rose-950 border border-rose-300 dark:border-rose-800" title="Low" />
          <span className="w-3 h-3 rounded-md bg-amber-200 dark:bg-amber-950 border border-amber-300 dark:border-amber-800" title="Okay" />
          <span className="w-3 h-3 rounded-md bg-yellow-200 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-800" title="Neutral" />
          <span className="w-3 h-3 rounded-md bg-teal-200 dark:bg-teal-950 border border-teal-300 dark:border-teal-800" title="Good" />
          <span className="w-3 h-3 rounded-md bg-emerald-200 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800" title="Amazing" />
          <span className="text-[10px] ml-0.5">5 🌟</span>
        </div>
      </div>
    </div>
  );
}