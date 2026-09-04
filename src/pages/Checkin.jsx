import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLang } from '@/context/LanguageContext';
import { getTimeOfDay } from '@/utils/timeOfDay';
import EmojiSelector from '@/components/checkin/EmojiSelector';
import { createCheckin } from '@/lib/database';

const energyEmojis = ['🪫', '💤', '😐', '⚡', '🔥'];
const stressEmojis = ['😌', '🙂', '😐', '😰', '🤯'];
const socialEmojis = ['🧘', '🤫', '😐', '😄', '🦋'];
const sleepEmojis = ['😵', '😫', '🥱', '😊', '🌟'];
const focusEmojis = ['🌫️', '😵💫', '😐', '🎯', '🔥'];
const outlookEmojis = ['☁️', '😐', '🙂', '✨', '🌟'];

export default function Checkin() {
  const { t, tArr } = useLang();
  const navigate = useNavigate();
  const timeOfDay = getTimeOfDay();

  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [stress, setStress] = useState(0);
  const [social, setSocial] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [focus, setFocus] = useState(0);
  const [outlook, setOutlook] = useState(0);
  const [freeText, setFreeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [isTransitioning, setIsTransitioning] = useState(false);

  const steps = [
    {
      key: 'energy',
      emojis: energyEmojis,
      labels: tArr('energyLabels'),
      title: t('energy'),
      value: energy,
      onChange: setEnergy,
    },
    {
      key: 'stress',
      emojis: stressEmojis,
      labels: tArr('stressLabels'),
      title: t('stress'),
      value: stress,
      onChange: setStress,
    },
    {
      key: 'social',
      emojis: socialEmojis,
      labels: tArr('socialLabels'),
      title: t('social'),
      value: social,
      onChange: setSocial,
    },
    {
      key: 'sleep',
      emojis: sleepEmojis,
      labels: tArr('sleepLabels'),
      title: t('sleep'),
      value: sleep,
      onChange: setSleep,
    },
    {
      key: 'focus',
      emojis: focusEmojis,
      labels: tArr('focusLabels'),
      title: t('focus'),
      value: focus,
      onChange: setFocus,
    },
    {
      key: 'outlook',
      emojis: outlookEmojis,
      labels: tArr('outlookLabels'),
      title: t('outlook'),
      value: outlook,
      onChange: setOutlook,
    },
  ];

  const currentStep = steps[step];
  const isLastEmojiStep = step === steps.length - 1;
  const isTextStep = step >= steps.length; // use >= to be safe

  const handleSubmit = async () => {
    // Check if any required field is missing before submitting
    if (!energy || !stress || !social || !sleep) {
      setError(t('pleaseAnswerAll') || 'Please answer all required questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const overallMood = Math.round((energy + (6 - stress) + social + sleep) / 4);
      const checkinData = {
        energy,
        stress,
        social,
        sleep,
        focus: focus || null,
        outlook: outlook || null,
        overall_mood: Math.max(1, Math.min(5, overallMood)),
        free_text: freeText || '',
        time_of_day: timeOfDay,
        checkin_date: format(new Date(), 'yyyy-MM-dd'),
      };

      const created = await createCheckin(checkinData);
      navigate(`/results/${created.id}`);
    } catch (err) {
      console.error('Checkin submission error:', err);
      if (err.message?.includes('violates check constraint')) {
        setError(t('pleaseAnswerAll') || 'Please answer all required questions before submitting.');
      } else {
        setError(err.message || 'Failed to save check-in');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[60vh] justify-center">
      {/* Progress bar */}
      <div className="w-full max-w-xs mb-8">
        <div className="flex items-center gap-1">
          {[...Array(steps.length + 1)].map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="w-full max-w-md mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center font-medium">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isTextStep && currentStep ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <EmojiSelector
              emojis={currentStep.emojis}
              labels={currentStep.labels}
              title={currentStep.title}
              value={currentStep.value}
              onChange={(val) => {
                if (isTransitioning) return;
                setIsTransitioning(true);
                currentStep.onChange(val);
                // Auto-advance after selection with a small delay
                setTimeout(() => {
                  setStep((s) => Math.min(s + 1, steps.length));
                  setIsTransitioning(false);
                }, 300);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-4"
          >
            <h3 className="text-lg font-semibold text-foreground text-center">
              {timeOfDay === 'evening' ? t('whatsOnMindEvening') : t('whatsOnMind')}
            </h3>
            <p className="text-center text-sm text-muted-foreground">({t('optional')})</p>
            <Textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value.slice(0, 100))}
              placeholder="..."
              className="resize-none h-24 rounded-2xl text-base"
              maxLength={100}
            />
            <p className="text-right text-xs text-muted-foreground">{freeText.length}/100</p>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl text-base font-semibold"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('submit')
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      {step > 0 && (
        <button
          disabled={isTransitioning}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
        >
          ← {t('back')}
        </button>
      )}
    </div>
  );
}