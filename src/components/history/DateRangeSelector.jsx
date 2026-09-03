import React, { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { startOfMonth, endOfMonth, subDays, format, parseISO } from 'date-fns';

const MODES = [
  { id: 'week', labelKey: 'rangeWeek' },
  { id: 'month', labelKey: 'rangeMonth' },
  { id: 'custom', labelKey: 'rangeCustom' },
];

export default function DateRangeSelector({ onChange }) {
  const { t } = useLang();
  const today = new Date();
  const [mode, setMode] = useState('week');
  const [month, setMonth] = useState(format(today, 'yyyy-MM'));
  const [start, setStart] = useState(format(subDays(today, 6), 'yyyy-MM-dd'));
  const [end, setEnd] = useState(format(today, 'yyyy-MM-dd'));

  useEffect(() => {
    let s, e;
    if (mode === 'week') {
      e = new Date();
      s = subDays(e, 6);
    } else if (mode === 'month') {
      const md = parseISO(month + '-01');
      s = startOfMonth(md);
      e = endOfMonth(md);
    } else {
      s = parseISO(start);
      e = parseISO(end);
      if (s > e) [s, e] = [e, s];
    }
    onChange({ start: s, end: e });
  }, [mode, month, start, end, onChange]);

  return (
    <div className="bg-card rounded-2xl border p-3 space-y-3">
      <div className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 h-9 rounded-xl text-xs font-medium transition-colors ${
              mode === m.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {t(m.labelKey)}
          </button>
        ))}
      </div>
      {mode === 'month' && (
        <input
          type="month"
          value={month}
          max={format(today, 'yyyy-MM')}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm"
        />
      )}
      {mode === 'custom' && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
            className="flex-1 h-9 rounded-xl border border-input bg-background px-2 text-sm"
          />
          <span className="text-muted-foreground">→</span>
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
            className="flex-1 h-9 rounded-xl border border-input bg-background px-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}