import React from 'react';

export default function AuroraBackground({
  className = '',
  opacity = 'opacity-25 dark:opacity-35',
  blur = 'blur-3xl',
  children,
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      <div className={`relative w-full h-full ${opacity} transition-opacity duration-700`}>
        {/* Warm Orange Ambient Blob */}
        <div
          className={`absolute -top-1/4 -left-1/4 w-[85vw] max-w-[650px] h-[75vh] max-h-[600px] rounded-full bg-gradient-to-tr from-orange-500/40 via-amber-500/30 to-rose-400/20 ${blur} animate-aurora`}
        />

        {/* Calming Teal Ambient Blob */}
        <div
          className={`absolute top-1/3 -right-1/4 w-[80vw] max-w-[600px] h-[70vh] max-h-[550px] rounded-full bg-gradient-to-bl from-teal-400/35 via-emerald-400/25 to-sky-400/20 ${blur} animate-aurora [animation-delay:6s]`}
        />

        {/* Soft Indigo / Twilight Mood Accent for Dark Mode */}
        <div
          className={`absolute -bottom-1/4 left-1/4 w-[70vw] max-w-[500px] h-[60vh] max-h-[480px] rounded-full bg-gradient-to-t from-orange-400/20 via-teal-500/15 to-transparent ${blur} animate-aurora [animation-delay:12s]`}
        />
      </div>
      {children}
    </div>
  );
}
