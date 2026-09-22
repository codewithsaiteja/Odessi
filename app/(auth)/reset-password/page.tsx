"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api/client";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle, Check, Lock } from "lucide-react";

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
        <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="mb-2">
            <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold block mb-1">
              RESET PASSWORD
            </span>
            <h1 style={{ color: "#F3F0E8" }} className="text-3xl sm:text-4xl font-serif font-bold text-[#F3F0E8] mb-2 tracking-tight">
              INVALID LINK
            </h1>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-medium">
              This password reset link is missing or malformed.
            </p>
          </div>

          <div
            className="bg-rose-950/60 text-rose-200 border border-rose-800/80 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
            <span>
              The reset link appears to be incomplete. Please request a new password reset link.
            </span>
          </div>

          <Link
            href="/forgot-password"
            style={{ backgroundColor: "#B89A5A", color: "#080808" }}
            className="w-full py-4 bg-[#B89A5A] hover:bg-[#d4af37] text-[#080808] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group cursor-pointer font-sans"
          >
            <span>REQUEST NEW RESET LINK</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>

          <div className="pt-4 border-t border-[#262626] text-center">
            <p className="text-xs text-[#A3A3A3]">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-[#B89A5A] font-bold hover:text-[#d4af37] underline underline-offset-4 ml-1 transition-colors"
              >
                SIGN IN
              </Link>
            </p>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold">
                PASSWORD UPDATED
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border bg-emerald-950/70 text-emerald-300 border-emerald-800/80">
                <CheckCircle size={10} />
                Complete
              </span>
            </div>

            <h1 style={{ color: "#F3F0E8" }} className="text-3xl sm:text-4xl font-serif font-bold text-[#F3F0E8] mb-2 tracking-tight">
              DONE.
            </h1>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-medium">
              Your new password is set. Welcome back to Odessi.
            </p>
          </div>

          <div className="bg-emerald-950/40 text-emerald-200 border border-emerald-800/60 px-4 py-4 rounded-2xl text-xs shadow-xs space-y-1">
            <div className="flex items-start gap-2.5">
              <Lock size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-emerald-300 mb-1">Password Updated Successfully</p>
                <p className="text-emerald-200 leading-relaxed">
                  Your password has been reset. You can now sign in with your new credentials.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/login"
            style={{ backgroundColor: "#B89A5A", color: "#080808" }}
            className="w-full py-4 bg-[#B89A5A] hover:bg-[#d4af37] text-[#080808] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group cursor-pointer font-sans"
          >
            <span>CONTINUE TO SIGN IN</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
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
      <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold block mb-1">
            ACCOUNT SECURITY
          </span>
          <h1 style={{ color: "#F3F0E8" }} className="text-3xl sm:text-4xl font-serif font-bold text-[#F3F0E8] mb-2 tracking-tight">
            NEW PASSWORD
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-medium">
            Choose a strong new password for your account.
          </p>
        </div>

        {error && (
          <div
            className="bg-rose-950/60 text-rose-200 border border-rose-800/80 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="reset-new-pw"
              className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4] mb-2"
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
                style={{ color: "#ffffff", backgroundColor: "#1A1A1A" }}
                className="w-full px-4 py-3.5 pl-10 pr-11 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm font-semibold text-white placeholder:text-[#737373] focus:outline-none focus:border-[#B89A5A] focus:ring-2 focus:ring-[#B89A5A]/30 transition-all disabled:opacity-50 shadow-inner"
                placeholder="••••••••"
                disabled={loading}
                aria-describedby="reset-pw-requirements"
              />
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B89A5A] pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div id="reset-pw-requirements" className="mt-3 space-y-2" aria-live="polite">
                {PW_CHECKS.map((check, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${
                      pwMet[i] ? "text-emerald-400 font-semibold" : "text-[#737373]"
                    }`}
                  >
                    {pwMet[i] ? (
                      <Check size={12} className="text-emerald-400 flex-shrink-0" />
                    ) : (
                      <span className="w-3 h-3 border border-[#444444] rounded-full flex-shrink-0" />
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
              className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4] mb-2"
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
                style={{ color: "#ffffff", backgroundColor: "#1A1A1A" }}
                className="w-full px-4 py-3.5 pl-10 pr-11 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm font-semibold text-white placeholder:text-[#737373] focus:outline-none focus:border-[#B89A5A] focus:ring-2 focus:ring-[#B89A5A]/30 transition-all disabled:opacity-50 shadow-inner"
                placeholder="••••••••"
                disabled={loading}
                aria-describedby={
                  confirmPassword.length > 0 && !passwordsMatch ? "pw-match-error" : undefined
                }
              />
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B89A5A] pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {confirmPassword.length > 0 && !passwordsMatch && (
              <p id="pw-match-error" className="text-rose-400 text-[11px] mt-2 font-medium" aria-live="polite">
                Passwords do not match.
              </p>
            )}
            {confirmPassword.length > 0 && passwordsMatch && (
              <p className="flex items-center gap-2 text-emerald-400 text-[11px] mt-2 font-semibold">
                <Check size={12} className="flex-shrink-0" />
                <span>Passwords match</span>
              </p>
            )}
          </div>

          <button
            id="reset-submit"
            type="submit"
            disabled={loading || !pwAllMet || !passwordsMatch}
            style={{ backgroundColor: "#B89A5A", color: "#080808" }}
            className="w-full py-4 bg-[#B89A5A] hover:bg-[#d4af37] text-[#080808] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 group cursor-pointer font-sans"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>RESETTING...</span>
              </span>
            ) : (
              <>
                <span>RESET PASSWORD</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#262626] text-center">
          <p className="text-xs text-[#A3A3A3]">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-[#B89A5A] font-bold hover:text-[#d4af37] underline underline-offset-4 ml-1 transition-colors"
            >
              SIGN IN
            </Link>
          </p>
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
