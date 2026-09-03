import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-extralight text-slate-300">404</h1>
          <div className="h-1 w-12 bg-primary/40 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page <span className="font-semibold text-foreground">"{pageName}"</span> could not be found.
          </p>
        </div>

        <div>
          <Link to="/">
            <Button className="rounded-xl gap-2 font-semibold shadow-xs">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}