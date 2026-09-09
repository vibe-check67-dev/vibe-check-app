import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, LogOut, Loader2, Globe, Sparkles, Shield, Send, Plus, Trash2, Clock, MessageSquare, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  isNotificationSupported,
  getCurrentPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationSettings,
  saveNotificationSettings,
  getLocalTimezone,
} from '@/lib/pushNotifications';

export default function Settings() {
  const { user, profile, isAdmin, logout, refreshProfile } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);

  // Push notifications state
  const [pushSupported, setPushSupported] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [reminderTimes, setReminderTimes] = useState(['07:00', '18:00']);
  const [timezone, setTimezone] = useState(getLocalTimezone());
  const [savingReminders, setSavingReminders] = useState(false);

  // Discord notifications state
  const [discordId, setDiscordId] = useState('');
  const [testDiscordLoading, setTestDiscordLoading] = useState(false);
  const [testDiscordStatus, setTestDiscordStatus] = useState(null);
  const [showDiscordGuide, setShowDiscordGuide] = useState(false);
  
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    biological_sex: '',
    diseases: '',
    food_allergies: '',
    dislikes_food: '',
    dislikes_music: '',
    dislikes_activities: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        weight: profile.weight || '',
        height: profile.height || '',
        biological_sex: profile.biological_sex || '',
        diseases: profile.diseases || '',
        food_allergies: profile.food_allergies || '',
        dislikes_food: profile.dislikes_food || '',
        dislikes_music: profile.dislikes_music || '',
        dislikes_activities: profile.dislikes_activities || ''
      });
    }

    // Check notification support and load settings
    const supported = isNotificationSupported();
    setPushSupported(supported);
    setTimezone(getLocalTimezone());

    if (user?.id) {
      getNotificationSettings(user.id).then((settings) => {
        if (settings) {
          setPushEnabled(!!settings.enabled);
          if (Array.isArray(settings.reminder_times) && settings.reminder_times.length > 0) {
            setReminderTimes(settings.reminder_times);
          }
          if (settings.timezone && settings.timezone !== 'auto') {
            setTimezone(settings.timezone);
          }
          if (settings.discord_id) {
            setDiscordId(settings.discord_id);
          }
        }
      });
    } else if (supported) {
      getCurrentPushSubscription().then((sub) => {
        setPushEnabled(!!sub);
      });
    }
  }, [profile, user?.id]);

  const handleTogglePush = async (checked) => {
    setPushLoading(true);
    setTestStatus(null);
    try {
      if (checked) {
        if (pushSupported) {
          try {
            await subscribeToPush(user?.id);
          } catch (e) {
            console.warn('Browser push subscription skipped/failed:', e.message);
          }
        }
        setPushEnabled(true);
        await saveNotificationSettings(user?.id, {
          enabled: true,
          reminder_times: reminderTimes,
          timezone,
          discord_id: discordId,
        });
        setTestStatus({
          type: 'success',
          message: lang === 'th'
            ? `เปิดการแจ้งเตือนสำเร็จแล้ว! ระบบจะเตือนคุณตามเวลา (${reminderTimes.join(', ')})`
            : `Notifications enabled! Set for: ${reminderTimes.join(', ')}`,
        });
      } else {
        if (pushSupported) {
          await unsubscribeFromPush(user?.id);
        }
        setPushEnabled(false);
        await saveNotificationSettings(user?.id, {
          enabled: false,
          reminder_times: reminderTimes,
          timezone,
          discord_id: discordId,
        });
        setTestStatus({
          type: 'info',
          message: lang === 'th' ? 'ปิดการแจ้งเตือนแล้ว' : 'Notifications disabled.',
        });
      }
    } catch (err) {
      console.error('Push toggle error:', err);
      alert(err.message || 'เกิดข้อผิดพลาดในการตั้งค่าการแจ้งเตือน');
      setPushEnabled(!checked);
    } finally {
      setPushLoading(false);
    }
  };

  const handleAddReminderTime = () => {
    const candidateTimes = ['07:00', '12:00', '18:00', '21:00', '09:00', '15:00', '20:00', '22:00'];
    const nextTime = candidateTimes.find((t) => !reminderTimes.includes(t)) ||
      Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).find((t) => !reminderTimes.includes(t)) ||
      '12:00';
    setReminderTimes((prev) => [...prev, nextTime]);
  };

  const handleRemoveReminderTime = (index) => {
    if (reminderTimes.length <= 1) return;
    setReminderTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index, val) => {
    setReminderTimes((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleSaveReminderSettings = async () => {
    setSavingReminders(true);
    setTestStatus(null);
    setTestDiscordStatus(null);
    try {
      // Sanitize, format to HH:00, deduplicate and sort chronologically
      const validTimes = Array.from(
        new Set(
          reminderTimes
            .map((t) => (t || '').trim())
            .filter((t) => /^\d{1,2}(:\d{2})?$/.test(t))
            .map((t) => {
              const h = t.split(':')[0];
              return `${h.padStart(2, '0')}:00`;
            })
        )
      ).sort((a, b) => a.localeCompare(b));

      const finalTimes = validTimes.length > 0 ? validTimes : ['07:00', '18:00'];
      setReminderTimes(finalTimes);

      // Validate discordId if filled
      const cleanDiscordId = (discordId || '').trim();
      if (cleanDiscordId && !/^\d{17,20}$/.test(cleanDiscordId)) {
        throw new Error(lang === 'th' ? 'Discord ID ต้องเป็นตัวเลขล้วน 17-20 หลัก (เช่น 123456789012345678)' : 'Discord ID must be a 17-20 digit numeric snowflake');
      }

      // Auto-enable reminders when user saves their settings and Discord ID is provided
      const willBeEnabled = pushEnabled || Boolean(cleanDiscordId);
      if (willBeEnabled && !pushEnabled) {
        setPushEnabled(true);
      }

      await saveNotificationSettings(user?.id, {
        enabled: willBeEnabled,
        reminder_times: finalTimes,
        timezone,
        discord_id: cleanDiscordId,
      });

      setTestStatus({
        type: 'success',
        message: lang === 'th' ? 'บันทึกการตั้งค่าแจ้งเตือนและ Discord ID สำเร็จแล้ว!' : 'Notification settings & Discord ID saved!',
      });
    } catch (err) {
      console.error('Error saving reminder times:', err);
      setTestStatus({
        type: 'error',
        message: err.message || 'Error saving settings',
      });
    } finally {
      setSavingReminders(false);
    }
  };

  const handleTestDiscordNotification = async () => {
    const cleanId = (discordId || '').trim();
    if (!cleanId) {
      setTestDiscordStatus({
        type: 'error',
        message: lang === 'th' ? 'กรุณากรอก Discord ID ของคุณก่อนทดสอบ' : 'Please enter your Discord ID first',
      });
      return;
    }
    if (!/^\d{17,20}$/.test(cleanId)) {
      setTestDiscordStatus({
        type: 'error',
        message: lang === 'th' ? 'Discord ID ต้องเป็นตัวเลขล้วน 17-20 หลัก' : 'Discord ID must be 17-20 digits',
      });
      return;
    }

    setTestDiscordLoading(true);
    setTestDiscordStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/notifications/send-reminder?test=1&discord_id=${cleanId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (lang === 'th' ? 'ส่งข้อความไม่สำเร็จ' : 'Failed to send DM'));
      }
      setTestDiscordStatus({
        type: 'success',
        message: lang === 'th'
          ? 'ส่งข้อความทดสอบไปยัง Discord DM ของคุณสำเร็จแล้ว! ตรวจสอบแชทใน Discord ได้เลยครับ 🎉'
          : 'Test message sent to your Discord DM! Check your Discord app.',
      });
    } catch (err) {
      console.error('Discord test error:', err);
      setTestDiscordStatus({
        type: 'error',
        message: `${err.message || 'Error'} ${
          lang === 'th'
            ? '(หมายเหตุ: บอทต้องอยู่ในเซิร์ฟเวอร์เดียวกับคุณ และต้องเปิด "Allow Direct Messages" ในเซิร์ฟเวอร์นั้น)'
            : ''
        }`,
      });
    } finally {
      setTestDiscordLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          weight: formData.weight,
          height: formData.height,
          biological_sex: formData.biological_sex,
          diseases: formData.diseases,
          food_allergies: formData.food_allergies,
          dislikes_food: formData.dislikes_food,
          dislikes_music: formData.dislikes_music,
          dislikes_activities: formData.dislikes_activities,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      await refreshProfile();
      alert(lang === 'th' ? 'บันทึกข้อมูลสำเร็จ' : 'Settings saved successfully');
    } catch (err) {
      console.error(err);
      alert(lang === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก' : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleViewOnboarding = () => {
    localStorage.removeItem('vibecheck_onboarding');
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          {lang === 'th' ? 'การตั้งค่า' : 'Settings'}
        </h1>
        <Button variant="outline" size="sm" onClick={handleLogout} className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl">
          <LogOut className="w-4 h-4 mr-2" />
          {t('logout')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={toggleLang} className="rounded-xl flex gap-2">
          <Globe className="w-4 h-4" />
          {lang === 'th' ? 'เปลี่ยนเป็น English' : 'Switch to ภาษาไทย'}
        </Button>
        <Button variant="secondary" onClick={handleViewOnboarding} className="rounded-xl flex gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          {lang === 'th' ? 'ดูหน้าแนะนำแอปอีกครั้ง' : 'View App Intro'}
        </Button>
      </div>

      {isAdmin && (
        <Button asChild variant="outline" className="w-full rounded-xl border-brand-200 text-brand-700 hover:bg-brand-50 flex gap-2">
          <Link to="/admin">
            <Shield className="w-4 h-4" />
            {t('adminPanel')}
          </Link>
        </Button>
      )}

      {/* Notification Settings Card: Discord Bot DM & Web Push */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-5">
        {/* Header with Master Switch */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4 text-[#5865F2]" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                {lang === 'th' ? 'ระบบแจ้งเตือนเตือนเติมไฟ (Discord Bot DM)' : 'Discord DM Check-in Reminders'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-10">
              {lang === 'th'
                ? 'ตั้งเวลาเตือนรายชั่วโมง โดยบอทจะส่งข้อความแจ้งเตือนส่วนตัว (DM) พร้อมแท็กคุณใน Discord ส่งตรงถึงมือถือและคอมพิวเตอร์'
                : 'Hourly check-in reminders sent directly to your Discord DM with user tag. Works on mobile & desktop.'}
            </p>
          </div>

          <div className="pt-1">
            {pushLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <Switch
                checked={pushEnabled}
                onCheckedChange={handleTogglePush}
                disabled={pushLoading}
              />
            )}
          </div>
        </div>

        {!pushEnabled && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-border/80 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>
              {lang === 'th'
                ? '💡 เปิดสวิตช์ด้านบนเพื่อตั้งค่า Discord ID, กำหนดเวลาเตือนใจ และทดสอบส่งข้อความ DM'
                : '💡 Turn on the switch above to configure Discord ID, set reminder times, and test DM.'}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTogglePush(true)}
              className="h-8 text-xs rounded-lg px-3 font-semibold self-start sm:self-auto cursor-pointer"
            >
              {lang === 'th' ? 'เปิดใช้งานตอนนี้' : 'Enable Now'}
            </Button>
          </div>
        )}

        {pushEnabled && (
          <div className="space-y-4 pt-2 border-t">
            {/* 1. Discord ID Configuration Field */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#5865F2]" />
                  <span>{lang === 'th' ? 'Discord User ID (สำหรับส่งข้อความและแท็กคุณ)' : 'Discord User ID'}</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setShowDiscordGuide(!showDiscordGuide)}
                  className="text-[11px] text-[#5865F2] hover:underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showDiscordGuide ? (lang === 'th' ? 'ซ่อนวิธีหา ID' : 'Hide Guide') : (lang === 'th' ? 'วิธีดู Discord ID ของคุณ' : 'How to find your Discord ID')}</span>
                  {showDiscordGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <div className="space-y-1">
                <Input
                  type="text"
                  placeholder={lang === 'th' ? 'เช่น 123456789012345678 (ตัวเลข 17-20 หลัก)' : 'e.g. 123456789012345678 (17-20 digits)'}
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value.replace(/\D/g, ''))}
                  className="font-mono text-xs sm:text-sm rounded-xl h-10 bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  {lang === 'th'
                    ? 'กรอกตัวเลข Discord User ID ของคุณ เพื่อให้บอทค้นหาและส่งข้อความหาคุณได้ถูกต้อง'
                    : 'Enter your numeric Discord User ID so the bot can DM and tag you.'}
                </p>
              </div>

              {/* Discord Guide Collapsible Box */}
              {showDiscordGuide && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-2 text-slate-700 dark:text-slate-200">
                  <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>📋 ขั้นตอนการคัดลอก Discord User ID:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-[11px]">
                    <li>
                      เปิดแอป Discord แล้วไปที่ <strong>User Settings</strong> (ไอคอนรูปฟันเฟือง ⚙️ มุมซ้ายล่าง)
                    </li>
                    <li>
                      เลือกเมนู <strong>Advanced (ขั้นสูง)</strong> จากนั้นเปิดสวิตช์ <strong>Developer Mode (โหมดนักพัฒนา)</strong>
                    </li>
                    <li>
                      ไปที่ชื่อโปรไฟล์ของคุณ (ด้านล่างซ้าย หรือในเซิร์ฟเวอร์) แล้วคลิกขวา (บนมือถือ: กดค้างที่โปรไฟล์ แล้วกดจุดสามจุด)
                    </li>
                    <li>
                      เลือก <strong>"Copy User ID" (คัดลอก ID ผู้ใช้)</strong> แล้วนำตัวเลขยาวๆ มาวางในช่องด้านบนนี้
                    </li>
                  </ol>
                  <div className="pt-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/60">
                    💡 <strong>ข้อสำคัญ:</strong> บอทและคุณต้องอยู่ใน Discord Server เดียวกันอย่างน้อย 1 เซิร์ฟเวอร์ และคุณต้องเปิด <em>"Allow Direct Messages"</em> ในการตั้งค่าความเป็นส่วนตัวของเซิร์ฟเวอร์นั้น
                  </div>
                </div>
              )}
            </div>

            {/* 2. Detected Timezone */}
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl">
              <span>🌐 {t('detectedTimezone') || 'Detected Timezone'}:</span>
              <span className="font-mono font-semibold text-foreground">{timezone}</span>
            </div>

            {/* 3. Reminder Times Header */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {t('reminderTimes') || 'Reminder Times'}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddReminderTime}
                className="h-8 rounded-xl text-xs gap-1 border-dashed hover:bg-primary/5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('addReminderTime') || 'Add Time'}
              </Button>
            </div>

            {/* Dynamic Times List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {reminderTimes.map((time, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl border bg-background"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground w-6 text-center">
                      #{idx + 1}
                    </span>
                    <select
                      value={time.endsWith(':00') ? time : `${time.split(':')[0].padStart(2, '0')}:00`}
                      onChange={(e) => handleTimeChange(idx, e.target.value)}
                      className="h-9 w-28 rounded-lg font-mono text-xs sm:text-sm px-2 border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt} {lang === 'th' ? 'น.' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {reminderTimes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveReminderTime(idx)}
                      className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                      title={t('removeReminderTime') || 'Remove'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Bar: Save Times + Test Discord DM */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveReminderSettings}
                disabled={savingReminders}
                className="rounded-xl text-xs font-semibold gap-1.5 h-10 px-4 cursor-pointer"
              >
                {savingReminders ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'th' ? 'บันทึกเวลาและการตั้งค่าแจ้งเตือน' : 'Save Notification Settings'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestDiscordNotification}
                disabled={testDiscordLoading || !discordId}
                className="rounded-xl text-xs flex items-center gap-1.5 h-10 border-[#5865F2]/40 text-[#5865F2] hover:bg-[#5865F2]/10 cursor-pointer"
              >
                {testDiscordLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'th' ? 'ทดสอบส่ง Discord DM' : 'Test Discord DM'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {testStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-medium transition-all ${
              testStatus.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200'
                : testStatus.type === 'error'
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {testStatus.message}
          </div>
        )}

        {testDiscordStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-medium transition-all ${
              testDiscordStatus.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {testDiscordStatus.message}
          </div>
        )}
      </div>

      <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold">{lang === 'th' ? 'ประวัติส่วนตัว (AI Context)' : 'Personal Profile'}</h2>
          <p className="text-sm text-muted-foreground">{lang === 'th' ? 'ข้อมูลเหล่านี้จะช่วยให้ AI สร้างคำแนะนำได้เหมาะสมกับคุณมากขึ้น' : 'These details help the AI generate more personalized recommendations for you.'}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-1 text-brand-700">{lang === 'th' ? 'ข้อมูลร่างกาย' : 'Physical Data'}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{lang === 'th' ? 'น้ำหนัก (กก.)' : 'Weight (kg)'}</Label>
                <Input value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'th' ? 'ส่วนสูง (ซม.)' : 'Height (cm)'}</Label>
                <Input value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>{lang === 'th' ? 'เพศโดยกำเนิด' : 'Biological Sex'}</Label>
                <Input value={formData.biological_sex} onChange={e => setFormData({...formData, biological_sex: e.target.value})} className="rounded-xl" placeholder={lang === 'th' ? 'เช่น ชาย, หญิง' : 'e.g. Male, Female'} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-1 text-brand-700">{lang === 'th' ? 'สุขภาพ' : 'Health'}</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{lang === 'th' ? 'โรคประจำตัว' : 'Underlying Diseases'}</Label>
                <Textarea value={formData.diseases} onChange={e => setFormData({...formData, diseases: e.target.value})} className="rounded-xl resize-none" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'th' ? 'อาหารที่แพ้' : 'Food Allergies'}</Label>
                <Textarea value={formData.food_allergies} onChange={e => setFormData({...formData, food_allergies: e.target.value})} className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-1 text-brand-700">{lang === 'th' ? 'สิ่งที่ไม่ชอบ' : 'Dislikes'}</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{lang === 'th' ? 'อาหารที่ไม่ชอบ' : 'Disliked Foods'}</Label>
                <Input value={formData.dislikes_food} onChange={e => setFormData({...formData, dislikes_food: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'th' ? 'แนวเพลง/เพลงที่ไม่ชอบ' : 'Disliked Music Genres'}</Label>
                <Input value={formData.dislikes_music} onChange={e => setFormData({...formData, dislikes_music: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'th' ? 'กิจกรรมที่ไม่ชอบ' : 'Disliked Activities'}</Label>
                <Input value={formData.dislikes_activities} onChange={e => setFormData({...formData, dislikes_activities: e.target.value})} className="rounded-xl" />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl font-bold">
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {lang === 'th' ? 'บันทึกข้อมูล' : 'Save Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}
