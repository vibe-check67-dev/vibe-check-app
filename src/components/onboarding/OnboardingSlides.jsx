import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Zap, Flame, Heart, Music, Coffee, Compass, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLang } from '@/context/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ui/theme-toggle';
import AuroraBackground from '@/components/ui/aurora-background';
import MindParticles from '@/components/ui/mind-particles';
import ShimmerButton from '@/components/ui/shimmer-button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const slides = [
  { id: 'welcome', titleKey: 'onboard1Title', descKey: 'onboard1Desc' },
  { id: 'ai-tips', titleKey: 'onboard2Title', descKey: 'onboard2Desc' },
  { id: 'trends', titleKey: 'onboard3Title', descKey: 'onboard3Desc' },
  { id: 'profile', titleKey: 'onboardProfileTitle', descKey: 'onboardProfileDesc', isProfile: true },
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
    dislikes_activities: '',
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
          console.error('Error saving onboarding profile:', e);
        }
      }
      onComplete();
    }
  };

  const handleSkip = async () => {
    // If user filled some profile info on the last step before skipping, save it
    if (slides[current].isProfile && user && Object.values(formData).some((v) => v)) {
      try {
        await supabase.from('profiles').update(formData).eq('id', user.id);
        await refreshProfile();
      } catch (e) {
        console.error('Error saving profile on skip:', e);
      }
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto relative selection:bg-primary/20">
      {/* Cinematic Ambient Atmosphere: Aurora Glow + Particles */}
      <AuroraBackground opacity="opacity-45 dark:opacity-65" />
      <MindParticles quantity={35} />

      {/* Top Bar: Brand Logo & Toggles */}
      <div className="w-full max-w-lg flex items-center justify-between z-10 shrink-0 pt-2 pb-1">
        <div className="flex items-center gap-2">
          <img
            src="/icon-192.png"
            alt="Vibe Check Logo"
            className="w-7 h-7 rounded-xl object-cover shadow-xs"
          />
          <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
            Vibe Check
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>

      {/* Slide Content with AnimatePresence */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md z-10 py-6 my-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* SLIDE 0: Welcome & Core Philosophy */}
            {current === 0 && (
              <div className="space-y-6 w-full">
                {/* Floating Brand Glow Squircle */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative inline-flex items-center justify-center p-1.5 rounded-3xl bg-gradient-to-tr from-primary via-amber-400 to-teal-400 shadow-xl shadow-primary/25 mx-auto"
                >
                  <img
                    src="/icon-192.png"
                    alt="Vibe Check"
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {t('onboard1Title')}
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {t('onboard1Desc')}
                  </p>
                </div>

                {/* 3 Feature Highlights Pill Cards */}
                <div className="grid grid-cols-1 gap-2.5 text-left pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/85 dark:bg-card/70 border border-border/70 backdrop-blur-md shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {lang === 'th' ? 'เช็คอินด่วน 60 วินาที' : '60-Second Fast Check-in'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {lang === 'th' ? 'บันทึก 4 มิติอารมณ์ รวดเร็ว และเป็นส่วนตัว' : 'Track 4 mood dimensions quickly & privately'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/85 dark:bg-card/70 border border-border/70 backdrop-blur-md shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {lang === 'th' ? 'คำแนะนำ AI เฉพาะคุณ' : 'Personalized AI Insights'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {lang === 'th' ? 'เพลง อาหาร และกิจกรรมที่ตรงกับความรู้สึก' : 'Tailored music, food, and wellness recommendations'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/85 dark:bg-card/70 border border-border/70 backdrop-blur-md shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {lang === 'th' ? 'สร้างไฟความต่อเนื่อง (Streak)' : 'Build Wellness Streak'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {lang === 'th' ? 'ติดตามพัฒนาการและสะสมไฟอย่างสม่ำเสมอ' : 'Keep your daily check-in fire burning strong'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 1: AI Wellness Recommendations */}
            {current === 1 && (
              <div className="space-y-6 w-full">
                {/* AI Mockup Card */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="p-4 rounded-3xl bg-card/90 dark:bg-card/75 border border-border/80 backdrop-blur-xl shadow-lg shadow-black/5 text-left space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {lang === 'th' ? 'คำแนะนำสำหรับคุณ (AI Wellness)' : 'Your AI Recommendations'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {lang === 'th' ? 'เฉพาะคุณ' : 'Personalized'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-secondary/50 dark:bg-secondary/30">
                      <Music className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-foreground block">Playlist</span>
                        <span className="text-muted-foreground text-[11px]">
                          Lofi Beats & Gentle Piano เพื่อความผ่อนคลาย
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-secondary/50 dark:bg-secondary/30">
                      <Coffee className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-foreground block">Food & Drink</span>
                        <span className="text-muted-foreground text-[11px]">
                          ชาคาโมมายล์อุ่นๆ หรือน้ำเปล่าผสมเลมอน
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-secondary/50 dark:bg-secondary/30">
                      <Compass className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-foreground block">Activity</span>
                        <span className="text-muted-foreground text-[11px]">
                          ฝึกหายใจ 4-7-8 หรือยืดกล้ามเนื้อเบาๆ 5 นาที
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                    {t('onboard2Title')}
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {t('onboard2Desc')}
                  </p>
                </div>
              </div>
            )}

            {/* SLIDE 2: Tracking Trends & Streak */}
            {current === 2 && (
              <div className="space-y-6 w-full">
                {/* Streak & Trend Preview Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-5 rounded-3xl bg-card/90 dark:bg-card/75 border border-border/80 backdrop-blur-xl shadow-lg shadow-black/5 text-center space-y-4"
                >
                  {/* Glowing Flame */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30">
                    <Flame className="w-9 h-9 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-foreground">
                      {lang === 'th' ? 'สะสมไฟความต่อเนื่อง 🔥' : 'Fuel Your Streak Daily 🔥'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'th'
                        ? 'เช็คอินติดต่อกันทุกวันเพื่อไม่ให้ไฟของคุณดับ'
                        : 'Check in every day to keep your wellness flame alive.'}
                    </p>
                  </div>

                  {/* Micro Streak Mockup Pill */}
                  <div className="p-3 rounded-2xl bg-secondary/60 dark:bg-secondary/40 border border-border/50 flex items-center justify-between text-xs font-semibold px-4">
                    <span className="text-muted-foreground">
                      {lang === 'th' ? 'สถิติต่อเนื่อง' : 'Current Streak'}
                    </span>
                    <span className="text-primary font-bold flex items-center gap-1">
                      <span>7</span>
                      <span>{lang === 'th' ? 'วันติดต่อกัน' : 'Days Streak'}</span>
                    </span>
                  </div>
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                    {t('onboard3Title')}
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {t('onboard3Desc')}
                  </p>
                </div>
              </div>
            )}

            {/* SLIDE 3: Personal Health Profile (Optional Setup) */}
            {current === 3 && (
              <div className="space-y-4 w-full">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                    {lang === 'th' ? 'ตั้งค่าโปรไฟล์สุขภาพ (ไม่บังคับ)' : 'Personal Health Profile (Optional)'}
                  </h1>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === 'th'
                      ? 'ข้อมูลเหล่านี้จะช่วยให้ AI สร้างคำแนะนำอาหารและเพลงที่เหมาะสมกับคุณ'
                      : 'Helps AI suggest tailored food, music, and activities.'}
                  </p>
                </div>

                {/* Form Inputs Container */}
                <div className="w-full space-y-3 text-left bg-card/90 dark:bg-card/75 p-4 rounded-3xl border border-border/80 backdrop-blur-xl shadow-lg shadow-black/5 max-h-[38vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        {lang === 'th' ? 'น้ำหนัก (กก.)' : 'Weight (kg)'}
                      </Label>
                      <Input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="h-9 text-xs rounded-xl"
                        placeholder="65"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        {lang === 'th' ? 'ส่วนสูง (ซม.)' : 'Height (cm)'}
                      </Label>
                      <Input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="h-9 text-xs rounded-xl"
                        placeholder="170"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {lang === 'th' ? 'เพศโดยกำเนิด' : 'Biological Sex'}
                    </Label>
                    <Input
                      value={formData.biological_sex}
                      onChange={(e) => setFormData({ ...formData, biological_sex: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                      placeholder={lang === 'th' ? 'เช่น ชาย, หญิง' : 'e.g. Male, Female'}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {lang === 'th' ? 'โรคประจำตัว (ถ้ามี)' : 'Underlying Conditions'}
                    </Label>
                    <Input
                      value={formData.diseases}
                      onChange={(e) => setFormData({ ...formData, diseases: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                      placeholder={lang === 'th' ? 'เช่น ภูมิแพ้, กรดไหลย้อน' : 'e.g. None, Allergy'}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {lang === 'th' ? 'อาหารที่แพ้ หรือ ไม่ชอบ' : 'Food Allergies or Dislikes'}
                    </Label>
                    <Input
                      value={formData.food_allergies}
                      onChange={(e) => setFormData({ ...formData, food_allergies: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                      placeholder={lang === 'th' ? 'เช่น อาหารทะเล, ถั่ว' : 'e.g. Peanuts, Seafood'}
                    />
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center pt-1">
                    {lang === 'th'
                      ? '💡 สามารถข้ามไปก่อนและกลับมาแก้ไขได้ตลอดเวลาในหน้า "การตั้งค่า"'
                      : '💡 You can skip now and update anytime in Settings.'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls: Dots Indicator, Next Button, and Skip Button UNDERNEATH */}
      <div className="w-full max-w-md space-y-3 z-10 shrink-0 pb-2">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-gradient-to-r from-primary to-amber-500' : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Primary Action Button (Next / Save & Get Started) */}
        <ShimmerButton
          onClick={handleNext}
          disabled={saving}
          className="w-full h-12 text-sm sm:text-base font-bold shadow-md"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : current === slides.length - 1 ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{lang === 'th' ? 'บันทึกและเริ่มต้นใช้งาน' : 'Save & Get Started'}</span>
            </span>
          ) : (
            <span>{t('next')} →</span>
          )}
        </ShimmerButton>

        {/* Skip Button - positioned directly UNDERNEATH the Next button per user's decision */}
        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-center py-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-xl transition-colors cursor-pointer"
        >
          {current === slides.length - 1
            ? (lang === 'th' ? 'ข้ามไปก่อน (Skip for now)' : 'Skip for now')
            : (lang === 'th' ? 'ข้าม (Skip)' : 'Skip')}
        </button>
      </div>
    </div>
  );
}