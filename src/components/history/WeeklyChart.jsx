import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLang } from '@/context/LanguageContext';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { sentimentScore } from '@/utils/sentiment';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function WeeklyChart({ checkins = [], dateRange }) {
  const { t } = useLang();

  const end = dateRange?.end ? new Date(dateRange.end) : new Date();
  const start = dateRange?.start ? new Date(dateRange.start) : subDays(new Date(), 6);

  // Map every check-in by date for quick same-day lookup.
  // Group every check-in by date to handle multiple records per day
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

  const data = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayRecords = checkinGroupMap[dateStr] || [];

    let before = null;
    let after = null;

    if (dayRecords.length > 0) {
      const validBefores = dayRecords
        .map((c) => Number(c.overall_mood))
        .filter((v) => !isNaN(v) && v != null);

      if (validBefores.length > 0) {
        before = +(validBefores.reduce((sum, v) => sum + v, 0) / validBefores.length).toFixed(1);
      }

      const validAfters = dayRecords.map((c) => {
        const b = Number(c.overall_mood);
        if (isNaN(b) || b == null) return null;
        if (c.journal_response && c.journal_response.trim()) {
          const s = sentimentScore(c.journal_response);
          return clamp(b + s * 0.4, 1, 5);
        }
        return b;
      }).filter((v) => v != null);

      if (validAfters.length > 0) {
        after = +(validAfters.reduce((sum, v) => sum + v, 0) / validAfters.length).toFixed(1);
      }
    }

    return {
      day: isShort ? t(dayKeys[day.getDay()]) : format(day, 'd'),
      before_mood: before,
      after_mood: after,
    };
  });

  return (
    <div className="bg-card rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold text-foreground">{t('weeklyTrend')}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="line" />
            <Line
              type="monotone"
              dataKey="before_mood"
              name={t('moodBefore')}
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="after_mood"
              name={t('moodAfter')}
              stroke="hsl(var(--accent))"
              strokeWidth={2.5}
              strokeDasharray="5 4"
              dot={{ fill: 'hsl(var(--accent))', r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}