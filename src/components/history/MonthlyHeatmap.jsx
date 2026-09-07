import React from 'react';
import { useLang } from '@/context/LanguageContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

export default function MonthlyHeatmap({ checkins }) {
  const { t } = useLang();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dateMoods = {};
  (checkins || []).forEach(c => {
    if (!c.checkin_date) return;
    if (!dateMoods[c.checkin_date]) dateMoods[c.checkin_date] = [];
    const val = Number(c.overall_mood);
    if (!isNaN(val) && val > 0) {
      dateMoods[c.checkin_date].push(val);
    }
  });

  const checkinMap = {};
  Object.entries(dateMoods).forEach(([dateStr, moods]) => {
    if (moods.length > 0) {
      checkinMap[dateStr] = Math.round(moods.reduce((a, b) => a + b, 0) / moods.length);
    }
  });

  const moodColor = (mood) => {
    if (!mood) return 'bg-secondary';
    if (mood <= 1) return 'bg-red-200';
    if (mood <= 2) return 'bg-orange-200';
    if (mood <= 3) return 'bg-yellow-200';
    if (mood <= 4) return 'bg-green-200';
    return 'bg-emerald-300';
  };

  const dayLabels = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const firstDayOffset = getDay(monthStart);

  return (
    <div className="bg-card rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold text-foreground">{t('monthlyOverview')}</h3>
      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map(d => (
          <div key={d} className="text-[10px] text-center text-muted-foreground font-medium py-1">
            {t(d)}
          </div>
        ))}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const mood = checkinMap[dateStr];
          return (
            <div
              key={dateStr}
              className={`aspect-square rounded-lg ${moodColor(mood)} flex items-center justify-center`}
              title={mood ? `Mood: ${mood}/5` : 'No check-in'}
            >
              <span className="text-[10px] text-foreground/60">{day.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}