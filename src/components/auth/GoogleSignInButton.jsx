import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "@/components/GoogleIcon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/context/LanguageContext";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "42401236213-r4co4v9jq975sfa480lg971b42dov9vs.apps.googleusercontent.com";

export default function GoogleSignInButton({ text, onError }) {
  const { loginWithGoogleIdToken, loginWithGoogle } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval = null;

    const setupGsi = () => {
      if (window.google?.accounts?.id && googleBtnRef.current && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (response.credential) {
                setLoading(true);
                try {
                  await loginWithGoogleIdToken(response.credential);
                  navigate("/");
                } catch (err) {
                  console.error("ID token login failed:", err);
                  onError && onError(err.message || "Failed to sign in with Google");
                } finally {
                  setLoading(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render Google's native popup button
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            width: googleBtnRef.current.offsetWidth || 340,
            text: text === "signup" ? "signup_with" : "continue_with",
            shape: "rectangular",
            logo_alignment: "center",
          });

          // Also trigger One Tap popup on the current page
          window.google.accounts.id.prompt();
          setGsiLoaded(true);
        } catch (e) {
          console.warn("Could not initialize Google Identity Services:", e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGsi();
    } else {
      interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          setupGsi();
        }
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loginWithGoogleIdToken, navigate, onError, text]);

  const handleFallbackClick = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      onError && onError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mb-6">
      {/* Container for Google's native popup button (No supabase redirect!) */}
      <div
        ref={googleBtnRef}
        className={`w-full flex justify-center min-h-[48px] ${gsiLoaded ? "block" : "hidden"}`}
      />

      {/* Fallback button shown if GSI is still loading or unavailable */}
      {!gsiLoaded && (
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium rounded-xl"
          onClick={handleFallbackClick}
          disabled={loading}
          type="button"
        >
          <GoogleIcon className="w-5 h-5 mr-2" />
          {text === "signup"
            ? t("continueWithGoogle") || "Sign up with Google"
            : t("continueWithGoogle") || "Continue with Google"}
        </Button>
      )}
    </div>
  );
}
