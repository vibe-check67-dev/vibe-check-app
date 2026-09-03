import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link } from 'react-router-dom';

export default function ReminderBanner({ hasCheckedInToday }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (hasCheckedInToday || dismissed) return;

    const remindersEnabled = localStorage.getItem('vc_reminders_enabled') !== 'false';
    if (!remindersEnabled) return;

    const reminderTime = localStorage.getItem('vc_reminder_time') || '20:00';
    const [hour, minute] = reminderTime.split(':').map(Number);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const reminderMinutes = hour * 60 + minute;

    if (nowMinutes >= reminderMinutes) {
      setShow(true);
    }
  }, [hasCheckedInToday, dismissed]);

  if (!show) return null;

  return (
    <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 gap-3">
      <div className="flex items-center gap-2 flex-1">
        <Bell className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-foreground">{t('reminderBanner')}</p>
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