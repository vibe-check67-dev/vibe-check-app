import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getUserCheckins } from '@/lib/database';
import { calculateStreak } from '@/utils/streak';
import OnboardingSlides from '@/components/onboarding/OnboardingSlides';
import ReminderBanner from '@/components/home/ReminderBanner';
import AfternoonReminder from '@/components/home/AfternoonReminder';
import QuickCheckin from '@/components/home/QuickCheckin';

export default function Home() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [todayCheckins, setTodayCheckins] = useState([]);
  const [streak, setStreak] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWellnessTip, setShowWellnessTip] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const allCheckins = await getUserCheckins(user.id, 365);

      const recordsToday = allCheckins.filter((c) => c.checkin_date === today);
      setTodayCheckins(recordsToday);
      setStreak(calculateStreak(allCheckins));

      // Check for 3 consecutive low mood days (across 3 most recent distinct dates)
      const dateMoodMap = new Map();
      for (const c of allCheckins) {
        if (!c.checkin_date) continue;
        if (!dateMoodMap.has(c.checkin_date)) {
          dateMoodMap.set(c.checkin_date, []);
        }
        dateMoodMap.get(c.checkin_date).push(Number(c.overall_mood || 0));
      }
      const recentDates = Array.from(dateMoodMap.keys()).slice(0, 3);
      const is3LowDays =
        recentDates.length === 3 &&
        recentDates.every((d) => {
          const moods = dateMoodMap.get(d);
          const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
          return avg <= 2;
        });
      setShowWellnessTip(is3LowDays);
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const seen = localStorage.getItem('vibecheck_onboarding');
    if (!seen) setShowOnboarding(true);
    loadData();
  }, [loadData]);

  const completeOnboarding = () => {
    localStorage.setItem('vibecheck_onboarding', 'true');
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingSlides onComplete={completeOnboarding} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasCheckedInToday = todayCheckins.length > 0;
  const latestTodayCheckin = todayCheckins[0] || null;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 pt-6"
      >
        <div className="text-5xl mb-4">
          {hasCheckedInToday ? '✨' : '👋'}
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {hasCheckedInToday
            ? (lang === 'th'
                ? `วันนี้คุณเช็คอินไปแล้ว ${todayCheckins.length} ครั้ง`
                : `You've checked in ${todayCheckins.length} time${todayCheckins.length > 1 ? 's' : ''} today!`)
            : t('howAreYou')}
        </h1>
      </motion.div>

      {/* Streak (TikTok-style: Active Fire vs Grey Unfueled Fire) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {streak > 0 ? (
          hasCheckedInToday ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 rounded-2xl py-3 px-4 border border-orange-500/20 text-center shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
                <span className="text-xl">🔥</span>
                <span>{streak} {t('dayStreak')}</span>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {t('streakFueled') || 'เติมไฟวันนี้แล้ว!'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800/60 rounded-2xl py-3 px-4 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                <span className="text-xl grayscale opacity-70">🔥</span>
                <span>{streak} {t('dayStreak')}</span>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {t('streakNotFueled') || 'ยังไม่ได้เติมไฟวันนี้'} 🩶
              </span>
            </div>
          )
        ) : (
          hasCheckedInToday ? (
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl py-3 px-4 border border-orange-500/20 text-center shadow-2xs">
              <span className="text-xl">🔥</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">
                1 {t('dayStreak')}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-1">
                ({t('streakFueled') || 'เติมไฟวันนี้แล้ว!'})
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/40 rounded-2xl py-2.5 px-4 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-muted-foreground">
              <span className="text-base grayscale opacity-60">🔥</span>
              <span>{t('streakInactivePrompt') || 'เช็คอินวันนี้เพื่อเริ่มสถิติไฟต่อเนื่อง! 🩶'}</span>
            </div>
          )
        )}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2.5"
      >
        <Link to="/checkin">
          <Button className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-sm">
            {hasCheckedInToday ? (t('checkinAgain') || 'เช็คอินอีกครั้ง') : (t('startCheckin') || 'เริ่มเช็คอิน')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>

        {hasCheckedInToday && latestTodayCheckin && (
          <div className="text-center">
            <Link
              to={`/results/${latestTodayCheckin.id}`}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors"
            >
              {t('viewLatestResults') || 'ดูผลลัพธ์ล่าสุด'} →
            </Link>
          </div>
        )}
      </motion.div>

      {/* Afternoon reminder */}
      <AfternoonReminder hasCheckedInToday={hasCheckedInToday} />

      {/* Reminder banner */}
      <ReminderBanner hasCheckedInToday={hasCheckedInToday} />

      {/* Quick check-in */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <QuickCheckin onCompleted={loadData} />
      </motion.div>

      {/* Wellness tip */}
      {showWellnessTip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-accent/10 border border-accent/20 rounded-2xl p-5 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-sm text-foreground">{t('wellnessTip')}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('wellnessTipMsg')}</p>
        </motion.div>
      )}
    </div>
  );
}