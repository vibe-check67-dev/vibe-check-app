import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function RecommendationCard({ icon, title, content, color, delay = 0 }) {
  const cardRef = useRef(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0, opacity: 0 });

  const colorMap = {
    coral: {
      bg: 'bg-primary/8 dark:bg-primary/12 border-primary/20 hover:border-primary/40',
      glow: 'rgba(249, 115, 22, 0.18)',
    },
    teal: {
      bg: 'bg-accent/8 dark:bg-accent/12 border-accent/20 hover:border-accent/40',
      glow: 'rgba(20, 184, 166, 0.18)',
    },
    purple: {
      bg: 'bg-chart-3/8 dark:bg-chart-3/12 border-chart-3/20 hover:border-chart-3/40',
      glow: 'rgba(168, 85, 247, 0.18)',
    },
    gold: {
      bg: 'bg-chart-4/8 dark:bg-chart-4/12 border-chart-4/20 hover:border-chart-4/40',
      glow: 'rgba(245, 158, 11, 0.18)',
    },
  };

  const scheme = colorMap[color] || colorMap.coral;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlightPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setSpotlightPos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.35, delay }}
      className={`relative overflow-hidden rounded-2xl border p-4 space-y-2 backdrop-blur-xs transition-all duration-300 shadow-2xs hover:shadow-md ${scheme.bg}`}
    >
      {/* Dynamic Cursor Spotlight Layer (Desktop hover) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 -z-0"
        style={{
          opacity: spotlightPos.opacity,
          background: `radial-gradient(280px circle at ${spotlightPos.x}px ${spotlightPos.y}px, ${scheme.glow}, transparent 70%)`,
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="text-xl filter drop-shadow-2xs">{icon}</span>
        <h4 className="text-sm font-bold text-foreground tracking-tight">{title}</h4>
      </div>
      <p className="relative z-10 text-xs sm:text-sm text-muted-foreground leading-relaxed">{content}</p>
    </motion.div>
  );
}