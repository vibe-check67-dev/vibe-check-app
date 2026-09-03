import React from 'react';
import { motion } from 'framer-motion';

export default function EmojiSelector({ emojis, labels, value, onChange, title }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground text-center">{title}</h3>
      <div className="flex items-center justify-center gap-2">
        {emojis.map((emoji, index) => {
          const isSelected = value === index + 1;
          return (
            <motion.button
              key={index}
              type="button"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => onChange(index + 1)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? 'bg-primary/10 ring-2 ring-primary scale-110'
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              <span className="text-3xl">{emoji}</span>
              <span className={`text-[10px] font-medium leading-tight ${
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