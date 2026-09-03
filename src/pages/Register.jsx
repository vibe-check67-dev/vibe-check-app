import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/context/LanguageContext";

export default function Register() {
  const { signUpWithEmail, loginWithGoogle } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t('passwordLengthError') || "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch') || "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await signUpWithEmail(email, password, displayName);
      // If Supabase auto-confirmed or returned active session
      if (data?.session) {
        navigate("/");
      } else {
        setRegisteredSuccess(true);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || "Failed to sign up with Google");
    }
  };

  if (registeredSuccess) {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title={t('checkYourEmail') || "Check your email"}
        subtitle={t('confirmationSent') || "We sent a confirmation link to your email"}
        footer={
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('backToLogin') || "Back to log in"}
          </Link>
        }
      >
        <div className="space-y-4 text-center py-4">
          <p className="text-sm text-muted-foreground">
            {t('confirmationDesc') || "Please click the confirmation link sent to:"}
          </p>
          <p className="font-semibold text-foreground text-sm bg-muted/50 py-2 px-3 rounded-xl">
            {email}
          </p>
          <Button
            className="w-full h-12 rounded-xl mt-4"
            onClick={() => navigate("/login")}
          >
            {t('continueToLogin') || "Continue to log in"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={t('createAccount') || "Create your account"}
      subtitle={t('registerSubtitle') || "Sign up to start tracking your mood"}
      footer={
        <>
          {t('alreadyHaveAccount') || "Already have an account?"}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('login') || "Log in"}
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
          <Label htmlFor="displayName">{t('name') || "Name"}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="displayName"
              type="text"
              autoFocus
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('email') || "Email"}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('password') || "Password"}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="•••••••• (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">{t('confirmPassword') || "Confirm Password"}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-semibold rounded-xl" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('creatingAccount') || "Creating account..."}
            </>
          ) : (
            t('createAccount') || "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
