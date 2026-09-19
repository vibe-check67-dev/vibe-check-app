import React from 'react';

export default function AnimatedGradientText({
  children,
  className = '',
  colors = 'from-orange-500 via-amber-400 to-teal-400',
}) {
  return (
    <span
      className={`inline-block bg-gradient-to-r ${colors} bg-[length:200%_auto] animate-gradient-flow bg-clip-text text-transparent font-bold tracking-tight ${className}`}
    >
      {children}
    </span>
  );
}
