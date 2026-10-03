"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiPost, ApiError } from "@/lib/api/client";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AlertCircle, Check, Clock, RefreshCw, ShieldCheck } from "lucide-react";

type Step = "EMAIL" | "OTP" | "PASSWORD" | "SUCCESS";

interface PwCheck {
  label: string;
  test: (v: string) => boolean;
}

const PW_CHECKS: PwCheck[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One special character (@#$%^&+=!)", test: (v) => /[@#$%^&+=!]/.test(v) },
];

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(3, localPart.length - 2))}@${domain}`;
}

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Passwords
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Timing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Timers
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds

  // Input refs for 6 OTP boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── OTP Countdown Timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "OTP") return;

    const timer = setInterval(() => {
      setOtpExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // ── Resend Cooldown Timer ────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "OTP" || resendCooldown <= 0) return;

    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(cooldownTimer);
  }, [step, resendCooldown]);

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/api/auth/forgot-password", { email: cleanEmail });
      // Transition to OTP verification step
      setStep("OTP");
      setOtp(["", "", "", "", "", ""]);
      setOtpExpirySeconds(300);
      setResendCooldown(60);
      setSuccessNotice("Verification code dispatched to your email address.");
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError(err.message || "Too many requests. Please wait a moment before trying again.");
        } else {
          setError(err.message || "Unable to send verification code. Please try again.");
        }
      } else {
        setError("Unable to connect to the server. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP Action ────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;

    setError(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      await apiPost("/api/auth/forgot-password", { email: email.trim().toLowerCase() });
      setOtp(["", "", "", "", "", ""]);
      setOtpExpirySeconds(300);
      setResendCooldown(60);
      setSuccessNotice("A fresh 6-digit code has been dispatched to your email.");
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to resend code. Please wait before trying again.");
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Digit Input Handlers ─────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    const digit = cleaned.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    // Auto-advance to next box
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move back and clear previous
        const nextOtp = [...otp];
        nextOtp[index - 1] = "";
        setOtp(nextOtp);
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const nextOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pasteData[i] || "";
    }
    setOtp(nextOtp);

    const focusIndex = Math.min(pasteData.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const rawCode = otp.join("");
    if (rawCode.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    if (otpExpirySeconds <= 0) {
      setError("This code has expired. Please click 'RESEND CODE' below.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost<{
        success: boolean;
        message: string;
        resetToken: string;
        expiresInSeconds: number;
      }>("/api/auth/verify-reset-otp", {
        email: email.trim().toLowerCase(),
        otp: rawCode,
      });

      if (response && response.resetToken) {
        // Store short-lived token in state memory only
        setResetToken(response.resetToken);
        setStep("PASSWORD");
        setError(null);
      } else {
        setError("Invalid response received. Please try again.");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid verification code.");
      } else {
        setError("Unable to verify code. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Set New Password ─────────────────────────────────────────────
  const pwMet = PW_CHECKS.map((c) => c.test(newPassword));
  const pwAllMet = pwMet.every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetToken) {
      setError("Your recovery session has expired. Please start over.");
      setStep("EMAIL");
      return;
    }

    if (!pwAllMet) {
      setError("Password does not meet all complexity requirements.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/api/auth/reset-password", {
        resetToken,
        newPassword,
      });

      // Clear memory token immediately
      setResetToken(null);
      setStep("SUCCESS");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to update password. Please try again.");
      } else {
        setError("Unable to update password. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER STEP: SUCCESS ─────────────────────────────────────────────────
  if (step === "SUCCESS") {
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
              Your credentials have been securely updated. You may now sign in with your new password.
            </p>
          </div>

          <div className="bg-[#101010] border border-[#222222] rounded-[2px] p-5 text-xs text-[#9C978E] space-y-2">
            <div className="flex items-center gap-2 text-[#CBB57B] font-medium">
              <ShieldCheck size={16} />
              <span>Security Updated</span>
            </div>
            <p className="leading-relaxed">
              All active sessions across other devices have been invalidated for your security.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 flex items-center justify-center font-sans cursor-pointer"
            >
              RETURN TO SIGN IN
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  // ── RENDER STEP: SET NEW PASSWORD ────────────────────────────────────────
  if (step === "PASSWORD") {
    return (
      <AuthShell>
        <div className="space-y-8">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
              ODISSI • STEP 3 OF 3
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
              CREATE NEW PASSWORD
            </h1>
            <p className="text-xs text-[#9C978E] leading-relaxed">
              Choose a strong, unique password for your account.
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

          <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="otp-new-pw"
                className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="otp-new-pw"
                  type={showNewPassword ? "text" : "password"}
                  name="new-password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-14 bg-[#101010] border border-[#222222] rounded-[2px] text-sm text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[10px] tracking-wider uppercase font-mono text-[#737373] hover:text-[#FAF9F6] transition-colors cursor-pointer select-none"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              {/* Password complexity checklist */}
              {newPassword.length > 0 && (
                <div className="mt-3 space-y-1.5" aria-live="polite">
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
                htmlFor="otp-confirm-pw"
                className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="otp-confirm-pw"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm-password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-14 bg-[#101010] border border-[#222222] rounded-[2px] text-sm text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[10px] tracking-wider uppercase font-mono text-[#737373] hover:text-[#FAF9F6] transition-colors cursor-pointer select-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[#E06C75] text-[11px] mt-2 font-mono" aria-live="polite">
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
                type="submit"
                disabled={loading || !pwAllMet || !passwordsMatch}
                className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-sans"
                aria-busy={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>SAVING...</span>
                  </span>
                ) : (
                  "RESET PASSWORD"
                )}
              </button>
            </div>
          </form>
        </div>
      </AuthShell>
    );
  }

  // ── RENDER STEP: VERIFY OTP ──────────────────────────────────────────────
  if (step === "OTP") {
    const isCodeComplete = otp.every((d) => d.length === 1);
    const isExpired = otpExpirySeconds === 0;

    return (
      <AuthShell>
        <div className="space-y-8">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
              ODISSI • STEP 2 OF 3
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
              VERIFY YOUR EMAIL
            </h1>
            <p className="text-xs text-[#9C978E] leading-relaxed">
              We have dispatched a 6-digit verification code to{" "}
              <span className="text-[#FAF9F6] font-mono font-medium">{maskEmail(email)}</span>.
            </p>
          </div>

          {successNotice && !error && (
            <div
              className="bg-[#121614] text-[#A3D9B5] border border-[#1E3327] px-4 py-3 rounded-[2px] text-xs flex items-center gap-2.5"
              role="status"
            >
              <Check size={15} className="text-[#68D391] shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

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

          <form onSubmit={handleOtpSubmit} noValidate className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E]">
                  6-Digit Verification Code
                </label>
                <div
                  className={`flex items-center gap-1.5 text-xs font-mono ${
                    isExpired ? "text-[#E06C75]" : "text-[#9C978E]"
                  }`}
                  aria-live="polite"
                >
                  <Clock size={13} className="shrink-0" />
                  <span>
                    {isExpired ? "Expired" : formatCountdown(otpExpirySeconds)}
                  </span>
                </div>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    disabled={loading}
                    aria-label={`Digit ${index + 1} of 6`}
                    className={`w-full aspect-[4/5] sm:aspect-square text-center text-xl sm:text-2xl font-mono font-semibold text-[#FAF9F6] bg-[#101010] border rounded-[2px] focus:outline-none transition-colors disabled:opacity-50 ${
                      digit
                        ? "border-[#4A4740] bg-[#141414]"
                        : "border-[#222222]"
                    } focus:border-[#CBB57B]`}
                  />
                ))}
              </div>

              <p className="text-[11px] text-[#737373] mt-2.5 leading-relaxed">
                Code expires in 5 minutes. Enter the 6 digits or paste the code directly.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading || !isCodeComplete || isExpired}
                className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-sans"
                aria-busy={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>VERIFYING...</span>
                  </span>
                ) : (
                  "VERIFY OTP"
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendCooldown > 0}
                  className="inline-flex items-center gap-1.5 text-xs text-[#9C978E] hover:text-[#FAF9F6] disabled:text-[#555555] disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  <span>
                    {resendCooldown > 0
                      ? `RESEND CODE (${resendCooldown}s)`
                      : "RESEND CODE"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("EMAIL");
                    setError(null);
                    setSuccessNotice(null);
                  }}
                  className="text-xs text-[#9C978E] hover:text-[#FAF9F6] underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Change email
                </button>
              </div>
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

  // ── RENDER STEP: EMAIL (STEP 1) ──────────────────────────────────────────
  return (
    <AuthShell>
      <div className="space-y-8">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
            ODISSI • STEP 1 OF 3
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
            RECOVER ACCESS
          </h1>
          <p className="text-xs text-[#9C978E] leading-relaxed">
            Enter your registered email address and we will dispatch a secure 6-digit verification code.
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

        <form onSubmit={handleEmailSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="forgot-email"
              className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
            >
              Email Address
            </label>
            <input
              id="forgot-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#101010] border border-[#222222] rounded-[2px] text-sm text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] transition-colors disabled:opacity-50"
              placeholder="name@example.com"
              disabled={loading}
            />
            <p className="text-[11px] text-[#737373] mt-2 leading-relaxed">
              For privacy and security, we never disclose whether an address is registered.
            </p>
          </div>

          <div className="pt-2">
            <button
              id="forgot-submit"
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-sans"
              aria-busy={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>SENDING CODE...</span>
                </span>
              ) : (
                "SEND OTP"
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
