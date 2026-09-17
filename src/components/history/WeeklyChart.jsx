import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useLang } from '@/context/LanguageContext';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { sentimentScore } from '@/utils/sentiment';

const MOOD_EMOJIS = ['', '😔', '😐', '🙂', '😄', '🔥'];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function WeeklyChart({ checkins = [], dateRange }) {
  const { t, lang } = useLang();
  const locale = lang === 'th' ? th : enUS;

  const end = dateRange?.end ? new Date(dateRange.end) : new Date();
  const start = dateRange?.start ? new Date(dateRange.start) : subDays(new Date(), 6);

  // Group check-ins by date to handle multiple records per day
  const checkinGroupMap = {};
  checkins.forEach((c) => {
    if (!c.checkin_date) return;
    if (!checkinGroupMap[c.checkin_date]) {
      checkinGroupMap[c.checkin_date] = [];
    }
    checkinGroupMap[c.checkin_date].push(c);
  });

  const days = eachDayOfInterval({ start, end });
  const isShort = days.length <= 7;
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  // Calculate overall average mood for current date range
  const validOverallMoods = checkins
    .map((c) => Number(c.overall_mood))
    .filter((v) => !isNaN(v) && v > 0);
  const overallAvgMood =
    validOverallMoods.length > 0
      ? (validOverallMoods.reduce((sum, v) => sum + v, 0) / validOverallMoods.length).toFixed(1)
      : null;

  const data = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayRecords = checkinGroupMap[dateStr] || [];

    let before = null;
    let after = null;
    let dailyAvg = null;

    if (dayRecords.length > 0) {
      const validBefores = dayRecords
        .map((c) => Number(c.overall_mood))
        .filter((v) => !isNaN(v) && v != null);

      if (validBefores.length > 0) {
        before = +(validBefores.reduce((sum, v) => sum + v, 0) / validBefores.length).toFixed(1);
        dailyAvg = before;
      }

      const validAfters = dayRecords
        .map((c) => {
          const b = Number(c.overall_mood);
          if (isNaN(b) || b == null) return null;
          if (c.journal_response && c.journal_response.trim()) {
            const s = sentimentScore(c.journal_response);
            return clamp(b + s * 0.4, 1, 5);
          }
          return b;
        })
        .filter((v) => v != null);

      if (validAfters.length > 0) {
        after = +(validAfters.reduce((sum, v) => sum + v, 0) / validAfters.length).toFixed(1);
      }
    }

    return {
      dateStr,
      formattedDate: format(day, 'EEEE, d MMMM yyyy', { locale }),
      day: isShort ? t(dayKeys[day.getDay()]) : format(day, 'd'),
      before_mood: before,
      after_mood: after,
      daily_avg: dailyAvg,
      checkin_count: dayRecords.length,
    };
  });

  return (
    <div className="bg-card rounded-2xl border p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header & Overall Daily Average Mood */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
            <span>📈</span>
            {t('weeklyTrend')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'th' ? 'สรุปอารมณ์เฉลี่ยรายวันตามช่วงเวลาที่เลือก' : 'Daily average mood trends over selected period'}
          </p>
        </div>

        {overallAvgMood && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-foreground">
            <span className="text-muted-foreground">{t('averageDailyMood') || 'คะแนนอารมณ์เฉลี่ย'}:</span>
            <span className="font-bold text-primary font-mono text-sm">{overallAvgMood} / 5</span>
            <span className="text-base">{MOOD_EMOJIS[Math.round(Number(overallAvgMood))] || '✨'}</span>
          </div>
        )}
      </div>

      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval={isShort ? 0 : 'preserveStartEnd'}
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
                  <div className="bg-popover text-popover-foreground rounded-xl p-3 border shadow-md text-xs space-y-2 min-w-[200px]">
                    <div className="border-b pb-1.5">
                      <p className="font-bold text-foreground text-xs">{d.formattedDate}</p>
                      {d.checkin_count > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {d.checkin_count} {t('todayCheckinCount') || 'ครั้ง'}
                        </span>
                      )}
                    </div>

                    {d.daily_avg !== null ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-muted-foreground">
                            {t('averageDailyMood') || 'อารมณ์เฉลี่ย'}:
                          </span>
                          <span className="font-mono text-primary font-bold">
                            {d.daily_avg} / 5 {MOOD_EMOJIS[Math.round(Number(d.daily_avg))]}
                          </span>
                        </div>
                        {d.before_mood !== null && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-primary font-medium flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                              {t('moodBefore')}:
                            </span>
                            <span className="font-mono">{d.before_mood}</span>
                          </div>
                        )}
                        {d.after_mood !== null && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-accent font-medium flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                              {t('moodAfter')}:
                            </span>
                            <span className="font-mono">{d.after_mood}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-[11px] italic">
                        {t('noData') || 'No check-ins'}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: '8px' }} iconType="line" />
            <Line
              type="monotone"
              dataKey="before_mood"
              name={t('moodBefore')}
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ fill: 'hsl(var(--primary))', r: 4, stroke: 'white', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="after_mood"
              name={t('moodAfter')}
              stroke="hsl(var(--accent))"
              strokeWidth={2.5}
              strokeDasharray="5 4"
              dot={{ fill: 'hsl(var(--accent))', r: 4, stroke: 'white', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: 'hsl(var(--accent))', stroke: 'white', strokeWidth: 2 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}