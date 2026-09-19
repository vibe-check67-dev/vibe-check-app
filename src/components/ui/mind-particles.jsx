import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function MindParticles({
  className = '',
  quantity,
  staticity = 35,
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
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    contextRef.current = ctx;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Responsive particle count: ~35 on mobile, ~65 on desktop
    const count = quantity || (width < 640 ? 35 : 65);

    // Cinematic Palette: Warm Brand Orange, Amber Gold, Calming Teal, Cyan, Star White
    const colors = isDark
      ? [
          { r: 249, g: 115, b: 22 },  // Warm Orange
          { r: 251, g: 191, b: 36 },  // Amber Gold
          { r: 20,  g: 184, b: 166 }, // Calming Teal
          { r: 45,  g: 212, b: 191 }, // Glowing Mint
          { r: 56,  g: 189, b: 248 }, // Electric Sky
          { r: 255, g: 255, b: 255 }, // Crisp Starlight
        ]
      : [
          { r: 234, g: 88,  b: 12 },  // Deep Orange
          { r: 245, g: 158, b: 11 },  // Warm Gold
          { r: 13,  g: 148, b: 136 }, // Deep Teal
          { r: 14,  g: 165, b: 233 }, // Soft Sky
        ];

    const initCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      particlesRef.current = [];
      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        // Visible particles (2.2px to 5px) with starlight presence
        const size = Math.random() * 2.8 + 2.2;
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          translateX: 0,
          translateY: 0,
          size,
          color,
          alpha: 0,
          targetAlpha: isDark
            ? Math.random() * 0.4 + 0.45 // 0.45 - 0.85 in dark mode for clear visibility
            : Math.random() * 0.3 + 0.25,
          dx: (Math.random() - 0.5) * 0.35,
          dy: -Math.random() * 0.45 - 0.1, // gentle upward drift like glowing embers / thoughts
          pulseSpeed: Math.random() * 0.025 + 0.012,
          pulseAngle: Math.random() * Math.PI * 2,
          magnetism: 0.8 + Math.random() * 2.2,
        });
      }
    };

    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const pLen = particles.length;

      // 1. Draw subtle neural constellation links between nearby thoughts/particles
      const maxConnectDist = width < 640 ? 80 : 100;
      for (let i = 0; i < pLen; i++) {
        const p1 = particles[i];
        const p1X = p1.x + p1.translateX;
        const p1Y = p1.y + p1.translateY;

        for (let j = i + 1; j < pLen; j++) {
          const p2 = particles[j];
          const p2X = p2.x + p2.translateX;
          const p2Y = p2.y + p2.translateY;

          const dx = p1X - p2X;
          const dy = p1Y - p2Y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const connectAlpha = (1 - dist / maxConnectDist) * (isDark ? 0.22 : 0.12);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1X, p1Y);
            ctx.lineTo(p2X, p2Y);
            ctx.strokeStyle = `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${connectAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 2. Draw each particle with luminous glow
      particles.forEach((p) => {
        // Natural upward & sway drift
        p.pulseAngle += p.pulseSpeed;
        p.x += p.dx + Math.sin(p.pulseAngle) * 0.22;
        p.y += p.dy;

        // Wrap around boundaries smoothly
        if (p.y < -15) {
          p.y = height + 15;
          p.x = Math.random() * width;
        }
        if (p.x < -15) p.x = width + 15;
        if (p.x > width + 15) p.x = -15;

        // Interactive cursor repulsion / attraction
        const dx = mouseRef.current.x - (p.x + p.translateX);
        const dy = mouseRef.current.y - (p.y + p.translateY);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const force = (1 - dist / 150) * p.magnetism;
          p.translateX -= (dx / dist) * force * 2.2;
          p.translateY -= (dy / dist) * force * 2.2;
        } else {
          p.translateX += (0 - p.translateX) / staticity;
          p.translateY += (0 - p.translateY) / staticity;
        }

        // Breathing alpha oscillation
        const currentAlpha = Math.max(
          0.15,
          p.targetAlpha * (0.75 + 0.25 * Math.sin(p.pulseAngle))
        );

        const drawX = p.x + p.translateX;
        const drawY = p.y + p.translateY;

        // Draw particle with luminous halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`;
        ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.85)`;
        ctx.shadowBlur = p.size * 4;
        ctx.fill();

        // Extra white core for star effect
        if (isDark && p.size > 3.2) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.size * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.9})`;
          ctx.fill();
        }

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
  }, [isDark, quantity, staticity]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
