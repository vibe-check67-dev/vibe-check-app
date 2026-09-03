import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/context/LanguageContext";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset link");
      // Still show friendly state
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={sent ? CheckCircle2 : Mail}
      title={t('resetPassword') || "Reset password"}
      subtitle={sent ? (t('linkSent') || "Check your inbox") : (t('resetSubtitle') || "We'll send you a link to reset your password")}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('backToLogin') || "Back to log in"}
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4 text-center py-2">
          <p className="text-sm text-muted-foreground">
            {t('resetEmailSentDesc') || "If an account exists with that email, you'll receive a password reset link shortly."}
          </p>
          <p className="text-xs text-muted-foreground font-mono bg-muted/50 py-2 rounded-lg">
            {email}
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full h-12 rounded-xl mt-4">
              {t('backToLogin') || "Back to log in"}
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('emailAddress') || "Email address"}</Label>
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
          <Button type="submit" className="w-full h-12 font-semibold rounded-xl" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('sending') || "Sending..."}
              </>
            ) : (
              t('sendResetLink') || "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
