import React from 'react';
import { motion } from 'framer-motion';

export default function ShimmerButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.28)',
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`relative overflow-hidden inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-primary via-orange-500 to-amber-500 text-primary-foreground shadow-sm hover:shadow-md hover:shadow-orange-500/25 active:shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {/* Moving Shimmer Sheen */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full animate-shimmer pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
        }}
      />

      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
