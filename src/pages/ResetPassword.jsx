import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/context/LanguageContext";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError(t('passwordLengthError') || "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch') || "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title={t('passwordUpdated') || "Password updated"}
        subtitle={t('redirecting') || "Redirecting to your dashboard..."}
      >
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            {t('passwordUpdateSuccess') || "Your password has been successfully updated."}
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title={t('newPassword') || "New password"}
      subtitle={t('newPasswordSubtitle') || "Enter your new password below"}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline text-sm">
          {t('backToLogin') || "Back to log in"}
        </Link>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t('newPassword') || "New Password"}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="•••••••• (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              {t('resetting') || "Resetting..."}
            </>
          ) : (
            t('updatePassword') || "Update password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
