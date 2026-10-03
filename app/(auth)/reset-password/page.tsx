"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api/client";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AlertCircle, Check } from "lucide-react";

interface PwCheck {
  label: string;
  test: (v: string) => boolean;
}

const PW_CHECKS: PwCheck[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One special character", test: (v) => /[@#$%^&+=!]/.test(v) },
];

function humanizeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("expired")) {
    return "This reset link has expired. Please request a new one.";
  }
  if (lower.includes("invalid") || lower.includes("token") || lower.includes("not found")) {
    return "This reset link is invalid or has already been used. Please request a new one.";
  }
  if (lower.includes("password")) {
    return "Password does not meet the required complexity rules.";
  }
  if (lower.includes("network") || lower.includes("connect")) {
    return "Unable to connect to the server. Please try again.";
  }
  return "Something went wrong. Please try again or request a new reset link.";
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pwMet = PW_CHECKS.map((c) => c.test(newPassword));
  const pwAllMet = pwMet.every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  if (!token) {
    return (
      <AuthShell>
        <div className="space-y-8">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
              ODISSI
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
              INVALID LINK
            </h1>
            <p className="text-xs text-[#9C978E] leading-relaxed">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div
            className="bg-[#1A1112] text-[#F3C5C7] border border-[#3E1C1F] px-4 py-3 rounded-[2px] text-xs flex items-center gap-2.5"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={15} className="text-[#E06C75] shrink-0" />
            <span>
              The reset link appears to be incomplete. Please request a new password reset link.
            </span>
          </div>

          <div className="pt-2">
            <Link
              href="/forgot-password"
              className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 flex items-center justify-center font-sans"
            >
              REQUEST NEW RESET LINK
            </Link>
          </div>

          <div className="pt-6 border-t border-[#171717] text-center text-xs text-[#9C978E]">
            <span>Remember your password? </span>
            <Link
              href="/login"
              className="text-[#FAF9F6] hover:underline underline-offset-4 font-medium transition-colors ml-1"
            >
              Sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="space-y-8">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
              ODISSI
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
              PASSWORD UPDATED
            </h1>
            <p className="text-xs text-[#9C978E] leading-relaxed">
              Your new password has been established. You may now sign in.
            </p>
          </div>

          <div className="bg-[#101010] border border-[#222222] rounded-[2px] p-5 text-xs text-[#9C978E] space-y-2">
            <p className="text-[#FAF9F6] font-medium">Security Updated</p>
            <p className="leading-relaxed">
              Your credentials have been securely updated in our records.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 flex items-center justify-center font-sans"
            >
              CONTINUE TO SIGN IN
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pwAllMet) {
      setError("Password does not meet the required complexity rules.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/api/auth/reset-password", { token, newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      setError(humanizeError(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="space-y-8">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
            ODISSI
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
            NEW PASSWORD
          </h1>
          <p className="text-xs text-[#9C978E] leading-relaxed">
            Choose a strong new password for your account.
          </p>
        </div>

        {error && (
          <div
            className="bg-[#1A1112] text-[#F3C5C7] border border-[#3E1C1F] px-4 py-3 rounded-[2px] text-xs flex items-center gap-2.5"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={15} className="text-[#E06C75] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="reset-new-pw"
              className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="reset-new-pw"
                type={showNew ? "text" : "password"}
                name="new-password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-14 bg-[#101010] border border-[#222222] rounded-[2px] text-sm text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] transition-colors disabled:opacity-50"
                placeholder="••••••••"
                disabled={loading}
                aria-describedby="reset-pw-requirements"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[10px] tracking-wider uppercase font-mono text-[#737373] hover:text-[#FAF9F6] transition-colors cursor-pointer select-none"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? "HIDE" : "SHOW"}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div id="reset-pw-requirements" className="mt-3 space-y-1.5" aria-live="polite">
                {PW_CHECKS.map((check, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-[11px] font-mono transition-colors ${
                      pwMet[i] ? "text-[#EAE7DF]" : "text-[#555555]"
                    }`}
                  >
                    {pwMet[i] ? (
                      <Check size={11} className="text-[#CBB57B] shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#333333] shrink-0" />
                    )}
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="reset-confirm-pw"
              className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="reset-confirm-pw"
                type={showConfirm ? "text" : "password"}
                name="confirm-password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-14 bg-[#101010] border border-[#222222] rounded-[2px] text-sm text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] transition-colors disabled:opacity-50"
                placeholder="••••••••"
                disabled={loading}
                aria-describedby={
                  confirmPassword.length > 0 && !passwordsMatch ? "pw-match-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[10px] tracking-wider uppercase font-mono text-[#737373] hover:text-[#FAF9F6] transition-colors cursor-pointer select-none"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? "HIDE" : "SHOW"}
              </button>
            </div>

            {confirmPassword.length > 0 && !passwordsMatch && (
              <p id="pw-match-error" className="text-[#E06C75] text-[11px] mt-2 font-mono" aria-live="polite">
                Passwords do not match.
              </p>
            )}
            {confirmPassword.length > 0 && passwordsMatch && (
              <p className="flex items-center gap-1.5 text-[#CBB57B] text-[11px] mt-2 font-mono">
                <Check size={11} className="shrink-0" />
                <span>Passwords match</span>
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              id="reset-submit"
              type="submit"
              disabled={loading || !pwAllMet || !passwordsMatch}
              className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-sans"
              aria-busy={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>RESETTING...</span>
                </span>
              ) : (
                "RESET PASSWORD"
              )}
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-[#171717] text-center text-xs text-[#9C978E]">
          <span>Remember your password? </span>
          <Link
            href="/login"
            className="text-[#FAF9F6] hover:underline underline-offset-4 font-medium transition-colors ml-1"
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
