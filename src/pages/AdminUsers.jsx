import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Activity,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { getAllCheckins, getAllProfiles } from '@/lib/database';

export default function AdminUsers() {
  const { lang } = useLang();
  const { profile: currentAdminProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allProfiles, allCheckins] = await Promise.all([
        getAllProfiles().catch((err) => {
          console.error('Failed to load profiles:', err);
          return [];
        }),
        getAllCheckins().catch((err) => {
          console.error('Failed to load checkins:', err);
          return [];
        }),
      ]);
      setProfiles(allProfiles);
      setCheckins(allCheckins);
    } catch (err) {
      console.error('Error loading admin users data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('admin-users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_checkins' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadData();
      })
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Group checkins by user_id
  const userCheckinsMap = useMemo(() => {
    const map = new Map();
    checkins.forEach((c) => {
      const uid = c.user_id;
      if (!map.has(uid)) {
        map.set(uid, []);
      }
      map.get(uid).push(c);
    });
    return map;
  }, [checkins]);

  // Aggregate user cards summary matching sample data format
  const aggregatedUsers = useMemo(() => {
    return profiles.map((p) => {
      const userList = userCheckinsMap.get(p.id) || [];
      const count = userList.length;

      let avg_mood = '-';
      let avg_stress = '-';
      let avg_energy = '-';
      let avg_sleep = '-';
      let avg_social = '-';
      let period = lang === 'th' ? 'ยังไม่มีข้อมูลบันทึก' : 'No records yet';
      let minDate = null;
      let maxDate = null;

      if (count > 0) {
        let totalMood = 0;
        let totalStress = 0;
        let totalEnergy = 0;
        let totalSleep = 0;
        let totalSocial = 0;

        userList.forEach((c) => {
          totalMood += Number(c.overall_mood || 0);
          totalStress += Number(c.stress || 0);
          totalEnergy += Number(c.energy || 0);
          totalSleep += Number(c.sleep || 0);
          totalSocial += Number(c.social || 0);

          const d = c.checkin_date;
          if (d) {
            if (!minDate || d < minDate) minDate = d;
            if (!maxDate || d > maxDate) maxDate = d;
          }
        });

        avg_mood = (totalMood / count).toFixed(1);
        avg_stress = (totalStress / count).toFixed(1);
        avg_energy = (totalEnergy / count).toFixed(1);
        avg_sleep = (totalSleep / count).toFixed(1);
        avg_social = (totalSocial / count).toFixed(1);

        if (minDate && maxDate) {
          period = minDate === maxDate ? minDate : `${minDate} ${lang === 'th' ? 'ถึง' : 'to'} ${maxDate}`;
        }
      }

      // Initial letters for avatar
      const email = p.email || 'user@example.com';
      const displayName = p.display_name || email.split('@')[0];
      const initials = (displayName.slice(0, 2) || email.slice(0, 2)).toUpperCase();

      return {
        id: p.id,
        email: p.email,
        display_name: p.display_name,
        name: displayName,
        initials,
        role: p.role || 'user',
        count,
        period,
        avg_mood,
        avg_stress,
        avg_energy,
        avg_sleep,
        avg_social,
        created_at: p.created_at,
        checkins: userList,
      };
    }).sort((a, b) => b.count - a.count); // Sort by highest check-in count first
  }, [profiles, userCheckinsMap, lang]);

  // Filtered users by search
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return aggregatedUsers;
    const q = searchTerm.trim().toLowerCase();
    return aggregatedUsers.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.display_name || '').toLowerCase().includes(q)
    );
  }, [aggregatedUsers, searchTerm]);

  // Overall KPI statistics
  const overallStats = useMemo(() => {
    const totalUsers = profiles.length;
    const totalCheckins = checkins.length;

    let avgMood = '0.0';
    let avgStress = '0.0';

    if (totalCheckins > 0) {
      const sumMood = checkins.reduce((acc, c) => acc + Number(c.overall_mood || 0), 0);
      const sumStress = checkins.reduce((acc, c) => acc + Number(c.stress || 0), 0);
      avgMood = (sumMood / totalCheckins).toFixed(1);
      avgStress = (sumStress / totalCheckins).toFixed(1);
    }

    return { totalUsers, totalCheckins, avgMood, avgStress };
  }, [profiles, checkins]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedRecordForDetail) {
          setSelectedRecordForDetail(null);
        } else if (selectedUser) {
          setSelectedUser(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, selectedRecordForDetail]);

  // Radar data for currently selected user in modal
  const selectedUserRadarData = useMemo(() => {
    if (!selectedUser || selectedUser.count === 0) return [];
    return [
      {
        subject: lang === 'th' ? 'อารมณ์ 😊' : 'Mood 😊',
        score: Number(selectedUser.avg_mood) || 0,
        fullMark: 5,
      },
      {
        subject: lang === 'th' ? 'ความเครียด 🔥' : 'Stress 🔥',
        score: Number(selectedUser.avg_stress) || 0,
        fullMark: 5,
      },
      {
        subject: lang === 'th' ? 'พลังงาน ⚡' : 'Energy ⚡',
        score: Number(selectedUser.avg_energy) || 0,
        fullMark: 5,
      },
      {
        subject: lang === 'th' ? 'การนอน 🌙' : 'Sleep 🌙',
        score: Number(selectedUser.avg_sleep) || 0,
        fullMark: 5,
      },
      {
        subject: lang === 'th' ? 'สังคม 💭' : 'Social 💭',
        score: Number(selectedUser.avg_social) || 0,
        fullMark: 5,
      },
    ];
  }, [selectedUser, lang]);

  if (loading && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-xs text-muted-foreground">{lang === 'th' ? 'กำลังโหลดข้อมูลสรุปรายบุคคล...' : 'Loading user analytics...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 h-8 -ml-2 cursor-pointer"
          >
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'th' ? 'กลับหน้าภาพรวมหลังบ้าน (Admin Overview)' : 'Back to Admin Overview'}</span>
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {isRealtimeActive && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {lang === 'th' ? 'แอดมิน:' : 'Admin:'}{' '}
            <span className="font-bold text-foreground font-mono">{currentAdminProfile?.email}</span>
          </div>
        </div>
      </div>

      {/* Top Executive Stats Summary (Matching index.html style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="bg-card rounded-2xl p-4 border shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center font-bold text-xl border border-brand-100 dark:border-brand-900 flex-shrink-0">
            👥
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              {lang === 'th' ? 'จำนวนผู้ใช้งานทั้งหมด' : 'Total Users'}
            </div>
            <div className="text-2xl font-extrabold text-foreground font-mono">{overallStats.totalUsers}</div>
            <div className="text-[11px] text-brand-700 dark:text-brand-400 font-semibold mt-0.5">
              {lang === 'th' ? `รวม ${overallStats.totalUsers} บัญชีผู้ใช้` : `${overallStats.totalUsers} accounts registered`}
            </div>
          </div>
        </div>

        {/* Total Checkins */}
        <div className="bg-card rounded-2xl p-4 border shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center font-bold text-xl border border-sky-100 dark:border-sky-900 flex-shrink-0">
            📝
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              {lang === 'th' ? 'บันทึกทั้งหมดสะสม' : 'Total Check-ins'}
            </div>
            <div className="text-2xl font-extrabold text-foreground font-mono">{overallStats.totalCheckins}</div>
            <div className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold mt-0.5">
              {lang === 'th' ? 'เช็คอินในระบบทั้งหมด' : 'All check-ins recorded'}
            </div>
          </div>
        </div>

        {/* Avg Mood */}
        <div className="bg-card rounded-2xl p-4 border shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center font-bold text-xl border border-amber-100 dark:border-amber-900 flex-shrink-0">
            😊
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              {lang === 'th' ? 'อารมณ์เฉลี่ยภาพรวม' : 'Avg Mood Score'}
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {overallStats.avgMood} <span className="text-xs text-muted-foreground font-normal">/ 5</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {lang === 'th' ? 'คะแนนความสุขเฉลี่ย' : 'Platform mood average'}
            </div>
          </div>
        </div>

        {/* Avg Stress */}
        <div className="bg-card rounded-2xl p-4 border shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-bold text-xl border border-rose-100 dark:border-rose-900 flex-shrink-0">
            🔥
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              {lang === 'th' ? 'ความเครียดเฉลี่ยภาพรวม' : 'Avg Stress Score'}
            </div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {overallStats.avgStress} <span className="text-xs text-muted-foreground font-normal">/ 5</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {lang === 'th' ? 'ระดับความเครียดเฉลี่ย' : 'Platform stress average'}
            </div>
          </div>
        </div>
      </div>

      {/* Control Header & Search Bar Card */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span>👥</span>
            <span>
              {lang === 'th'
                ? `รายชื่อผู้เข้าร่วมบันทึกทั้งหมด (${filteredUsers.length} คน)`
                : `All Participants (${filteredUsers.length})`}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'th'
              ? 'คลิกที่การ์ดผู้ใช้งานเพื่อกรองและดูข้อมูลเจาะจงเฉพาะบุคคลนั้นได้ทันที'
              : 'Click on any user card to view detailed individual breakdown and history'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={lang === 'th' ? 'ค้นหาชื่อ หรืออีเมล...' : 'Search name or email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs sm:text-sm bg-background"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-COLUMN USER CARDS GRID (Matching Image 2 and index.html exactly)        */}
      {/* ========================================================================= */}
      {filteredUsers.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border text-center text-muted-foreground text-sm">
          {lang === 'th' ? 'ไม่พบรายชื่อผู้ใช้งานที่ตรงกับคำค้นหา' : 'No users match the search query.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u, i) => {
            return (
              <motion.div
                key={u.id}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                onClick={() => setSelectedUser(u)}
                className="bg-card rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group hover:border-brand-300 dark:hover:border-brand-700"
              >
                <div>
                  {/* Top Row: Avatar + Email + Check-in count Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-xs uppercase flex-shrink-0 border border-brand-200 dark:border-brand-800">
                        {u.initials}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <h3
                            className="text-xs font-bold text-foreground truncate max-w-[180px] group-hover:text-brand-600 transition-colors"
                            title={u.email}
                          >
                            {u.email}
                          </h3>
                          {u.role === 'admin' && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                          {u.period}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 font-bold text-xs font-mono flex-shrink-0 border border-sky-200/60">
                      {u.count} {lang === 'th' ? 'ครั้ง' : 'times'}
                    </span>
                  </div>

                  {/* Middle Row: Avg Mood & Avg Stress Metric Boxes */}
                  <div className="grid grid-cols-2 gap-2 my-3 text-center">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">
                        {lang === 'th' ? 'อารมณ์เฉลี่ย' : 'Avg Mood'}
                      </span>
                      <strong className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                        {u.avg_mood} {u.avg_mood !== '-' ? '/ 5' : ''}
                      </strong>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">
                        {lang === 'th' ? 'ความเครียดเฉลี่ย' : 'Avg Stress'}
                      </span>
                      <strong className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                        {u.avg_stress} {u.avg_stress !== '-' ? '/ 5' : ''}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Call to Action + Rank Index */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-brand-600 dark:text-brand-400 font-semibold">
                  <span className="flex items-center gap-1 group-hover:underline">
                    <span>{lang === 'th' ? 'ดูข้อมูลรายบุคคลนี้' : 'View User Breakdown'}</span>
                    <span>→</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">#{i + 1}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER DETAIL BREAKDOWN MODAL (Clicking card opens comprehensive breakdown) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card rounded-2xl border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col relative my-auto"
            >
              {/* Modal Header */}
              <div className="p-5 border-b flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 font-bold flex items-center justify-center text-sm uppercase flex-shrink-0 border border-brand-200">
                    {selectedUser.initials}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground truncate">{selectedUser.email}</h3>
                      {selectedUser.role === 'admin' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{selectedUser.period}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-5 overflow-y-auto space-y-6 flex-grow">
                {/* 5 Core Metrics Row */}
                <div className="grid grid-cols-5 gap-2 text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/60">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">😊 อารมณ์</span>
                    <strong className="font-mono text-sm text-foreground font-bold">{selectedUser.avg_mood}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">🔥 เครียด</span>
                    <strong className="font-mono text-sm text-foreground font-bold">{selectedUser.avg_stress}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">⚡ พลังงาน</span>
                    <strong className="font-mono text-sm text-foreground font-bold">{selectedUser.avg_energy}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">🌙 การนอน</span>
                    <strong className="font-mono text-sm text-foreground font-bold">{selectedUser.avg_sleep}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">💬 สังคม</span>
                    <strong className="font-mono text-sm text-foreground font-bold">{selectedUser.avg_social}</strong>
                  </div>
                </div>

                {/* Radar Chart for Individual User */}
                {selectedUser.count > 0 && (
                  <div className="p-4 rounded-xl border bg-card space-y-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>🎯</span>
                      <span>{lang === 'th' ? 'ภาพรวมสมดุลชีวิตเฉพาะบุคคลนี้' : 'Personal Well-being Radar'}</span>
                    </h4>
                    <div className="h-60 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={selectedUserRadarData} outerRadius="70%">
                          <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" opacity={0.6} />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 5]}
                            tick={false}
                            axisLine={false}
                          />
                          <RechartsTooltip
                            formatter={(val) => [`${val} / 5`, lang === 'th' ? 'คะแนนเฉลี่ย' : 'Score']}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.96)',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              fontSize: '12px',
                            }}
                          />
                          <Radar
                            name={lang === 'th' ? 'คะแนนเฉลี่ย' : 'Score'}
                            dataKey="score"
                            stroke="#0284c7"
                            strokeWidth={2}
                            fill="#38bdf8"
                            fillOpacity={0.3}
                            dot={{ r: 4, fill: '#0284c7', stroke: '#fff', strokeWidth: 1.5 }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Recent Check-ins List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-brand-600" />
                      <span>{lang === 'th' ? `ประวัติการบันทึก (${selectedUser.checkins.length} รายการ)` : `Check-in History (${selectedUser.checkins.length})`}</span>
                    </h4>
                  </div>

                  {selectedUser.checkins.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center rounded-xl bg-muted/30">
                      {lang === 'th' ? 'ผู้ใช้นี้ยังไม่มีประวัติการเช็คอินในระบบ' : 'No check-in history found for this user.'}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {selectedUser.checkins.map((rec) => {
                        const todBadge =
                          rec.time_of_day === 'morning'
                            ? 'เช้า 🌅'
                            : rec.time_of_day === 'afternoon'
                            ? 'บ่าย ☀️'
                            : 'เย็น/ค่ำ 🌙';

                        return (
                          <div
                            key={rec.id}
                            onClick={() => setSelectedRecordForDetail(rec)}
                            className="p-3 rounded-xl border bg-background hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-foreground">
                                📅 {rec.checkin_date} ({todBadge})
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
                                  😊 {rec.overall_mood}/5
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold font-mono">
                                  🔥 {rec.stress}/5
                                </span>
                              </div>
                            </div>

                            {rec.free_text ? (
                              <p className="text-xs text-foreground font-medium truncate">
                                "{rec.free_text}"
                              </p>
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic">
                                {lang === 'th' ? 'ไม่มีบันทึกข้อความ' : 'No free text note'}
                              </p>
                            )}

                            {(rec.ai_message || rec.ai_food || rec.ai_activity) && (
                              <div className="text-[10px] text-brand-600 font-semibold flex items-center gap-1 pt-0.5">
                                <Sparkles className="w-3 h-3" />
                                <span>{lang === 'th' ? 'คลิกเพื่อดูคำแนะนำจาก AI' : 'Click to view AI recommendations'}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  {lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Link to={`/admin?user=${selectedUser.id}`}>
                    <span>{lang === 'th' ? 'เปิดดูในหน้าแอดมินรวม' : 'Open in Admin Dashboard'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* AI DETAIL MODAL (Matching index.html detailModal style)                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedRecordForDetail && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border shadow-2xl max-w-lg w-full p-6 relative"
            >
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between gap-2 mb-2 pr-8">
                <span className="font-mono font-bold text-brand-700 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 rounded-md border border-brand-200 text-xs">
                  📅 {selectedRecordForDetail.checkin_date} ({selectedRecordForDetail.time_of_day})
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground mb-2 mt-2">
                {selectedRecordForDetail.free_text
                  ? `"${selectedRecordForDetail.free_text}"`
                  : lang === 'th' ? 'บันทึกการเช็คอิน' : 'Check-in Record'}
              </h3>

              {/* Score Row */}
              <div className="grid grid-cols-5 gap-2 my-3 p-3 bg-muted/40 rounded-xl border text-center text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">อารมณ์</span>
                  <strong className="font-mono font-bold text-foreground">{selectedRecordForDetail.overall_mood ?? '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">ความเครียด</span>
                  <strong className="font-mono font-bold text-foreground">{selectedRecordForDetail.stress ?? '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">พลังงาน</span>
                  <strong className="font-mono font-bold text-foreground">{selectedRecordForDetail.energy ?? '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">การนอน</span>
                  <strong className="font-mono font-bold text-foreground">{selectedRecordForDetail.sleep ?? '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">สังคม</span>
                  <strong className="font-mono font-bold text-foreground">{selectedRecordForDetail.social ?? '-'}</strong>
                </div>
              </div>

              {selectedRecordForDetail.ai_message && (
                <div className="mb-3">
                  <span className="text-xs font-bold text-brand-800 dark:text-brand-300 block mb-1">
                    💬 ข้อความจาก AI ถึงคุณ:
                  </span>
                  <p className="text-xs text-foreground leading-relaxed bg-brand-50/70 dark:bg-brand-950/40 p-3 rounded-xl border border-brand-100 dark:border-brand-900">
                    {selectedRecordForDetail.ai_message}
                  </p>
                </div>
              )}

              {selectedRecordForDetail.ai_food && (
                <div className="mb-3">
                  <span className="text-xs font-bold text-foreground block mb-1">
                    🍽️ อาหารและเครื่องดื่มแนะนำ:
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-2.5 rounded-xl border">
                    {selectedRecordForDetail.ai_food}
                  </p>
                </div>
              )}

              {selectedRecordForDetail.ai_activity && (
                <div className="mb-4">
                  <span className="text-xs font-bold text-foreground block mb-1">
                    🧘 กิจกรรมแนะนำ:
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-2.5 rounded-xl border">
                    {selectedRecordForDetail.ai_activity}
                  </p>
                </div>
              )}

              <Button
                onClick={() => setSelectedRecordForDetail(null)}
                className="w-full h-10 rounded-xl font-semibold text-xs cursor-pointer"
              >
                {lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
