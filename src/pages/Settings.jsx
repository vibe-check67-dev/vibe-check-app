import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, LogOut, Loader2, Globe, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const { user, profile, isAdmin, logout, refreshProfile } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
  }, [profile]);

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
