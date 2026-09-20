import React from 'react';
import { motion } from 'framer-motion';

export default function EmojiSelector({ emojis, labels, value, onChange, title }) {
  return (
    <div className="space-y-6 w-full">
      <h3 className="text-xl sm:text-2xl font-extrabold text-foreground text-center tracking-tight">
        {title}
      </h3>
      {/* 5-Column Grid: Stays perfectly on 1 horizontal row on all screen sizes */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3 w-full max-w-sm sm:max-w-md mx-auto">
        {emojis.map((emoji, index) => {
          const isSelected = value === index + 1;
          return (
            <motion.button
              key={index}
              type="button"
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              animate={isSelected ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              onClick={() => onChange(index + 1)}
              aria-pressed={isSelected}
              aria-label={labels[index]}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-1 sm:p-3.5 rounded-2xl transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'bg-primary/15 dark:bg-primary/25 ring-2 ring-primary shadow-md shadow-primary/25'
                  : 'bg-secondary/60 hover:bg-secondary/90 border border-border/40 hover:border-border/80'
              }`}
            >
              {/* Soft Active Glow Halo */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/30 to-amber-400/20 blur-sm pointer-events-none -z-10"
                />
              )}

              <span className="text-2xl sm:text-3xl select-none filter drop-shadow-xs leading-none">
                {emoji}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold leading-tight tracking-tight text-center truncate w-full block ${
                  isSelected ? 'text-primary font-bold' : 'text-muted-foreground'
                }`}
              >
                {labels[index]}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}