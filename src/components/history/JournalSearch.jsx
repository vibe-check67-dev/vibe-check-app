import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

export default function JournalSearch({ checkins, onFilter }) {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [minMood, setMinMood] = useState('');
  const [maxMood, setMaxMood] = useState('');

  const apply = (q, mn, mx) => {
    let filtered = [...checkins];
    if (q.trim()) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(c =>
        (c.journal_response || '').toLowerCase().includes(lower) ||
        (c.free_text || '').toLowerCase().includes(lower)
      );
    }
    if (mn !== '') filtered = filtered.filter(c => c.overall_mood >= Number(mn));
    if (mx !== '') filtered = filtered.filter(c => c.overall_mood <= Number(mx));
    onFilter(filtered);
  };

  const handleQuery = (val) => { setQuery(val); apply(val, minMood, maxMood); };
  const handleMin = (val) => { setMinMood(val); apply(query, val, maxMood); };
  const handleMax = (val) => { setMaxMood(val); apply(query, minMood, val); };

  const clear = () => { setQuery(''); setMinMood(''); setMaxMood(''); onFilter(checkins); };
  const hasFilter = query || minMood || maxMood;

  return (
    <div className="bg-card rounded-2xl border p-4 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          placeholder={t('searchJournal')}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">{t('moodRange')}:</span>
        <input
          type="number"
          min="1" max="5"
          value={minMood}
          onChange={(e) => handleMin(e.target.value)}
          placeholder="1"
          className="w-14 text-center rounded-lg border border-input bg-background text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <input
          type="number"
          min="1" max="5"
          value={maxMood}
          onChange={(e) => handleMax(e.target.value)}
          placeholder="5"
          className="w-14 text-center rounded-lg border border-input bg-background text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {hasFilter && (
          <button onClick={clear} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" /> {t('clear')}
          </button>
        )}
      </div>
    </div>
  );
}