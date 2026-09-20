"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api/client";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

interface PwCheck {
  label: string;
  test: (v: string) => boolean;
}

const PW_CHECKS: PwCheck[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter",  test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter",  test: (v) => /[a-z]/.test(v) },
  { label: "One number",            test: (v) => /[0-9]/.test(v) },
  { label: "One special character", test: (v) => /[@#$%^&+=!]/.test(v) },
];

function humanizeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("expired")) return "This reset link has expired. Please request a new one.";
  if (lower.includes("invalid") || lower.includes("token") || lower.includes("not found")) {
    return "This reset link is invalid or has already been used. Please request a new one.";
  }
  if (lower.includes("password")) return "Password does not meet the required complexity rules.";
  return "Something went wrong. Please try again or request a new reset link.";
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [success, setSuccess]                 = useState(false);

  const pwMet = PW_CHECKS.map((c) => c.test(newPassword));
  const pwAllMet = pwMet.every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Token missing / malformed
  if (!token) {
    return (
      <AuthShell>
        <div className="auth-animate-1">
          <p className="auth-heading-eyebrow">Reset Password</p>
          <h1 className="auth-heading">Invalid Link</h1>
          <p className="auth-subheading">
            This password reset link is missing or malformed.
          </p>
        </div>

        <div className="auth-divider auth-animate-2" />

        <div className="auth-error-banner auth-animate-2">
          <AlertIcon />
          <p className="auth-error-text">
            The reset link appears to be incomplete. Please request a new password reset link.
          </p>
        </div>

        <div className="auth-animate-3">
          <Link href="/forgot-password" className="auth-btn" style={{ display: "flex" }}>
            Request New Reset Link
          </Link>
        </div>

        <div className="auth-bottom-nav auth-animate-4">
          <p className="auth-bottom-text">
            Remember your password?
            <Link href="/login" className="auth-bottom-link">Sign In</Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="auth-animate-1">
          <p className="auth-heading-eyebrow">Password Updated</p>
          <h1 className="auth-heading">Done.</h1>
          <p className="auth-subheading">
            Your new password is set. Welcome back.
          </p>
        </div>

        <div className="auth-divider auth-animate-2" />

        <div className="auth-success-banner auth-animate-2">
          <p className="auth-success-title">Password Updated Successfully</p>
          <p className="auth-success-text">
            Your password has been reset. You can now sign in with your new credentials.
          </p>
        </div>

        <div className="auth-animate-3">
          <Link href="/login" className="auth-btn" style={{ display: "flex" }}>
            Continue to Sign In
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
      <div className="auth-animate-1">
        <p className="auth-heading-eyebrow">Account Security</p>
        <h1 className="auth-heading">New Password</h1>
        <p className="auth-subheading">Choose a strong new password for your account.</p>
      </div>

      <div className="auth-divider auth-animate-2" />

      {error && (
        <div className="auth-error-banner auth-animate-2" role="alert" aria-live="polite">
          <AlertIcon />
          <p className="auth-error-text">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-fields">
          {/* New Password */}
          <div className="auth-field auth-animate-2">
            <label htmlFor="reset-new-pw" className="auth-label">New Password</label>
            <div className="auth-input-wrap">
              <input
                id="reset-new-pw"
                type={showNew ? "text" : "password"}
                name="new-password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                disabled={loading}
                aria-describedby="reset-pw-requirements"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showNew} />
              </button>
            </div>

            {newPassword.length > 0 && (
              <div id="reset-pw-requirements" className="auth-pw-requirements" aria-live="polite">
                {PW_CHECKS.map((check, i) => (
                  <div key={i} className={`auth-pw-req-item${pwMet[i] ? " met" : ""}`}>
                    {pwMet[i] ? <CheckIcon /> : <span className="auth-pw-req-dot" />}
                    {check.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-field auth-animate-3">
            <label htmlFor="reset-confirm-pw" className="auth-label">Confirm Password</label>
            <div className="auth-input-wrap">
              <input
                id="reset-confirm-pw"
                type={showConfirm ? "text" : "password"}
                name="confirm-password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                disabled={loading}
                aria-describedby={confirmPassword.length > 0 && !passwordsMatch ? "pw-match-error" : undefined}
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p id="pw-match-error" className="auth-field-error" aria-live="polite">
                Passwords do not match.
              </p>
            )}
            {confirmPassword.length > 0 && passwordsMatch && (
              <p className="auth-pw-req-item met" style={{ fontSize: "0.675rem", marginTop: "0.25rem" }}>
                <CheckIcon /> Passwords match
              </p>
            )}
          </div>
        </div>

        <div className="auth-animate-4">
          <button
            id="reset-submit"
            type="submit"
            disabled={loading || !pwAllMet || !passwordsMatch}
            className="auth-btn"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="auth-btn-spinner" aria-hidden="true" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </div>
      </form>

      <div className="auth-bottom-nav auth-animate-5">
        <p className="auth-bottom-text">
          Remember your password?
          <Link href="/login" className="auth-bottom-link">Sign In</Link>
        </p>
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
