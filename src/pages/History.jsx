import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { subDays } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getUserCheckins } from '@/lib/database';
import { calculateStreak } from '@/utils/streak';
import { Button } from '@/components/ui/button';
import WeeklyChart from '@/components/history/WeeklyChart';
import DailyTimelineChart from '@/components/history/DailyTimelineChart';
import MonthlyHeatmap from '@/components/history/MonthlyHeatmap';
import MoodBreakdown from '@/components/history/MoodBreakdown';
import JournalSearch from '@/components/history/JournalSearch';
import DateRangeSelector from '@/components/history/DateRangeSelector';
import { format } from 'date-fns';

export default function History() {
  const { user } = useAuth();
  const { t } = useLang();
  const [checkins, setCheckins] = useState([]);
  const [filteredCheckins, setFilteredCheckins] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => ({
    start: subDays(new Date(), 6),
    end: new Date(),
  }));

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const all = await getUserCheckins(user.id, 365);
      setCheckins(all);
      setFilteredCheckins(all);
      setStreak(calculateStreak(all));
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (checkins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="text-5xl">📊</span>
        <p className="text-muted-foreground">{t('noData')}</p>
        <Link to="/checkin">
          <Button className="rounded-2xl">{t('startCheckin')}</Button>
        </Link>
      </div>
    );
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const hasCheckedInToday = checkins.some((c) => c.checkin_date === today);

  return (
    <div className="space-y-5">
      {/* Streak */}
      {streak > 0 ? (
        hasCheckedInToday ? (
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl py-3 border border-orange-500/20 shadow-2xs">
            <span className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
              🔥 {streak}{t('dayStreak')}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ({t('streakFueled') || 'เติมไฟวันนี้แล้ว!'})
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800/60 rounded-2xl py-3 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="grayscale opacity-70">🔥</span> {streak}{t('dayStreak')}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ({t('streakNotFueled') || 'ยังไม่ได้เติมไฟวันนี้'}) 🩶
            </span>
          </div>
        )
      ) : null}

      {/* Daily Timeline Chart (Multi check-in hourly visualization) */}
      <DailyTimelineChart checkins={checkins} />

      <JournalSearch checkins={checkins} onFilter={setFilteredCheckins} />
      <DateRangeSelector onChange={setDateRange} />
      <WeeklyChart checkins={filteredCheckins} dateRange={dateRange} />
      <MonthlyHeatmap checkins={filteredCheckins} />
      <MoodBreakdown checkins={filteredCheckins} />
    </div>
  );
}