import React from 'react';

export default function AuroraBackground({
  className = '',
  opacity = 'opacity-35 dark:opacity-50',
  blur = 'blur-[90px]',
  children,
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      <div className={`relative w-full h-full ${opacity} transition-opacity duration-700`}>
        {/* Warm Orange Ambient Aura (Top Left) */}
        <div
          className={`absolute -top-[15%] -left-[10%] w-[75vw] max-w-[680px] h-[65vh] max-h-[620px] rounded-full bg-gradient-to-tr from-orange-500/35 via-amber-500/25 to-rose-500/15 ${blur} animate-aurora`}
        />

        {/* Calming Teal Ambient Aura (Bottom Right) */}
        <div
          className={`absolute top-[35%] -right-[15%] w-[75vw] max-w-[650px] h-[65vh] max-h-[580px] rounded-full bg-gradient-to-bl from-teal-500/35 via-emerald-500/25 to-cyan-500/20 ${blur} animate-aurora [animation-delay:6s]`}
        />

        {/* Soft Twilight Accent Aura (Bottom Center) */}
        <div
          className={`absolute -bottom-[15%] left-[20%] w-[65vw] max-w-[550px] h-[50vh] max-h-[480px] rounded-full bg-gradient-to-t from-orange-500/20 via-teal-500/20 to-transparent ${blur} animate-aurora [animation-delay:12s]`}
        />
      </div>
      {children}
    </div>
  );
}
