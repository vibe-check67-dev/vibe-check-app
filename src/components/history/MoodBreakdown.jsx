import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { useLang } from '@/context/LanguageContext';
import { subDays } from 'date-fns';

export default function MoodBreakdown({ checkins }) {
  const { t } = useLang();

  const last7 = checkins.filter(c => {
    const d = new Date(c.checkin_date);
    return d >= subDays(new Date(), 7);
  });

  if (last7.length === 0) return null;

  const avg = (key) => {
    const vals = last7.map(c => c[key]).filter(Boolean);
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
  };

  const data = [
    { name: t('energy'), value: avg('energy'), color: 'hsl(var(--chart-1))' },
    { name: t('stress'), value: avg('stress'), color: 'hsl(var(--chart-2))' },
    { name: t('social'), value: avg('social'), color: 'hsl(var(--chart-3))' },
    { name: t('sleep'), value: avg('sleep'), color: 'hsl(var(--chart-4))' },
  ];

  return (
    <div className="bg-card rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold text-foreground">{t('moodBreakdown')}</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barCategoryGap={8}>
            <XAxis type="number" domain={[0, 5]} hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}