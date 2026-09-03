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
  const { t } = useLang();
  const [todayCheckin, setTodayCheckin] = useState(null);
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

      const todayRecord = allCheckins.find((c) => c.checkin_date === today);
      if (todayRecord) setTodayCheckin(todayRecord);
      else setTodayCheckin(null);

      setStreak(calculateStreak(allCheckins));

      // Check for 3 consecutive low mood days (most recent 3 by date)
      const recent3 = allCheckins.slice(0, 3);
      if (recent3.length === 3 && recent3.every((c) => c.overall_mood <= 2)) {
        setShowWellnessTip(true);
      } else {
        setShowWellnessTip(false);
      }
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

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 pt-6"
      >
        <div className="text-5xl mb-4">
          {todayCheckin ? '✅' : '👋'}
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {todayCheckin ? t('alreadyCheckedIn') : t('howAreYou')}
        </h1>
      </motion.div>

      {/* Streak */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 bg-primary/5 rounded-2xl py-3 border border-primary/10"
        >
          <span className="text-lg leading-none">🔥</span>
          <span className="font-semibold text-foreground">
            {streak}{t('dayStreak')}
          </span>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {todayCheckin ? (
          <Link to={`/results/${todayCheckin.id}`}>
            <Button className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-sm">
              {t('viewResults')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Link to="/checkin">
            <Button className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-sm">
              {t('startCheckin')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </motion.div>

      {/* Afternoon reminder */}
      <AfternoonReminder hasCheckedInToday={!!todayCheckin} />

      {/* Reminder banner */}
      <ReminderBanner hasCheckedInToday={!!todayCheckin} />

      {/* Quick check-in (only if not checked in) */}
      {!todayCheckin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuickCheckin onCompleted={loadData} />
        </motion.div>
      )}

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