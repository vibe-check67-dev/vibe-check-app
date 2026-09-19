import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function MindParticles({
  className = '',
  quantity,
  staticity = 40,
  ease = 45,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contextRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationFrameRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    contextRef.current = ctx;

    let width = container.offsetWidth;
    let height = container.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Responsive particle count: 30 on mobile, 55 on desktop
    const count = quantity || (width < 640 ? 30 : 55);

    // Palette: Orange, Amber, Teal, Twilight
    const colors = isDark
      ? [
          { r: 249, g: 115, b: 22 },  // Warm Orange
          { r: 251, g: 191, b: 36 },  // Amber Glow
          { r: 20,  g: 184, b: 166 }, // Calming Teal
          { r: 56,  g: 189, b: 248 }, // Soft Sky
          { r: 240, g: 240, b: 255 }, // Star White
        ]
      : [
          { r: 234, g: 88,  b: 12 },  // Deep Orange
          { r: 245, g: 158, b: 11 },  // Gold
          { r: 13,  g: 148, b: 136 }, // Deep Teal
          { r: 14,  g: 165, b: 233 }, // Sky
        ];

    const initCanvas = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      particlesRef.current = [];
      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 2 + 1; // 1px to 3px
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          originX: Math.random() * width,
          originY: Math.random() * height,
          translateX: 0,
          translateY: 0,
          size,
          color,
          alpha: 0,
          targetAlpha: isDark
            ? Math.random() * 0.5 + 0.25
            : Math.random() * 0.35 + 0.15,
          dx: (Math.random() - 0.5) * 0.25,
          dy: -Math.random() * 0.35 - 0.05, // gentle upward drift like stardust/embers
          pulseSpeed: Math.random() * 0.02 + 0.008,
          pulseAngle: Math.random() * Math.PI * 2,
          magnetism: 0.1 + Math.random() * 3,
        });
      }
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particlesRef.current.forEach((p) => {
        // Natural upward & sway drift
        p.pulseAngle += p.pulseSpeed;
        p.x += p.dx + Math.sin(p.pulseAngle) * 0.15;
        p.y += p.dy;

        // Wrap around boundaries smoothly
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Soft cursor interaction (gentle attraction / repulsion)
        const dx = mouseRef.current.x - (p.x + p.translateX);
        const dy = mouseRef.current.y - (p.y + p.translateY);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 140) {
          const force = (1 - dist / 140) * p.magnetism;
          p.translateX -= (dx / dist) * force * 1.5;
          p.translateY -= (dy / dist) * force * 1.5;
        } else {
          p.translateX += (0 - p.translateX) / staticity;
          p.translateY += (0 - p.translateY) / staticity;
        }

        // Breathing alpha oscillation
        const currentAlpha = Math.max(
          0.05,
          p.targetAlpha * (0.65 + 0.35 * Math.sin(p.pulseAngle))
        );

        const drawX = p.x + p.translateX;
        const drawY = p.y + p.translateY;

        // Draw particle with soft halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`;
        ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.6)`;
        ctx.shadowBlur = p.size * 3;
        ctx.fill();
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    initCanvas();
    render();

    window.addEventListener('resize', initCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Pause on tab visibility change to preserve battery
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      } else {
        render();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', initCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDark, quantity, staticity, ease]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
