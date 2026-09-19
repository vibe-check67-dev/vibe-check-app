import React from 'react';
import { motion } from 'framer-motion';

export default function EmojiSelector({ emojis, labels, value, onChange, title }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-foreground text-center tracking-tight">{title}</h3>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {emojis.map((emoji, index) => {
          const isSelected = value === index + 1;
          return (
            <motion.button
              key={index}
              type="button"
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.08 }}
              animate={isSelected ? { scale: 1.12, y: -4 } : { scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              onClick={() => onChange(index + 1)}
              aria-pressed={isSelected}
              aria-label={labels[index]}
              className={`relative flex flex-col items-center gap-1.5 p-3 sm:p-3.5 rounded-2xl transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'bg-primary/15 dark:bg-primary/25 ring-2 ring-primary shadow-sm shadow-primary/20'
                  : 'bg-secondary/60 hover:bg-secondary/90 border border-transparent hover:border-border/60'
              }`}
            >
              {/* Soft Active Glow Halo */}
              {isSelected && (
                <motion.div
                  layoutId="emoji-glow"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/30 to-amber-400/20 blur-sm pointer-events-none -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}

              <span className="text-3xl sm:text-4xl select-none filter drop-shadow-xs">{emoji}</span>
              <span className={`text-[11px] font-semibold leading-tight tracking-tight ${
                isSelected ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {labels[index]}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}