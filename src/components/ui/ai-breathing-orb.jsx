import React from 'react';
import { motion } from 'framer-motion';

export default function AIBreathingOrb({ message = 'AI กำลังประมวลผลคำแนะนำ...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4 text-center">
      {/* Visual Breathing Orb Container */}
      <div className="relative flex items-center justify-center w-36 h-36">
        {/* Outer Radiant Aura */}
        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.35, 0.7, 0.35],
          }}
          transition={{
            duration: 3.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/40 via-amber-400/30 to-accent/40 blur-2xl pointer-events-none"
        />

        {/* Middle Pulse Ring */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 7.2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-3 rounded-full border border-primary/30 dark:border-primary/40 border-dashed"
        />

        {/* Central Luminous Core */}
        <motion.div
          animate={{
            scale: [0.94, 1.08, 0.94],
          }}
          transition={{
            duration: 3.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-primary via-orange-400 to-accent shadow-lg shadow-primary/30 flex items-center justify-center text-2xl select-none"
        >
          <span className="animate-pulse">✨</span>
        </motion.div>
      </div>

      {/* Gentle Breathing & Status Prompt */}
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-foreground tracking-tight">
          {message}
        </p>
        <p className="text-xs text-muted-foreground animate-pulse">
          หายใจเข้าช้าๆ... ผ่อนคลายกล้ามเนื้อ
        </p>
      </div>
    </div>
  );
}
