import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, LogOut, Loader2, Globe, Sparkles, Shield, Bell, BellOff, Send, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  isPushSupported,
  getCurrentPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  triggerTestPush,
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

    // Check push support and current subscription
    const supported = isPushSupported();
    setPushSupported(supported);
    if (supported) {
      getCurrentPushSubscription().then((sub) => {
        setPushEnabled(!!sub);
      });
    }
  }, [profile]);

  const handleTogglePush = async (checked) => {
    setPushLoading(true);
    setTestStatus(null);
    try {
      if (checked) {
        await subscribeToPush(user?.id);
        setPushEnabled(true);
        setTestStatus({
          type: 'success',
          message: lang === 'th' ? 'เปิดการแจ้งเตือนสำเร็จแล้ว! ระบบจะเตือนคุณทุกวันเวลา 20:00 น.' : 'Notifications enabled! We will remind you daily at 20:00.',
        });
      } else {
        await unsubscribeFromPush(user?.id);
        setPushEnabled(false);
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

  const handleTestPushNotification = async () => {
    setTestLoading(true);
    setTestStatus(null);
    try {
      await triggerTestPush();
      setTestStatus({
        type: 'success',
        message: lang === 'th' ? 'ส่งการแจ้งเตือนแล้ว! ลองดูที่แถบแจ้งเตือนด้านบนมือถือของคุณได้เลยครับ 🔥' : 'Test notification sent! Check your notification bar.',
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
                {lang === 'th' ? 'การแจ้งเตือนเตือนเติมไฟบนมือถือ' : 'Mobile Push Reminders'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-10">
              {lang === 'th'
                ? 'เตือนให้คุณมาเช็คอินอารมณ์วันละ 2 รอบ: 08:00 น. (ยามเช้า) และ 18:00 น. (ยามเย็น) แม้จะปิดหน้าเว็บอยู่'
                : 'Reminds you to check-in twice daily: at 08:00 (morning) and 18:00 (evening), even when the browser is closed.'}
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
          <div className="pl-10 flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20">
              ☀️ {lang === 'th' ? 'รอบเช้า: 08:00 น.' : 'Morning: 08:00'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-orange-500/10 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-lg border border-orange-500/20">
              🔥 {lang === 'th' ? 'รอบเย็น: 18:00 น.' : 'Evening: 18:00'}
            </span>
          </div>
        )}

        {!pushSupported && (
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
            {lang === 'th'
              ? '⚠️ เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับ Web Push Notification (หากใช้ iPhone ต้องกด Add to Home Screen ก่อน)'
              : '⚠️ Web Push is not supported in this browser environment.'}
          </div>
        )}

        {pushEnabled && (
          <div className="pt-2 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'th' ? 'ระบบพร้อมแจ้งเตือนตามเวลา' : 'Notifications scheduled'}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestPushNotification}
              disabled={testLoading}
              className="w-full sm:w-auto rounded-xl text-xs flex items-center gap-2 border-primary/20 hover:bg-primary/5"
            >
              {testLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{lang === 'th' ? 'ทดสอบส่งแจ้งเตือนเข้ามือถือ' : 'Send Test Push'}</span>
            </Button>
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
