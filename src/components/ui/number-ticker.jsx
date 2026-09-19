import React, { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

export default function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className = '',
  decimalPlaces = 0,
}) {
  const ref = useRef(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 25,
    stiffness: 140,
  });

  const display = useTransform(springValue, (current) =>
    Number(current).toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      motionValue.set(direction === 'down' ? 0 : value);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [motionValue, value, direction, delay]);

  return (
    <motion.span ref={ref} className={`inline-block tabular-nums ${className}`}>
      {display}
    </motion.span>
  );
}
