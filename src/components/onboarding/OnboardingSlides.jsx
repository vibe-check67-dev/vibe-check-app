import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLang } from '@/context/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const slides = [
  { titleKey: 'onboard1Title', descKey: 'onboard1Desc', emoji: '✨' },
  { titleKey: 'onboard2Title', descKey: 'onboard2Desc', emoji: '🎯' },
  { titleKey: 'onboard3Title', descKey: 'onboard3Desc', emoji: '📊' },
  { titleKey: 'onboardProfileTitle', descKey: 'onboardProfileDesc', emoji: '⚙️', isProfile: true },
];

export default function OnboardingSlides({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const { t, lang } = useLang();
  const { user, refreshProfile } = useAuth();
  
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

  const handleNext = async () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      if (slides[current].isProfile && user) {
        setSaving(true);
        try {
          await supabase.from('profiles').update(formData).eq('id', user.id);
          await refreshProfile();
        } catch (e) {
          console.error(e);
        }
      }
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-between p-6 overflow-y-auto">
      <div className="self-end pt-2 shrink-0">
        <LanguageToggle />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col items-center justify-center w-full max-w-sm shrink-0 my-4"
        >
          <div className="text-5xl md:text-7xl mb-4">{slides[current].emoji}</div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-3 text-center">
            {slides[current].isProfile 
              ? (lang === 'th' ? 'ตั้งค่าโปรไฟล์ส่วนตัว' : 'Personal Profile Settings') 
              : t(slides[current].titleKey)}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed text-center mb-6">
            {slides[current].isProfile 
              ? (lang === 'th' ? 'ข้อมูลเหล่านี้จะช่วยให้ AI สร้างคำแนะนำได้เหมาะสมกับคุณมากขึ้น' : 'These details help the AI generate more personalized recommendations.') 
              : t(slides[current].descKey)}
          </p>

          {slides[current].isProfile && (
            <div className="w-full space-y-4 text-left bg-card p-4 rounded-2xl border shadow-sm max-h-[40vh] overflow-y-auto">
               <div className="space-y-2">
                  <Label className="text-xs">{lang === 'th' ? 'น้ำหนัก (กก.)' : 'Weight (kg)'}</Label>
                  <Input value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="h-9 text-sm" />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs">{lang === 'th' ? 'ส่วนสูง (ซม.)' : 'Height (cm)'}</Label>
                  <Input value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="h-9 text-sm" />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs">{lang === 'th' ? 'เพศโดยกำเนิด' : 'Biological Sex'}</Label>
                  <Input value={formData.biological_sex} onChange={e => setFormData({...formData, biological_sex: e.target.value})} className="h-9 text-sm" placeholder={lang === 'th' ? 'เช่น ชาย, หญิง' : 'e.g. Male'} />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs">{lang === 'th' ? 'โรคประจำตัว' : 'Underlying Diseases'}</Label>
                  <Input value={formData.diseases} onChange={e => setFormData({...formData, diseases: e.target.value})} className="h-9 text-sm" />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs">{lang === 'th' ? 'อาหารที่แพ้' : 'Food Allergies'}</Label>
                  <Input value={formData.food_allergies} onChange={e => setFormData({...formData, food_allergies: e.target.value})} className="h-9 text-sm" />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs">{lang === 'th' ? 'อาหารที่ไม่ชอบ' : 'Disliked Foods'}</Label>
                  <Input value={formData.dislikes_food} onChange={e => setFormData({...formData, dislikes_food: e.target.value})} className="h-9 text-sm" />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs">{lang === 'th' ? 'แนวเพลง/เพลงที่ไม่ชอบ' : 'Disliked Music Genres'}</Label>
                  <Input value={formData.dislikes_music} onChange={e => setFormData({...formData, dislikes_music: e.target.value})} className="h-9 text-sm" />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs">{lang === 'th' ? 'กิจกรรมที่ไม่ชอบ' : 'Disliked Activities'}</Label>
                  <Input value={formData.dislikes_activities} onChange={e => setFormData({...formData, dislikes_activities: e.target.value})} className="h-9 text-sm" />
               </div>
               <p className="text-[10px] text-muted-foreground pt-2 text-center">
                 {lang === 'th' ? 'สามารถข้ามไปก่อนและกลับมาแก้ไขได้ที่หน้าตั้งค่า (Settings)' : 'You can skip and edit this later in the Settings page.'}
               </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="w-full max-w-sm space-y-4 pb-4 shrink-0">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-primary' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        <Button onClick={handleNext} disabled={saving} className="w-full h-12 rounded-2xl text-base font-semibold">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (current === slides.length - 1 ? (lang === 'th' ? 'บันทึกและเริ่มต้นใช้งาน' : 'Save & Get Started') : t('next'))}
        </Button>

        {current < slides.length - 1 ? (
          <button onClick={onComplete} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors p-2">
            {t('skip')}
          </button>
        ) : (
          <button onClick={onComplete} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors p-2">
            {lang === 'th' ? 'ข้ามไปก่อน (Skip)' : 'Skip for now'}
          </button>
        )}
      </div>
    </div>
  );
}