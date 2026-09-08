import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, PlusCircle, Shield, Settings } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import LanguageToggle from '@/components/LanguageToggle';



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

  const userInitial = profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-2xs">
        <div className={`${isAdminPage ? 'max-w-7xl' : 'max-w-2xl'} mx-auto px-4 sm:px-6 h-14 flex items-center justify-between transition-all duration-300`}>
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <img 
              src="/icon-192.png" 
              alt="Vibe Check Logo" 
              className="w-8 h-8 rounded-xl object-cover shadow-xs" 
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground tracking-tight text-base">Vibe Check</span>
              {isAdmin && (
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                  Admin
                </span>
              )}
            </div>
          </Link>

          {/* Right controls: Language + User Avatar Dropdown */}
          <div className="flex items-center gap-2">
            <LanguageToggle />

            {/* Settings Link */}
            <Link 
              to="/settings"
              className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 hover:bg-brand-200 border border-brand-200 flex items-center justify-center transition-colors shadow-sm"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${isAdminPage ? 'max-w-7xl' : 'max-w-lg'} mx-auto w-full px-4 sm:px-6 py-6 pb-24 transition-all duration-300`}>
        <Outlet />
      </main>

      {/* Bottom Floating Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-lg">
        <div className={`${isAdminPage ? 'max-w-md' : 'max-w-lg'} mx-auto flex items-center justify-around h-16 px-2`}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                isActive(path)
                  ? 'text-brand-600 font-bold scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}