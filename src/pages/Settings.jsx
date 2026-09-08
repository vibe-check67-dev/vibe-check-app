import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, LogOut, Loader2, Globe, Sparkles, Shield, Bell, Send, Plus, Trash2, Clock } from 'lucide-react';
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
  triggerTestPush,
  getNotificationSettings,
  saveNotificationSettings,
  getLocalTimezone,
} from '@/lib/pushNotifications';

export default function Settings() {
  const { user, profile, isAdmin, logout, refreshProfile } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Push notifications state
  const [pushSupported, setPushSupported] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [reminderTimes, setReminderTimes] = useState(['07:00', '18:00']);
  const [timezone, setTimezone] = useState(getLocalTimezone());
  const [savingReminders, setSavingReminders] = useState(false);
  
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
        await subscribeToPush(user?.id);
        setPushEnabled(true);
        await saveNotificationSettings(user?.id, {
          enabled: true,
          reminder_times: reminderTimes,
          timezone,
        });
        setTestStatus({
          type: 'success',
          message: lang === 'th'
            ? `เปิดการแจ้งเตือนสำเร็จแล้ว! ระบบจะเตือนคุณตามเวลา (${reminderTimes.join(', ')})`
            : `Notifications enabled! Set for: ${reminderTimes.join(', ')}`,
        });
      } else {
        await unsubscribeFromPush(user?.id);
        setPushEnabled(false);
        await saveNotificationSettings(user?.id, {
          enabled: false,
          reminder_times: reminderTimes,
          timezone,
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

      await saveNotificationSettings(user?.id, {
        enabled: pushEnabled,
        reminder_times: finalTimes,
        timezone,
      });
      setTestStatus({
        type: 'success',
        message: t('notificationSettingsSaved') || 'Reminder times saved & scheduled!',
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

  const handleTestPushNotification = async () => {
    setTestLoading(true);
    setTestStatus(null);
    try {
      await triggerTestPush();
      setTestStatus({
        type: 'success',
        message: lang === 'th' ? 'ส่งการแจ้งเตือนแล้ว! ตรวจสอบแถบแจ้งเตือนของคุณได้เลยครับ 🔥' : 'Test notification sent! Check your notification bar.',
      });
    } catch (err) {
      console.error('Test push error:', err);
      setTestStatus({
        type: 'error',
        message: err.message || (lang === 'th' ? 'ส่งการแจ้งเตือนไม่สำเร็จ' : 'Failed to send test notification'),
      });
    } finally {
      setTestLoading(false);
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

      {/* Push Notification Card */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                {t('notificationsTitle') || (lang === 'th' ? 'การแจ้งเตือนเตือนเติมไฟบนมือถือ' : 'Daily Check-in Reminders')}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-10">
              {t('notificationsDesc') || (lang === 'th'
                ? 'ตั้งเวลาเตือนรายชั่วโมง แจ้งเตือนผ่าน Web Push ปลุกหน้าจอได้แม้ปิดเว็บหรือปิดหน้าจอ ฟรี 100%'
                : 'Hourly check-in reminders via Web Push. Wakes screen even when the app or browser is closed. 100% free.')}
            </p>
          </div>

          <div className="pt-1">
            {pushLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <Switch
                checked={pushEnabled}
                onCheckedChange={handleTogglePush}
                disabled={!pushSupported || pushLoading}
              />
            )}
          </div>
        </div>

        {pushEnabled && (
          <div className="space-y-3 pt-1 border-t">
            {/* Detected Timezone */}
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl">
              <span>🌐 {t('detectedTimezone') || 'Detected Timezone'}:</span>
              <span className="font-mono font-semibold text-foreground">{timezone}</span>
            </div>

            {/* Reminder Times Header */}
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
                className="h-8 rounded-xl text-xs gap-1 border-dashed hover:bg-primary/5"
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

            {/* Action Bar: Save Times + Test Push */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveReminderSettings}
                disabled={savingReminders}
                className="rounded-xl text-xs font-semibold gap-1.5 h-9"
              >
                {savingReminders ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{t('saveNotificationSettings') || 'Save Times'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestPushNotification}
                disabled={testLoading}
                className="rounded-xl text-xs flex items-center gap-1.5 h-9 border-primary/20 hover:bg-primary/5"
              >
                {testLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-primary" />
                )}
                <span>{t('testNotification') || (lang === 'th' ? 'ทดสอบส่งแจ้งเตือน' : 'Send Test')}</span>
              </Button>
            </div>
          </div>
        )}

        {!pushSupported && (
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
            {lang === 'th'
              ? '⚠️ เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับ Web Push Notification (หากใช้ iPhone ต้องกด Add to Home Screen ก่อน)'
              : '⚠️ Web Push is not supported in this browser environment.'}
          </div>
        )}

        {testStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-medium transition-all ${
              testStatus.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : testStatus.type === 'error'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {testStatus.message}
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
