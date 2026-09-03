import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Check, Share2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '@/context/LanguageContext';
import RecommendationCard from '@/components/results/RecommendationCard';
import MoodShareCard from '@/components/results/MoodShareCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getCheckinById, updateCheckin, fetchAIRecommendations } from '@/lib/database';

export default function Results() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const [checkin, setCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [journal, setJournal] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [aiError, setAiError] = useState('');
  const prevLangRef = useRef(lang);

  const generateRecommendations = useCallback(async (item, targetLang) => {
    if (!item) return;
    setGenerating(true);
    setAiError('');

    try {
      const result = await fetchAIRecommendations(item, targetLang || lang);

      await updateCheckin(item.id, {
        ai_activity: result.activity,
        ai_playlist: result.playlist,
        ai_food: result.food,
        ai_message: result.message,
        ai_journal_prompt: result.journal_prompt,
      });

      const updated = {
        ...item,
        ai_activity: result.activity,
        ai_playlist: result.playlist,
        ai_food: result.food,
        ai_message: result.message,
        ai_journal_prompt: result.journal_prompt,
      };
      setCheckin(updated);
    } catch (err) {
      console.error('AI generation error:', err);
      const isOverloaded = err.message?.includes('503') || err.message?.includes('high demand') || err.message?.includes('429');
      const friendlyError = isOverloaded
        ? (lang === 'th' ? 'เซิร์ฟเวอร์ AI มีผู้ใช้งานหนาแน่นชั่วคราว ระบบจึงแสดงคำแนะนำเริ่มต้นสำหรับคุณ' : 'AI service is temporarily busy. Showing wellness recommendations.')
        : (lang === 'th' ? 'เกิดข้อผิดพลาดในการสร้างคำแนะนำ ระบบจึงแสดงคำแนะนำเริ่มต้นสำหรับคุณ' : 'Could not generate custom AI recommendations. Showing default wellness suggestions.');
      
      setAiError(friendlyError);

      // Give friendly fallback recommendations so user always gets actionable advice
      const fallbacks = {
        ai_activity: lang === 'th' ? 'พักสายตา 10 นาที — ผ่อนคลายสมองและสายตาจากการจ้องจอ' : 'Take a 10-minute walk — clear your mind and stretch',
        ai_playlist: lang === 'th' ? 'Lo-Fi Chill Beats — เสียงดนตรีช่วยสร้างสมาธิและความสงบ' : 'Acoustic Morning — gentle, uplifting acoustic guitar',
        ai_food: lang === 'th' ? '🍽️ ข้าวต้มอุ่นๆ — ย่อยง่าย สบายท้อง\n🥤 น้ำผลไม้สด — เติมความสดชื่นและวิตามิน' : '🍽️ Warm Soup — comforting, nourishing, and light\n🥤 Fresh Smoothie — natural energizing vitamin boost',
        ai_message: lang === 'th' ? 'ทุกความรู้สึกมีคุณค่า — ค่อยๆ ก้าวไปทีละก้าว ไม่ต้องรีบร้อน' : 'Take it one step at a time — you are doing wonderful',
        ai_journal_prompt: lang === 'th' ? 'สิ่งหนึ่งที่คุณรู้สึกขอบคุณหรือภูมิใจในวันนี้คืออะไร?' : 'What is one thing you feel grateful for today?',
      };

      setCheckin((prev) => ({
        ...prev,
        ...fallbacks,
      }));

      // Persist fallbacks to DB so they remain on reload
      try {
        await updateCheckin(item.id, fallbacks);
      } catch (saveErr) {
        console.warn('Could not save fallbacks to DB:', saveErr);
      }
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }, [lang]);

  const loadCheckin = useCallback(async () => {
    setLoading(true);
    try {
      const item = await getCheckinById(id);
      setCheckin(item);
      setJournal(item?.journal_response || '');

      if (!item?.ai_activity) {
        await generateRecommendations(item, lang);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load checkin:', err);
      setLoading(false);
    }
  }, [id, lang, generateRecommendations]);

  useEffect(() => {
    loadCheckin();
  }, [loadCheckin]);

  // Re-generate when language changes
  useEffect(() => {
    if (prevLangRef.current !== lang && checkin) {
      prevLangRef.current = lang;
      generateRecommendations(checkin, lang);
    } else {
      prevLangRef.current = lang;
    }
  }, [lang, checkin, generateRecommendations]);

  const saveJournal = async () => {
    if (!checkin) return;
    try {
      await updateCheckin(checkin.id, { journal_response: journal });
      setJournalSaved(true);
      setTimeout(() => setJournalSaved(false), 2000);
    } catch (err) {
      console.error('Error saving journal:', err);
    }
  };

  if (loading || generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          {generating && !loading ? t('regenerating') : t('loading')}
        </p>
      </div>
    );
  }

  if (!checkin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-muted-foreground">{t('noData') || 'Check-in not found'}</p>
        <Link to="/">
          <Button className="rounded-2xl">{t('home')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xl font-bold text-center"
      >
        {t('yourRecommendations')}
      </motion.h2>

      {aiError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{aiError} ({t('showingDefaultRecommendations') || 'Showing standard suggestions'})</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <RecommendationCard icon="🏃" title={t('activity')} content={checkin.ai_activity} color="coral" delay={0.1} />
        <RecommendationCard icon="🎵" title={t('playlist')} content={checkin.ai_playlist} color="teal" delay={0.2} />
        <RecommendationCard icon="🍽️" title={t('foodDrink')} content={checkin.ai_food} color="gold" delay={0.3} />
        <RecommendationCard icon="💌" title={t('message')} content={checkin.ai_message} color="purple" delay={0.4} />
      </div>

      {/* Journal prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-secondary/50 rounded-2xl p-5 space-y-3 border border-border/50"
      >
        <h3 className="font-semibold text-foreground">{t('journalPrompt')}</h3>
        <p className="text-sm text-muted-foreground italic">"{checkin.ai_journal_prompt}"</p>
        <Textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          className="resize-none h-20 rounded-xl bg-background"
          placeholder="..."
        />
        <Button
          onClick={saveJournal}
          variant={journalSaved ? 'outline' : 'default'}
          size="sm"
          className="rounded-xl"
        >
          {journalSaved ? <><Check className="w-4 h-4 mr-1" /> {t('saved')}</> : t('saveJournal')}
        </Button>
      </motion.div>

      {/* Share mood card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          variant="outline"
          onClick={() => setShowShareCard(true)}
          className="w-full rounded-2xl gap-2 shadow-xs"
        >
          <Share2 className="w-4 h-4" />
          {t('shareMoodCard')}
        </Button>
      </motion.div>

      <div className="text-center pt-2">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← {t('home')}
        </Link>
      </div>

      {showShareCard && (
        <MoodShareCard checkin={checkin} onClose={() => setShowShareCard(false)} />
      )}
    </div>
  );
}