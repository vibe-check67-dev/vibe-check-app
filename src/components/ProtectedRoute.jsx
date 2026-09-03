import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({
  fallback = <DefaultFallback />,
  unauthenticatedElement = <Navigate to="/login" replace />,
  adminOnly = false,
}) {
  const { isAuthenticated, isLoadingAuth, isAdmin } = useAuth();

  if (isLoadingAuth) {
    return fallback;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
