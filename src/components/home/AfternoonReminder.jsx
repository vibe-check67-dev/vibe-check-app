import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

export default function AfternoonReminder({ hasCheckedInToday }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (hasCheckedInToday || dismissed) return;
    const now = new Date();
    if (now.getHours() >= 12) {
      setShow(true);
    }
  }, [hasCheckedInToday, dismissed]);

  if (!show) return null;

  return (
    <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 gap-3">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-lg shrink-0">🔥</span>
        <p className="text-sm text-foreground">{t('afternoonReminder')}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link to="/checkin">
          <button className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
            {t('startCheckin')}
          </button>
        </Link>
        <button onClick={() => { setShow(false); setDismissed(true); }}>
          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  );
}