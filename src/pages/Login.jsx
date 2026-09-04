import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/context/LanguageContext";

export default function Login() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      if (err.message?.includes('provider is not enabled') || err.message?.includes('client_id')) {
        setError(t('googleAuthNotConfigured') || "Google Auth is not configured. Please enable it in the Supabase Dashboard.");
      } else {
        setError(err.message || "Failed to sign in with Google");
      }
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title={t('welcomeBack') || "Welcome back"}
      subtitle={t('loginSubtitle') || "Log in to your account"}
      footer={
        <>
          {t('dontHaveAccount') || "Don't have an account?"}{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('createOne') || "Create one"}
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6 rounded-xl"
        onClick={handleGoogle}
        type="button"
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        {t('continueWithGoogle') || "Continue with Google"}
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t('or') || "or"}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('email') || "Email"}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('password') || "Password"}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t('forgotPassword') || "Forgot password?"}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-semibold rounded-xl" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('loggingIn') || "Logging in..."}
            </>
          ) : (
            t('login') || "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
