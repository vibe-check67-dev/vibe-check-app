import React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '@/context/LanguageContext';
import { subDays } from 'date-fns';
import { Activity, Sparkles, Zap, ShieldAlert, Users, Moon } from 'lucide-react';

export default function MoodBreakdown({ checkins }) {
  const { t, lang } = useLang();

  const last7 = (checkins || []).filter((c) => {
    if (!c.checkin_date) return false;
    const d = new Date(c.checkin_date);
    return d >= subDays(new Date(), 7);
  });

  const avg = (key) => {
    const vals = last7.map((c) => c[key]).filter(Boolean);
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
  };

  const dimensions = [
    {
      key: 'energy',
      name: t('energy'),
      val: avg('energy'),
      icon: Zap,
      emoji: '⚡',
      barGradient: 'from-orange-500 via-amber-400 to-amber-500',
      badgeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      status: (val) => (val >= 4 ? (lang === 'th' ? 'มีพลังสูง' : 'High') : val >= 2.5 ? (lang === 'th' ? 'ระดับปกติ' : 'Normal') : (lang === 'th' ? 'หมดแรง' : 'Low')),
    },
    {
      key: 'stress',
      name: t('stress'),
      val: avg('stress'),
      icon: ShieldAlert,
      emoji: '😌',
      barGradient: 'from-teal-500 via-emerald-400 to-emerald-500',
      badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      status: (val) => (val <= 2 ? (lang === 'th' ? 'ผ่อนคลาย' : 'Calm') : val <= 3.5 ? (lang === 'th' ? 'ปานกลาง' : 'Moderate') : (lang === 'th' ? 'ตึงเครียด' : 'High')),
    },
    {
      key: 'social',
      name: t('social'),
      val: avg('social'),
      icon: Users,
      emoji: '🦋',
      barGradient: 'from-sky-500 via-blue-400 to-indigo-500',
      badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      status: (val) => (val >= 4 ? (lang === 'th' ? 'อยากเข้าสังคม' : 'Social') : val >= 2.5 ? (lang === 'th' ? 'ตามปกติ' : 'Neutral') : (lang === 'th' ? 'ต้องการความเงียบ' : 'Solo')),
    },
    {
      key: 'sleep',
      name: t('sleep'),
      val: avg('sleep'),
      icon: Moon,
      emoji: '🌟',
      barGradient: 'from-indigo-500 via-violet-400 to-purple-500',
      badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      status: (val) => (val >= 4 ? (lang === 'th' ? 'หลับเต็มอิ่ม' : 'Restful') : val >= 2.5 ? (lang === 'th' ? 'พอใช้' : 'Fair') : (lang === 'th' ? 'นอนไม่พอ' : 'Poor')),
    },
  ];

  if (last7.length === 0) {
    return (
      <div className="bg-card/85 dark:bg-card/75 backdrop-blur-xl rounded-3xl border border-border/70 p-5 space-y-3 shadow-xl shadow-black/5 dark:shadow-black/25 text-center">
        <div className="flex items-center justify-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm">{t('moodBreakdown')}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === 'th'
            ? 'ยังไม่มีการเช็คอินในรอบ 7 วันที่ผ่านมา บันทึกเช็คอินวันนี้เพื่อดูค่าสถิติอารมณ์ของคุณ ✨'
            : 'No check-ins in the last 7 days. Check in today to see your dimension breakdown! ✨'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card/85 dark:bg-card/75 backdrop-blur-xl rounded-3xl border border-border/70 p-5 space-y-5 shadow-xl shadow-black/5 dark:shadow-black/25 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-foreground tracking-tight text-base">
              {t('moodBreakdown')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === 'th' ? 'ค่าเฉลี่ย 4 มิติในรอบ 7 วันล่าสุด' : '4-Dimension Averages (Last 7 Days)'}
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/80 text-muted-foreground border border-border/50 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>{last7.length} {lang === 'th' ? 'บันทึก' : 'entries'}</span>
        </div>
      </div>

      {/* Progress Cards List */}
      <div className="space-y-4">
        {dimensions.map((dim) => {
          const percent = Math.min(100, Math.max(0, (dim.val / 5) * 100));

          return (
            <div key={dim.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base select-none">{dim.emoji}</span>
                  <span className="font-bold text-foreground">{dim.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${dim.badgeBg}`}>
                    {dim.status(dim.val)}
                  </span>
                </div>

                <div className="font-mono font-bold text-foreground text-xs flex items-center gap-0.5">
                  <span className="text-sm text-primary">{dim.val}</span>
                  <span className="text-muted-foreground/60 text-[10px]">/ 5.0</span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-2.5 w-full rounded-full bg-secondary/70 dark:bg-secondary/40 overflow-hidden p-0.5 border border-border/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${dim.barGradient} shadow-xs`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}