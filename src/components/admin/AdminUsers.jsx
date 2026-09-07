import React, { useState } from 'react';
import { Search, User, ShieldCheck, ChevronRight, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLang } from '@/context/LanguageContext';

export default function AdminUsers({ profiles = [], checkins = [], onSelectUser }) {
  const { t, lang } = useLang();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  // Compute checkin count and avg mood for each profile
  const userStatsMap = {};
  checkins.forEach((c) => {
    const uid = c.user_id;
    if (!userStatsMap[uid]) {
      userStatsMap[uid] = { count: 0, moodSum: 0, latestDate: null };
    }
    userStatsMap[uid].count += 1;
    userStatsMap[uid].moodSum += Number(c.overall_mood || 0);
    if (!userStatsMap[uid].latestDate || new Date(c.checkin_date) > new Date(userStatsMap[uid].latestDate)) {
      userStatsMap[uid].latestDate = c.checkin_date;
    }
  });

  const filteredProfiles = profiles.filter((p) => {
    const q = searchTerm.toLowerCase();
    const email = p.email?.toLowerCase() || '';
    const name = p.display_name?.toLowerCase() || '';
    return email.includes(q) || name.includes(q);
  });

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const selectedUserCheckins = checkins.filter((c) => c.user_id === selectedProfileId);

  return (
    <div className="space-y-6">
      {/* Search and summary */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs sm:text-sm bg-background"
          />
        </div>
        <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
          <span>👥 {profiles.length} {lang === 'th' ? 'บัญชีผู้ใช้งาน' : 'Registered Users'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User directory list */}
        <div className={`bg-card rounded-2xl border shadow-xs overflow-hidden ${selectedProfile ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="p-4 border-b bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" />
              {t('viewUserList')}
            </h3>
            <span className="text-xs text-muted-foreground">
              {filteredProfiles.length} {lang === 'th' ? 'ผู้ใช้' : 'users'}
            </span>
          </div>

          <div className="divide-y divide-border/60 max-h-[500px] overflow-y-auto">
            {filteredProfiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                {t('noData')}
              </div>
            ) : (
              filteredProfiles.map((userProfile) => {
                const stats = userStatsMap[userProfile.id] || { count: 0, moodSum: 0, latestDate: null };
                const avgMood = stats.count > 0 ? (stats.moodSum / stats.count).toFixed(1) : '-';
                const isSelected = selectedProfileId === userProfile.id;

                return (
                  <div
                    key={userProfile.id}
                    onClick={() => {
                      setSelectedProfileId(isSelected ? null : userProfile.id);
                      if (onSelectUser) onSelectUser(isSelected ? 'all' : userProfile.id);
                    }}
                    className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer ${
                      isSelected ? 'bg-brand-50/70 dark:bg-brand-950/20 border-l-4 border-brand-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm border border-brand-200 flex-shrink-0">
                        {userProfile.display_name?.charAt(0)?.toUpperCase() || userProfile.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground truncate">
                            {userProfile.display_name || userProfile.email?.split('@')[0]}
                          </span>
                          {userProfile.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              User
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{userProfile.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block">
                        <div className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">
                          {stats.count} {lang === 'th' ? 'เช็คอิน' : 'check-ins'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {stats.latestDate ? `${lang === 'th' ? 'ล่าสุด' : 'Latest'}: ${stats.latestDate}` : '-'}
                        </div>
                      </div>

                      <div className="hidden md:flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground">{t('kpiAvgMood')}</span>
                        <span className="text-xs font-bold font-mono text-brand-700">{avgMood}</span>
                      </div>

                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90 text-brand-600' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected user detail drawer / panel */}
        {selectedProfile && (
          <div className="bg-card rounded-2xl border shadow-xs p-5 space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                  {selectedProfile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {selectedProfile.display_name || selectedProfile.email?.split('@')[0]}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">{selectedProfile.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfileId(null)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{lang === 'th' ? 'วันที่ลงทะเบียน' : 'Joined Date'}:</span>
                <span className="font-mono text-foreground">{selectedProfile.created_at?.slice(0, 10) || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{lang === 'th' ? 'จำนวนบันทึกทั้งหมด' : 'Total Records'}:</span>
                <span className="font-mono font-bold text-foreground">{selectedUserCheckins.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t('kpiAvgMood')}:</span>
                <span className="font-mono font-bold text-brand-600">
                  {selectedUserCheckins.length > 0
                    ? (
                        selectedUserCheckins.reduce((sum, c) => sum + Number(c.overall_mood || 0), 0) /
                        selectedUserCheckins.length
                      ).toFixed(1)
                    : '-'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <h5 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-brand-600" />
                {lang === 'th' ? 'ประวัติการเช็คอินล่าสุด' : 'Recent Check-ins'}
              </h5>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedUserCheckins.slice(0, 5).map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {c.checkin_date} ({c.time_of_day})
                      </span>
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 text-[10px]">
                        Mood {c.overall_mood}/5
                      </span>
                    </div>
                    {c.free_text && (
                      <p className="text-[11px] text-muted-foreground italic truncate">"{c.free_text}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
