import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { Users, User, Clock, Calendar, ChevronLeft, ChevronRight, BarChart3, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLang } from '@/context/LanguageContext';
import DailyTimelineChart from '@/components/history/DailyTimelineChart';

const MOOD_EMOJIS = ['', '😔', '😐', '🙂', '😄', '🔥'];

export default function AdminDailyChart({
  checkins = [],
  profiles = [],
  initialUserId = 'all',
}) {
  const { t, lang } = useLang();
  const locale = lang === 'th' ? th : enUS;

  const [viewType, setViewType] = useState(initialUserId !== 'all' ? 'individual' : 'aggregate'); // 'aggregate' | 'individual'
  const [selectedUserId, setSelectedUserId] = useState(initialUserId !== 'all' ? initialUserId : (profiles[0]?.id || ''));
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Sync with initialUserId when prop changes from parent (e.g. user filter dropdown in AdminData)
  useEffect(() => {
    if (initialUserId && initialUserId !== 'all') {
      setViewType('individual');
      setSelectedUserId(initialUserId);
    } else if (initialUserId === 'all' && viewType === 'individual' && !selectedUserId && profiles.length > 0) {
      setSelectedUserId(profiles[0].id);
    }
  }, [initialUserId, profiles, viewType, selectedUserId]);

  // Ensure valid selectedUserId once profiles load asynchronously
  useEffect(() => {
    if (!selectedUserId && profiles.length > 0) {
      setSelectedUserId(profiles[0].id);
    }
  }, [profiles, selectedUserId]);

  const handlePrevDay = () => {
    try {
      const d = parseISO(selectedDate);
      setSelectedDate(format(subDays(d, 1), 'yyyy-MM-dd'));
    } catch {
      // fallback
    }
  };

  const handleNextDay = () => {
    try {
      const d = parseISO(selectedDate);
      setSelectedDate(format(addDays(d, 1), 'yyyy-MM-dd'));
    } catch {
      // fallback
    }
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  // Filter checkins for selected date
  const dateCheckins = useMemo(() => {
    return checkins.filter((c) => c.checkin_date === selectedDate);
  }, [checkins, selectedDate]);

  // Selected user checkins for individual view
  const userCheckins = useMemo(() => {
    if (!selectedUserId) return [];
    return checkins.filter((c) => c.user_id === selectedUserId);
  }, [checkins, selectedUserId]);

  const selectedUserObj = useMemo(() => {
    return profiles.find((p) => p.id === selectedUserId) || null;
  }, [profiles, selectedUserId]);

  // Aggregate stats calculation for the selected date
  const aggregateStats = useMemo(() => {
    if (!dateCheckins.length) {
      return {
        totalCheckins: 0,
        uniqueUsers: 0,
        avgMood: 0,
        peakHourStr: '-',
      };
    }

    const uniqueUsersSet = new Set(dateCheckins.map((c) => c.user_id));
    const totalMood = dateCheckins.reduce((acc, curr) => acc + Number(curr.overall_mood || 0), 0);
    const avgMood = +(totalMood / dateCheckins.length).toFixed(1);

    // Peak hour
    const hourCounts = {};
    dateCheckins.forEach((item) => {
      let timeStr = item.checkin_time;
      if (!timeStr && item.created_at) {
        try {
          timeStr = format(new Date(item.created_at), 'HH:mm');
        } catch {
          timeStr = '12:00';
        }
      }
      const hour = timeStr ? parseInt(timeStr.split(':')[0], 10) : 12;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let peakHour = null;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([h, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        peakHour = h;
      }
    });

    const peakHourStr = peakHour !== null
      ? `${String(peakHour).padStart(2, '0')}:00 - ${String(Number(peakHour) + 1).padStart(2, '0')}:00 (${maxCount} ${lang === 'th' ? 'ครั้ง' : 'check-ins'})`
      : '-';

    return {
      totalCheckins: dateCheckins.length,
      uniqueUsers: uniqueUsersSet.size,
      avgMood,
      peakHourStr,
    };
  }, [dateCheckins, lang]);

  // Hourly aggregate data for chart (0 to 23)
  const hourlyChartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${String(i).padStart(2, '0')}:00`,
      moodSum: 0,
      stressSum: 0,
      energySum: 0,
      count: 0,
      avgMood: null,
      avgStress: null,
      avgEnergy: null,
    }));

    dateCheckins.forEach((item) => {
      let timeStr = item.checkin_time;
      if (!timeStr && item.created_at) {
        try {
          timeStr = format(new Date(item.created_at), 'HH:mm');
        } catch {
          timeStr = '12:00';
        }
      }
      if (!timeStr) return;
      const h = parseInt(timeStr.split(':')[0], 10);
      if (h >= 0 && h < 24) {
        hours[h].moodSum += Number(item.overall_mood || 0);
        hours[h].stressSum += Number(item.stress || 0);
        hours[h].energySum += Number(item.energy || 0);
        hours[h].count += 1;
      }
    });

    return hours.map((h) => ({
      hour: h.hour,
      hourLabel: h.hourLabel,
      count: h.count,
      avgMood: h.count > 0 ? +(h.moodSum / h.count).toFixed(1) : null,
      avgStress: h.count > 0 ? +(h.stressSum / h.count).toFixed(1) : null,
      avgEnergy: h.count > 0 ? +(h.energySum / h.count).toFixed(1) : null,
    }));
  }, [dateCheckins]);

  const formattedDateTitle = useMemo(() => {
    try {
      const d = parseISO(selectedDate);
      return format(d, 'EEEE, d MMMM yyyy', { locale });
    } catch {
      return selectedDate;
    }
  }, [selectedDate, locale]);

  return (
    <div className="bg-card rounded-2xl border p-4 sm:p-5 shadow-xs space-y-5">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-600" />
              {t('adminDailyChartTitle') || 'Daily Check-in Timeline Analysis'}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'th'
              ? 'วิเคราะห์แนวโน้มอารมณ์และช่วงเวลาเช็คอิน ทั้งภาพรวมทุกคน และเจาะลึกรายบุคคล'
              : 'Analyze mood fluctuations throughout the day across all users or by individual.'}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 bg-muted/60 rounded-xl border text-xs font-semibold self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewType('aggregate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewType === 'aggregate'
                ? 'bg-card text-brand-700 shadow-2xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('viewAggregate') || 'All Users (Aggregate)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewType('individual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewType === 'individual'
                ? 'bg-card text-brand-700 shadow-2xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('viewIndividual') || 'Individual User'}</span>
          </button>
        </div>
      </div>

      {/* Date Navigator Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-semibold">{formattedDateTitle}</span>
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto bg-background p-1 rounded-xl border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="h-7 w-7 rounded-lg cursor-pointer"
            title={t('yesterday') || 'Previous Day'}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <input
            type="date"
            value={selectedDate}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-semibold text-foreground px-1 py-0.5 outline-none cursor-pointer font-mono"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={selectedDate >= format(new Date(), 'yyyy-MM-dd')}
            className="h-7 w-7 rounded-lg cursor-pointer disabled:opacity-30"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {!isToday && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleToday}
              className="h-7 px-2 text-[11px] font-bold rounded-lg cursor-pointer"
            >
              {t('today') || 'Today'}
            </Button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. AGGREGATE VIEW (ALL USERS) */}
      {/* ======================================================== */}
      {viewType === 'aggregate' && (
        <div className="space-y-5">
          {/* Daily Aggregate KPI Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card rounded-xl p-3.5 border shadow-2xs">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-brand-600" />
                {t('totalCheckinsToday') || 'Total Daily Check-ins'}
              </div>
              <div className="text-2xl font-extrabold text-foreground font-mono mt-1">
                {aggregateStats.totalCheckins}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {lang === 'th' ? 'รายการเช็คอินในวันนี้' : 'check-ins recorded today'}
              </div>
            </div>

            <div className="bg-card rounded-xl p-3.5 border shadow-2xs">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                {t('activeUsersToday') || 'Active Users Today'}
              </div>
              <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 font-mono mt-1">
                {aggregateStats.uniqueUsers}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {lang === 'th' ? `จากทั้งหมด ${profiles.length} บัญชี` : `out of ${profiles.length} users`}
              </div>
            </div>

            <div className="bg-card rounded-xl p-3.5 border shadow-2xs">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <span>😊</span>
                {t('averageDailyMood') || 'Average Mood Today'}
              </div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1 flex items-center gap-1.5">
                {aggregateStats.avgMood || '-'}
                <span className="text-lg">
                  {aggregateStats.avgMood ? MOOD_EMOJIS[Math.round(aggregateStats.avgMood)] : ''}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {lang === 'th' ? 'คะแนนเฉลี่ย (1 - 5)' : 'Scale: 1 (low) - 5 (high)'}
              </div>
            </div>

            <div className="bg-card rounded-xl p-3.5 border shadow-2xs">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                {lang === 'th' ? 'ช่วงเวลายอดฮิต' : 'Peak Check-in Hour'}
              </div>
              <div className="text-sm font-extrabold text-foreground mt-2 truncate">
                {aggregateStats.peakHourStr}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {lang === 'th' ? 'ช่วงที่ผู้ใช้เช็คอินเยอะที่สุด' : 'most frequent checkin slot'}
              </div>
            </div>
          </div>

          {/* Aggregate 24-Hour Timeline Chart */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {t('hourlyAverageMood') || 'Average Mood by Hour of Day'}
              </h4>
              <span className="text-[11px] text-muted-foreground">
                {lang === 'th' ? 'แท่ง = จำนวนเช็คอิน | เส้น = อารมณ์เฉลี่ย' : 'Bars = Check-in Count | Line = Avg Mood'}
              </span>
            </div>

            {dateCheckins.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center rounded-xl border border-dashed text-center p-4 gap-2 text-muted-foreground">
                <span className="text-3xl opacity-60">📅</span>
                <p className="text-xs font-medium">
                  {t('noCheckinsOnDate') || 'No check-ins recorded for this day'}
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={hourlyChartData}
                    margin={{ top: 12, right: 16, left: -10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

                    <XAxis
                      dataKey="hour"
                      type="number"
                      domain={[0, 23]}
                      ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
                      tickFormatter={(v) => `${String(v).padStart(2, '0')}:00`}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />

                    {/* Left Axis: Mood 1-5 */}
                    <YAxis
                      yAxisId="mood"
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tickFormatter={(v) => `${v}`}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />

                    {/* Right Axis: Check-in Count */}
                    <YAxis
                      yAxisId="count"
                      orientation="right"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-popover text-popover-foreground rounded-xl p-3 border shadow-md text-xs space-y-1">
                            <div className="font-bold border-b pb-1 flex items-center justify-between">
                              <span>⏰ {d.hourLabel}</span>
                              <span className="font-mono text-primary">{d.count} {lang === 'th' ? 'เช็คอิน' : 'check-ins'}</span>
                            </div>
                            {d.count > 0 ? (
                              <>
                                <div className="text-amber-600 dark:text-amber-400 font-semibold">
                                  😊 {t('kpiAvgMood') || 'Avg Mood'}: {d.avgMood} / 5
                                </div>
                                <div className="text-[11px] text-muted-foreground flex justify-between gap-3">
                                  <span>⚡ {t('kpiAvgEnergy') || 'Energy'}: {d.avgEnergy}/5</span>
                                  <span>🔥 {t('kpiAvgStress') || 'Stress'}: {d.avgStress}/5</span>
                                </div>
                              </>
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic">
                                {lang === 'th' ? 'ไม่มีเช็คอินในช่วงนี้' : 'No check-ins in this hour'}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />

                    <Legend wrapperStyle={{ fontSize: 11 }} />

                    <Bar
                      yAxisId="count"
                      dataKey="count"
                      name={lang === 'th' ? 'จำนวนเช็คอิน (ครั้ง)' : 'Check-in Count'}
                      fill="hsl(var(--primary) / 0.25)"
                      radius={[4, 4, 0, 0]}
                    />

                    <Line
                      yAxisId="mood"
                      type="monotone"
                      dataKey="avgMood"
                      name={lang === 'th' ? 'อารมณ์เฉลี่ย (1-5)' : 'Average Mood (1-5)'}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      connectNulls={true}
                      dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. INDIVIDUAL VIEW (SELECT USER) */}
      {/* ======================================================== */}
      {viewType === 'individual' && (
        <div className="space-y-4">
          {/* User Select Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border bg-muted/20">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-foreground">
                {t('filterUser') || 'Select User:'}
              </Label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-brand-100 outline-none cursor-pointer max-w-xs"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name || p.email} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedUserObj && (
              <div className="text-xs text-muted-foreground font-mono">
                {lang === 'th' ? 'ประวัติเช็คอินทั้งหมด:' : 'Total user records:'}{' '}
                <strong className="text-foreground">{userCheckins.length}</strong>
              </div>
            )}
          </div>

          {/* Re-use DailyTimelineChart for this user */}
          <DailyTimelineChart
            checkins={userCheckins}
            initialDate={selectedDate}
            title={
              selectedUserObj
                ? `${lang === 'th' ? 'ไทม์ไลน์ของ' : 'Timeline for'} ${selectedUserObj.display_name || selectedUserObj.email}`
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
