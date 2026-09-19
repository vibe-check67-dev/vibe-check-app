import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart3, PlusCircle, Shield, Settings } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ui/theme-toggle';
import AnimatedGradientText from '@/components/ui/animated-gradient-text';
import MindParticles from '@/components/ui/mind-particles';

export default function AppLayout() {
  const { t, lang, toggleLang } = useLang();
  const { user, profile, isAdmin, logout } = useAuth();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');

  const navItems = [
    { path: '/', icon: Home, label: t('home') },
    { path: '/checkin', icon: PlusCircle, label: t('checkin') },
    { path: '/history', icon: BarChart3, label: t('history') },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: t('admin') }] : []),
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative">
      {/* Cinematic Mind Particles Ambient Background Field */}
      <MindParticles />

      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-2xs transition-colors duration-200">
        <div className={`${isAdminPage ? 'max-w-7xl' : 'max-w-2xl'} mx-auto px-4 sm:px-6 h-14 flex items-center justify-between transition-all duration-300`}>
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img 
              src="/icon-192.png" 
              alt="Vibe Check Logo" 
              className="w-8 h-8 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform" 
            />
            <div className="flex items-center gap-2">
              <AnimatedGradientText className="text-base tracking-tight font-bold">
                Vibe Check
              </AnimatedGradientText>
              {isAdmin && (
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  Admin
                </span>
              )}
            </div>
          </Link>

          {/* Right controls: Theme Toggle + Language + Settings Link */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />

            {/* Settings Link */}
            <Link 
              to="/settings"
              className="w-8 h-8 rounded-xl bg-muted/70 text-foreground hover:bg-muted border border-border/60 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title={t('settings') || 'Settings'}
              aria-label={t('settings') || 'Settings'}
            >
              <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${isAdminPage ? 'max-w-7xl' : 'max-w-lg'} mx-auto w-full px-4 sm:px-6 py-6 pb-24 transition-all duration-300`}>
        <Outlet />
      </main>

      {/* Bottom Floating Navigation with Smooth Active Pill Indicator */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/50 shadow-lg transition-colors duration-200">
        <div className={`${isAdminPage ? 'max-w-md' : 'max-w-lg'} mx-auto flex items-center justify-around h-16 px-2 relative`}>
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className="relative py-1.5 px-3 flex flex-col items-center justify-center cursor-pointer select-none"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className={`flex flex-col items-center gap-1 z-10 transition-colors ${
                    active
                      ? 'text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  <span className="text-[10px] tracking-tight">{label}</span>
                </motion.div>

                {/* Animated Glide Pill */}
                {active && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 my-auto h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 z-0"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}