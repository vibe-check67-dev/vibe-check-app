import React from 'react';
import { motion } from 'framer-motion';

export default function RecommendationCard({ icon, title, content, color, delay = 0 }) {
  const colorMap = {
    coral: 'bg-primary/8 border-primary/20',
    teal: 'bg-accent/8 border-accent/20',
    purple: 'bg-chart-3/8 border-chart-3/20',
    gold: 'bg-chart-4/8 border-chart-4/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-2xl border p-4 space-y-2 ${colorMap[color] || colorMap.coral}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </motion.div>
  );
}