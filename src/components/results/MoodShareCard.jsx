import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/context/LanguageContext';

const moodEmoji = (score) => {
  if (score <= 1) return '😔';
  if (score <= 2) return '😐';
  if (score <= 3) return '🙂';
  if (score <= 4) return '😄';
  return '🤩';
};

const moodLabel = (score, lang) => {
  const labels = {
    en: ['', 'Low', 'Okay', 'Good', 'Great', 'Amazing'],
    th: ['', 'แย่', 'พอใช้', 'ดี', 'ดีมาก', 'ยอดเยี่ยม'],
  };
  return labels[lang]?.[score] || '';
};

export default function MoodShareCard({ checkin, onClose }) {
  const { t, lang } = useLang();
  const [downloading, setDownloading] = useState(false);

  // Generate crisp canvas image natively (0 dependencies, perfect Thai font rendering)
  const generateCardBlob = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const width = 600;
      const height = 750;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Draw rounded rectangle with gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#FF7043');
      gradient.addColorStop(1, '#26C6DA');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 48);
      ctx.fill();

      // 2. Inner subtle glow/border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 3. Emoji
      ctx.font = '96px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(moodEmoji(checkin.overall_mood), width / 2, 160);

      // 4. Date
      ctx.font = '500 24px Prompt, Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(checkin.checkin_date || '', width / 2, 260);

      // 5. Mood Title
      ctx.font = 'bold 52px Prompt, Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(moodLabel(checkin.overall_mood, lang), width / 2, 330);

      // 6. Score
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(`${checkin.overall_mood}/5`, width / 2, 380);

      // 7. Message
      if (checkin.ai_message) {
        ctx.font = 'italic 22px Prompt, Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        const msg = `"${checkin.ai_message.slice(0, 70)}${checkin.ai_message.length > 70 ? '…' : ''}"`;
        ctx.fillText(msg, width / 2, 470);
      }

      // 8. Brand Footer
      ctx.font = 'bold 18px Prompt, Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.letterSpacing = '4px';
      ctx.fillText('VIBE CHECK', width / 2, 660);

      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateCardBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `vibecheck-${checkin.checkin_date}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download card error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setDownloading(true);
    try {
      const blob = await generateCardBlob();
      const file = new File([blob], `vibecheck-${checkin.checkin_date}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Vibe Check',
          text: `My mood today: ${moodLabel(checkin.overall_mood, lang)} (${checkin.overall_mood}/5)`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `vibecheck-${checkin.checkin_date}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Share card error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-4"
      >
        {/* Card preview */}
        <div
          className="rounded-3xl p-8 flex flex-col items-center gap-4 text-center shadow-xl border border-white/20"
          style={{ background: 'linear-gradient(135deg, #FF7043 0%, #26C6DA 100%)' }}
        >
          <span className="text-6xl">{moodEmoji(checkin.overall_mood)}</span>
          <div>
            <p className="text-white/80 text-sm font-medium">{checkin.checkin_date}</p>
            <p className="text-white text-3xl font-bold mt-1">{moodLabel(checkin.overall_mood, lang)}</p>
            <p className="text-white/90 text-base font-mono mt-1">{checkin.overall_mood}/5</p>
          </div>
          {checkin.ai_message && (
            <p className="text-white/90 text-sm italic leading-relaxed max-w-xs">
              "{checkin.ai_message.slice(0, 80)}{checkin.ai_message.length > 80 ? '…' : ''}"
            </p>
          )}
          <p className="text-white/60 text-xs font-bold tracking-widest mt-2">VIBE CHECK</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl bg-background cursor-pointer"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {t('download')}
          </Button>
          <Button
            className="flex-1 rounded-2xl cursor-pointer shadow-xs"
            onClick={handleShare}
            disabled={downloading}
          >
            {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
            {t('share')}
          </Button>
        </div>

        <button
          onClick={onClose}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {t('close')}
        </button>
      </motion.div>
    </div>
  );
}