import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, PlusCircle, Shield, LogOut, User, Globe } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import LanguageToggle from '@/components/LanguageToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-xs">
              <span className="text-sm">〰️</span>
            </div>
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

            {/* User Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 hover:bg-brand-200 border border-brand-200 flex items-center justify-center font-bold text-xs transition-colors">
                  {userInitial}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-lg border">
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-bold text-foreground leading-none">
                      {profile?.display_name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-none truncate">
                      {user?.email}
                    </p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 w-fit px-1.5 py-0.5 rounded mt-1">
                        <Shield className="w-3 h-3" />
                        Administrator
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isAdmin && (
                  <DropdownMenuItem asChild className="rounded-xl text-xs font-medium cursor-pointer">
                    <Link to="/admin" className="flex items-center gap-2 w-full py-1.5">
                      <Shield className="w-4 h-4 text-brand-600" />
                      {t('adminPanel')}
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={toggleLang}
                  className="rounded-xl text-xs font-medium cursor-pointer py-1.5 flex items-center gap-2"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>{t('language')}: {lang === 'th' ? 'ภาษาไทย' : 'English'}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  className="rounded-xl text-xs font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer py-1.5 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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