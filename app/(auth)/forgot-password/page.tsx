"use client";

import React, { useState } from "react";
import { apiPost } from "@/lib/api/client";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Security: backend always returns 200 regardless of email existence
      await apiPost("/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      // Show generic success anyway to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <div className="auth-animate-1">
          <p className="auth-heading-eyebrow">Email Sent</p>
          <h1 className="auth-heading">Check Your Inbox</h1>
        </div>

        <div className="auth-divider auth-animate-2" />

        <div className="auth-success-banner auth-animate-2">
          <p className="auth-success-title">Reset Link Sent</p>
          <p className="auth-success-text">
            If an account exists for <strong style={{ color: "var(--color-odessi-silver)", fontWeight: 600 }}>{email}</strong>,
            you will receive an email with instructions to reset your password within a few minutes.
          </p>
          <p className="auth-success-text" style={{ marginTop: "0.5rem" }}>
            Check your spam folder if you don&apos;t see it.
          </p>
        </div>

        <div className="auth-animate-3">
          <Link href="/login" className="auth-btn" style={{ display: "flex" }}>
            Return to Sign In
          </Link>
        </div>

        <div className="auth-animate-4" style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            type="button"
            className="auth-btn-ghost"
            onClick={() => { setSent(false); setEmail(""); }}
          >
            Try a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="auth-animate-1">
        <p className="auth-heading-eyebrow">Account Recovery</p>
        <h1 className="auth-heading">Forgot Password?</h1>
        <p className="auth-subheading">
          Enter your email and we&apos;ll send you a secure reset link.
        </p>
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
          <div className="auth-field auth-animate-2">
            <label htmlFor="forgot-email" className="auth-label">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              disabled={loading}
            />
            <p className="auth-hint">
              We&apos;ll never reveal whether an account exists for this email.
            </p>
          </div>
        </div>

        <div className="auth-animate-3">
          <button
            id="forgot-submit"
            type="submit"
            disabled={loading || !email}
            className="auth-btn"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="auth-btn-spinner" aria-hidden="true" />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </div>
      </form>

      <div className="auth-bottom-nav auth-animate-4">
        <Link href="/login" className="auth-btn-ghost" style={{ display: "inline-flex" }}>
          <ArrowLeftIcon />
          Back to Sign In
        </Link>
      </div>
    </AuthShell>
  );
}
