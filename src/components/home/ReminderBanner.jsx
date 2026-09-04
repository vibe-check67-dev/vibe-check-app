import React, { useState, useEffect } from 'react';
import { X, Flame } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function ReminderBanner({ hasCheckedInToday }) {
  const { t, lang } = useLang();
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

    // Optional: Only show once per session to avoid annoying the user every time they go to home
    const seenSession = sessionStorage.getItem('vc_reminder_seen');

    if (nowMinutes >= reminderMinutes && !seenSession) {
      setShow(true);
      sessionStorage.setItem('vc_reminder_seen', 'true');
    }
  }, [hasCheckedInToday, dismissed]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm bg-card border shadow-2xl rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4">
              <Flame className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold mb-2">
              {lang === 'th' ? 'เติมไฟกันเถอะ!' : 'Keep your streak alive!'}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t('reminderBanner')}
            </p>

            <div className="w-full flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12"
                onClick={handleDismiss}
              >
                {lang === 'th' ? 'ปิด' : 'Close'}
              </Button>
              <Button
                asChild
                className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link to="/checkin">{t('startCheckin')}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}