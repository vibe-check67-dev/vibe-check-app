import React, { useState, useMemo } from 'react';
import { subDays, subMonths, isAfter, parseISO } from 'date-fns';
import { Users, FileText, UserCheck, Target, BarChart2, Table as TableIcon, RefreshCw, Radio, Clock } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import AdminCharts from '@/components/admin/AdminCharts';
import AdminDailyChart from '@/components/admin/AdminDailyChart';
import DataTable from '@/components/admin/DataTable';
import AdminUsers from '@/components/admin/AdminUsers';
import CSVImportExport from '@/components/admin/CSVImportExport';

export default function AdminData({ checkins = [], profiles = [], onDataMutated, isRealtimeActive }) {
  const { t, lang } = useLang();

  const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'daily' | 'table' | 'users'
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [timeScope, setTimeScope] = useState('all'); // 'week' | 'month' | 'all'

  // ============================================
  // FILTERING LOGIC
  // ============================================
  const filteredCheckins = useMemo(() => {
    let result = [...checkins];

    // Filter by user
    if (selectedUserId !== 'all') {
      result = result.filter((item) => item.user_id === selectedUserId);
    }

    // Filter by timeframe
    const now = new Date();
    if (timeScope === 'week') {
      const weekAgo = subDays(now, 7);
      result = result.filter((item) => {
        try {
          return isAfter(parseISO(item.checkin_date), weekAgo);
        } catch {
          return true;
        }
      });
    } else if (timeScope === 'month') {
      const monthAgo = subMonths(now, 1);
      result = result.filter((item) => {
        try {
          return isAfter(parseISO(item.checkin_date), monthAgo);
        } catch {
          return true;
        }
      });
    }

    return result;
  }, [checkins, selectedUserId, timeScope]);

  // ============================================
  // KPI CALCULATIONS
  // ============================================
  const kpiStats = useMemo(() => {
    if (!filteredCheckins.length) {
      return { mood: 0, stress: 0, energy: 0, sleep: 0, social: 0 };
    }

    const totals = filteredCheckins.reduce(
      (acc, curr) => ({
        mood: acc.mood + Number(curr.overall_mood || 0),
        stress: acc.stress + Number(curr.stress || 0),
        energy: acc.energy + Number(curr.energy || 0),
        sleep: acc.sleep + Number(curr.sleep || 0),
        social: acc.social + Number(curr.social || 0),
      }),
      { mood: 0, stress: 0, energy: 0, sleep: 0, social: 0 }
    );

    const count = filteredCheckins.length;
    return {
      mood: (totals.mood / count).toFixed(1),
      stress: (totals.stress / count).toFixed(1),
      energy: (totals.energy / count).toFixed(1),
      sleep: (totals.sleep / count).toFixed(1),
      social: (totals.social / count).toFixed(1),
    };
  }, [filteredCheckins]);

  const selectedUserObj = profiles.find((p) => p.id === selectedUserId);
  const selectedUserLabel = selectedUserId === 'all'
    ? t('allUsers')
    : selectedUserObj?.display_name || selectedUserObj?.email || selectedUserId;

  const resetFilters = () => {
    setSelectedUserId('all');
    setTimeScope('all');
  };

  const getMoodStatusLabel = (score) => {
    const s = parseFloat(score);
    if (isNaN(s) || s === 0) return lang === 'th' ? 'ไม่มีข้อมูล' : 'No data';
    if (s >= 4.0) return lang === 'th' ? 'ระดับดีเยี่ยม ✨' : 'Excellent State ✨';
    if (s >= 3.0) return lang === 'th' ? 'ระดับปกติ/ปานกลาง 🌿' : 'Normal / Stable 🌿';
    return lang === 'th' ? 'ควรได้รับการดูแล 💛' : 'Needs Care & Attention 💛';
  };

  const getStressStatusLabel = (score) => {
    const s = parseFloat(score);
    if (isNaN(s) || s === 0) return '-';
    if (s >= 3.5) return lang === 'th' ? 'ความเครียดสูง ⚠️' : 'High Stress ⚠️';
    if (s >= 2.5) return lang === 'th' ? 'ความเครียดปานกลาง' : 'Moderate Stress';
    return lang === 'th' ? 'สงบ/ผ่อนคลาย 🧘' : 'Calm & Relaxed 🧘';
  };

  const getEnergyStatusLabel = (score) => {
    const s = parseFloat(score);
    if (isNaN(s) || s === 0) return '-';
    if (s >= 3.5) return lang === 'th' ? 'พลังงานเต็มเปี่ยม ⚡' : 'High Energy ⚡';
    if (s >= 2.5) return lang === 'th' ? 'พลังงานปานกลาง' : 'Moderate Energy';
    return lang === 'th' ? 'พลังงานต่ำ/เหนื่อยล้า' : 'Low Energy / Tired';
  };

  return (
    <div className="space-y-6">
      {/* ==================== 1. TOP STATS CARDS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="bg-card rounded-2xl p-4 border shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center font-bold text-xl border border-brand-100 flex-shrink-0">
            <Users className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">{t('statTotalUsers')}</div>
            <div className="text-2xl font-extrabold text-foreground font-mono">{profiles.length}</div>
            <div className="text-[11px] text-brand-700 dark:text-brand-400 font-semibold mt-0.5">
              {lang === 'th' ? `รวม ${profiles.length} บัญชีผู้ใช้` : `${profiles.length} active accounts`}
            </div>
          </div>
        </div>

        {/* Total Checkins */}
        <div className="bg-card rounded-2xl p-4 border shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center font-bold text-xl border border-sky-100 flex-shrink-0">
            <FileText className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">{t('statTotalRecords')}</div>
            <div className="text-2xl font-extrabold text-foreground font-mono">{checkins.length}</div>
            <div className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold mt-0.5">
              {lang === 'th' ? 'เช็คอินในระบบทั้งหมด' : 'All check-ins recorded'}
            </div>
          </div>
        </div>

        {/* Selected User Filter Indicator */}
        <div className="bg-card rounded-2xl p-4 border shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-100 flex-shrink-0">
            <UserCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-muted-foreground font-medium">{t('statCurrentUser')}</div>
            <div className="text-sm font-extrabold text-indigo-900 dark:text-indigo-300 truncate">
              {selectedUserLabel}
            </div>
            <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium mt-0.5">
              {filteredCheckins.length} {lang === 'th' ? 'รายการ' : 'records'}
            </div>
          </div>
        </div>

        {/* Currently Showing Count */}
        <div className="bg-card rounded-2xl p-4 border shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-100 flex-shrink-0">
            <Target className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">{t('statShowingRecords')}</div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
              {filteredCheckins.length}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
              {lang === 'th' ? 'ตรงตามเงื่อนไขที่เลือก' : 'Matching filter criteria'}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 2. CONTROL & FILTER BAR ==================== */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Filters (User + Timeframe) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* User Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                {t('filterUser')}
              </span>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl border bg-background text-xs sm:text-sm font-semibold text-foreground focus:ring-2 focus:ring-brand-100 outline-none cursor-pointer"
              >
                <option value="all">🌐 {t('allUsers')}</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name || p.email} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Timeframe Scope */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                {t('filterTimeScope')}
              </span>
              <div className="inline-flex rounded-xl border bg-muted/50 p-1 text-xs font-semibold">
                <button
                  onClick={() => setTimeScope('week')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeScope === 'week' ? 'bg-card text-brand-700 shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('weekly')}
                </button>
                <button
                  onClick={() => setTimeScope('month')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeScope === 'month' ? 'bg-card text-brand-700 shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('monthly')}
                </button>
                <button
                  onClick={() => setTimeScope('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeScope === 'all' ? 'bg-card text-brand-700 shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('allTime')}
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer ml-auto sm:ml-0"
            >
              <RefreshCw className="w-3 h-3" />
              {t('resetFilters')}
            </button>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex flex-wrap items-center p-1 rounded-xl bg-muted/60 border text-xs font-semibold self-start lg:self-auto gap-1">
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'graph' ? 'bg-card text-brand-700 shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-brand-600" />
              <span>{t('viewGraph')}</span>
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'daily' ? 'bg-card text-brand-700 shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="w-4 h-4 text-primary" />
              <span>{t('tabDailyTimeline') || 'Daily Timeline'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-card text-brand-700 shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TableIcon className="w-4 h-4 text-slate-500" />
              <span>{t('viewTable')}</span>
            </button>
            <button
              onClick={() => setViewMode('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'users' ? 'bg-card text-brand-700 shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>{t('viewUserList')} ({profiles.length})</span>
            </button>
          </div>
        </div>

        {/* CSV import/export toolbar & Realtime indicator */}
        <div className="pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CSVImportExport checkins={filteredCheckins} onImportComplete={onDataMutated} />

          {isRealtimeActive && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Radio className="w-3 h-3" />
              {t('realtimeActive')}
            </div>
          )}
        </div>
      </div>

      {/* ==================== 3. 5 CORE KPI METRIC CARDS ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Mood */}
        <div className="bg-card rounded-2xl p-4 border border-l-4 border-l-amber-400 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold">😊 {t('kpiAvgMood')}</span>
            <span className="text-[10px] font-mono">1 - 5</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{kpiStats.mood}</div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
            {getMoodStatusLabel(kpiStats.mood)}
          </div>
        </div>

        {/* Stress */}
        <div className="bg-card rounded-2xl p-4 border border-l-4 border-l-rose-400 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold">🔥 {t('kpiAvgStress')}</span>
            <span className="text-[10px] font-mono">1 - 5</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{kpiStats.stress}</div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
            {getStressStatusLabel(kpiStats.stress)}
          </div>
        </div>

        {/* Energy */}
        <div className="bg-card rounded-2xl p-4 border border-l-4 border-l-emerald-400 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold">⚡ {t('kpiAvgEnergy')}</span>
            <span className="text-[10px] font-mono">1 - 5</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{kpiStats.energy}</div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
            {getEnergyStatusLabel(kpiStats.energy)}
          </div>
        </div>

        {/* Sleep */}
        <div className="bg-card rounded-2xl p-4 border border-l-4 border-l-indigo-400 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold">🌙 {t('kpiAvgSleep')}</span>
            <span className="text-[10px] font-mono">1 - 5</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{kpiStats.sleep}</div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
            {lang === 'th' ? 'คุณภาพการนอนเฉลี่ย' : 'Average sleep quality'}
          </div>
        </div>

        {/* Social */}
        <div className="bg-card rounded-2xl p-4 border border-l-4 border-l-sky-400 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold">💬 {t('kpiAvgSocial')}</span>
            <span className="text-[10px] font-mono">1 - 5</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{kpiStats.social}</div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
            {lang === 'th' ? 'อารมณ์สังคมเฉลี่ย' : 'Average social vibe'}
          </div>
        </div>
      </div>

      {/* ==================== 4. ACTIVE VIEW MODE ==================== */}
      {viewMode === 'graph' && (
        <div className="space-y-6">
          <AdminCharts checkins={filteredCheckins} />
          <AdminDailyChart
            checkins={checkins}
            profiles={profiles}
            initialUserId={selectedUserId}
          />
        </div>
      )}

      {viewMode === 'daily' && (
        <AdminDailyChart
          checkins={checkins}
          profiles={profiles}
          initialUserId={selectedUserId}
        />
      )}

      {viewMode === 'table' && (
        <DataTable
          checkins={filteredCheckins}
          profiles={profiles}
          onDataMutated={onDataMutated}
        />
      )}

      {viewMode === 'users' && (
        <AdminUsers
          profiles={profiles}
          checkins={checkins}
          onSelectUser={(uid) => {
            setSelectedUserId(uid);
            setViewMode('daily');
          }}
        />
      )}
    </div>
  );
}
