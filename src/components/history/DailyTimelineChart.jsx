import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/context/LanguageContext';

const MOOD_EMOJIS = ['', '😔', '😐', '🙂', '😄', '🔥'];

export default function DailyTimelineChart({
  checkins = [],
  initialDate,
  title,
  subtitle,
}) {
  const { t, lang } = useLang();
  const locale = lang === 'th' ? th : enUS;

  const [selectedDate, setSelectedDate] = useState(() => {
    return initialDate || format(new Date(), 'yyyy-MM-dd');
  });

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  const handlePrevDay = () => {
    try {
      const d = parseISO(selectedDate);
      setSelectedDate(format(subDays(d, 1), 'yyyy-MM-dd'));
    } catch {
      // fallback
    }
  };

  const handleNextDay = () => {
    try {
      const d = parseISO(selectedDate);
      setSelectedDate(format(addDays(d, 1), 'yyyy-MM-dd'));
    } catch {
      // fallback
    }
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Filter and process check-ins for the selected date
  const dayCheckins = useMemo(() => {
    const list = checkins.filter((c) => c.checkin_date === selectedDate);

    // Sort by checkin_time or created_at
    return [...list].sort((a, b) => {
      const timeA = a.checkin_time || (a.created_at ? format(new Date(a.created_at), 'HH:mm') : '12:00');
      const timeB = b.checkin_time || (b.created_at ? format(new Date(b.created_at), 'HH:mm') : '12:00');
      return timeA.localeCompare(timeB);
    });
  }, [checkins, selectedDate]);

  // Prepare chart points across the 24-hour day
  const chartData = useMemo(() => {
    return dayCheckins.map((item) => {
      let timeStr = item.checkin_time;
      if (!timeStr && item.created_at) {
        try {
          timeStr = format(new Date(item.created_at), 'HH:mm');
        } catch {
          timeStr = '12:00';
        }
      }
      if (!timeStr) timeStr = '12:00';

      const [h, m] = timeStr.split(':').map(Number);
      const decimalHour = +(h + (m || 0) / 60).toFixed(2);
      const moodVal = Number(item.overall_mood || 3);

      return {
        id: item.id,
        decimalHour,
        timeStr,
        mood: moodVal,
        energy: Number(item.energy || 0),
        stress: Number(item.stress || 0),
        sleep: Number(item.sleep || 0),
        social: Number(item.social || 0),
        note: item.free_text || '',
        journal: item.journal_response || '',
        timeOfDay: item.time_of_day || 'morning',
      };
    });
  }, [dayCheckins]);

  // Summary calculations
  const dayAverageMood = useMemo(() => {
    if (!chartData.length) return null;
    const sum = chartData.reduce((acc, curr) => acc + curr.mood, 0);
    return (sum / chartData.length).toFixed(1);
  }, [chartData]);

  // Formatted date string display
  const formattedDateTitle = useMemo(() => {
    try {
      const d = parseISO(selectedDate);
      return format(d, 'EEEE, d MMMM yyyy', { locale });
    } catch {
      return selectedDate;
    }
  }, [selectedDate, locale]);

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="bg-card rounded-2xl border p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              {title || t('dailyTimelineTitle') || 'Daily Mood Timeline'}
            </h3>
            {chartData.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {chartData.length} {t('todayCheckinCount') || 'check-ins'}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subtitle || t('dailyTimelineSubtitle') || 'Track how your mood shifts throughout the day'}
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/50 p-1 rounded-xl border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="h-7 w-7 rounded-lg cursor-pointer"
            title={t('yesterday') || 'Previous Day'}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <input
            type="date"
            value={selectedDate}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-semibold text-foreground px-1 py-0.5 outline-none cursor-pointer font-mono"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={selectedDate >= format(new Date(), 'yyyy-MM-dd')}
            className="h-7 w-7 rounded-lg cursor-pointer disabled:opacity-30"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {!isToday && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleToday}
              className="h-7 px-2 text-[11px] font-bold rounded-lg cursor-pointer"
            >
              {t('today') || 'Today'}
            </Button>
          )}
        </div>
      </div>

      {/* Date Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-muted/30 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{formattedDateTitle}</span>
        </div>

        {dayAverageMood && (
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span>{t('averageDailyMood') || 'Avg Mood'}:</span>
            <span className="font-bold text-primary font-mono">{dayAverageMood} / 5</span>
            <span>{MOOD_EMOJIS[Math.round(Number(dayAverageMood))] || '✨'}</span>
          </div>
        )}
      </div>

      {/* Timeline Chart View */}
      {chartData.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center rounded-xl border border-dashed text-center p-4 gap-2 text-muted-foreground">
          <span className="text-3xl opacity-60">📅</span>
          <p className="text-xs font-medium">
            {t('noCheckinsOnDate') || 'No check-ins recorded for this day'}
          </p>
          <span className="text-[11px] text-muted-foreground/70">
            {lang === 'th' ? 'ลองเลือกดูวันอื่น หรือบันทึกเช็คอินเลย' : 'Select another date or check in now'}
          </span>
        </div>
      ) : (
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 16, left: -10, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

              <XAxis
                dataKey="decimalHour"
                type="number"
                domain={[0, 24]}
                ticks={[0, 4, 8, 12, 16, 20, 24]}
                tickFormatter={(val) => `${String(Math.floor(val)).padStart(2, '0')}:00`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(val) => `${MOOD_EMOJIS[val] || ''} ${val}`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={38}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover text-popover-foreground rounded-xl p-3 border shadow-md text-xs space-y-1.5 max-w-xs">
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary" />
                          {d.timeStr?.slice(0, 5)}{lang === 'th' ? ' น.' : ''}
                        </span>
                        <span className="font-mono font-bold text-primary">
                          {MOOD_EMOJIS[d.mood]} {d.mood}/5
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground pt-0.5">
                        <span>⚡ {t('energy') || 'Energy'}: <strong className="text-foreground">{d.energy}/5</strong></span>
                        <span>🔥 {t('stress') || 'Stress'}: <strong className="text-foreground">{d.stress}/5</strong></span>
                        <span>🌙 {t('sleep') || 'Sleep'}: <strong className="text-foreground">{d.sleep}/5</strong></span>
                        <span>💬 {t('social') || 'Social'}: <strong className="text-foreground">{d.social}/5</strong></span>
                      </div>
                      {d.note && (
                        <p className="text-[11px] text-foreground italic bg-muted/40 p-1.5 rounded-lg border">
                          "{d.note}"
                        </p>
                      )}
                    </div>
                  );
                }}
              />

              <Line
                type="monotone"
                dataKey="mood"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{
                  r: 5,
                  fill: 'hsl(var(--primary))',
                  stroke: 'white',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 7,
                  fill: 'hsl(var(--primary))',
                  stroke: 'white',
                  strokeWidth: 2,
                }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
