import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLang } from '@/context/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { getAllCheckins, getAllProfiles } from '@/lib/database';
import AdminData from '@/components/admin/AdminData';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminAISettings from '@/components/admin/AdminAISettings';

export default function Admin() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('data');
  const [checkins, setCheckins] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  // Load all checkins and profiles for admin
  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [allCheckins, allProfiles] = await Promise.all([
        getAllCheckins().catch((err) => {
          console.error('Error loading checkins:', err);
          return [];
        }),
        getAllProfiles().catch((err) => {
          console.error('Error loading profiles:', err);
          return [];
        }),
      ]);

      setCheckins(allCheckins);
      setProfiles(allProfiles);
    } catch (err) {
      console.error('Admin data load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();

    // ============================================
    // SUPABASE REALTIME SUBSCRIPTION
    // ============================================
    const checkinChannel = supabase
      .channel('admin-realtime-moods')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mood_checkins' },
        (payload) => {
          console.log('Realtime check-in change received:', payload);
          loadAdminData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Realtime profile change received:', payload);
          loadAdminData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeActive(true);
        } else {
          setIsRealtimeActive(false);
        }
      });

    return () => {
      supabase.removeChannel(checkinChannel);
    };
  }, [loadAdminData]);

  if (loading && checkins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-xs text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {t('adminPanel')}
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('adminExecutiveReport')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t('adminSubtitle')}</p>
        </div>

        <div className="text-xs text-muted-foreground">
          {lang === 'th' ? 'เข้าสู่ระบบในฐานะ:' : 'Logged in as:'}{' '}
          <span className="font-bold text-foreground font-mono">{profile?.email}</span>
        </div>
      </motion.div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-11 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border">
          <TabsTrigger
            value="data"
            className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xs cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <span>{t('tabDataAnalytics')}</span>
          </TabsTrigger>

          <TabsTrigger
            value="users"
            className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xs cursor-pointer"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>{t('tabUsers')} ({profiles.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="ai"
            className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t('tabAISettings')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Data & Analytics */}
        <TabsContent value="data" className="mt-0 focus-visible:outline-none">
          <AdminData
            checkins={checkins}
            profiles={profiles}
            onDataMutated={loadAdminData}
            isRealtimeActive={isRealtimeActive}
          />
        </TabsContent>

        {/* Tab 2: Users */}
        <TabsContent value="users" className="mt-0 focus-visible:outline-none">
          <AdminUsers
            profiles={profiles}
            checkins={checkins}
            onSelectUser={(uid) => {
              // Switch to data tab with this user selected
              setActiveTab('data');
            }}
          />
        </TabsContent>

        {/* Tab 3: AI Settings */}
        <TabsContent value="ai" className="mt-0 focus-visible:outline-none">
          <AdminAISettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
