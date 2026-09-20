"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
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

function humanizeError(raw: string): string {
  if (!raw) return "Registration failed. Please try again.";
  const lower = raw.toLowerCase();
  if (lower.includes("exist") || lower.includes("duplicate") || lower.includes("already") || lower.includes("conflict") || lower.includes("409")) {
    return "An account with this email address already exists.";
  }
  if (lower.includes("password does not meet") || lower.includes("password must contain")) {
    return "Password does not meet the required complexity rules.";
  }
  
  // Do not hide other errors (e.g. backend validation constraints)
  if (raw !== "UNKNOWN_ERROR" && raw !== "An unexpected error occurred. Please try again later." && raw !== "Registration failed") {
    return raw;
  }
  
  return "Registration failed. Please try again.";
}

function getSafeRedirect(url: string | null): string {
  if (!url) return "/";
  // Only allow relative paths starting with a single slash to prevent open redirect vulnerabilities
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return "/";
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

function RegisterContent() {
  const { register, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirect = getSafeRedirect(searchParams.get("redirect"));
      router.replace(redirect);
    }
  }, [user, authLoading, router, searchParams]);

  const pwMet = PW_CHECKS.map((c) => c.test(password));
  const pwAllMet = pwMet.every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwAllMet) {
      setError("Please ensure your password meets all requirements.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await register({ firstName, lastName, email, password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(humanizeError(msg));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  if (success) {
    return (
      <AuthShell>
        <div className="auth-animate-1">
          <p className="auth-heading-eyebrow">Account Created</p>
          <h1 className="auth-heading">You&apos;re in.</h1>
          <p className="auth-subheading">
            Welcome to Odessi.tfi — wear the story.
          </p>
        </div>

        <div className="auth-divider auth-animate-2" />

        <div className="auth-success-banner auth-animate-2">
          <p className="auth-success-title">Check Your Inbox</p>
          <p className="auth-success-text">
            Your account has been created. If email verification is required, 
            check your inbox for a confirmation link — then sign in to start your journey.
          </p>
        </div>

        <div className="auth-animate-3">
          <Link href={`/login?redirect=${encodeURIComponent(searchParams.get("redirect") || "/")}`} className="auth-btn" style={{ display: "flex", justifyContent: "center" }}>
            Continue to Sign In
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="auth-animate-1">
        <p className="auth-heading-eyebrow">New to Odessi</p>
        <h1 className="auth-heading">Create Account</h1>
        <p className="auth-subheading">Join Odessi and wear the story.</p>
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
          {/* Name row */}
          <div className="auth-fields-row auth-animate-2">
            <div className="auth-field">
              <label htmlFor="reg-first-name" className="auth-label">First Name</label>
              <input
                id="reg-first-name"
                type="text"
                name="firstName"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="auth-input"
                placeholder="Arjun"
                disabled={loading}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="reg-last-name" className="auth-label">Last Name</label>
              <input
                id="reg-last-name"
                type="text"
                name="lastName"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="auth-input"
                placeholder="Sharma"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="auth-field auth-animate-3">
            <label htmlFor="reg-email" className="auth-label">Email Address</label>
            <input
              id="reg-email"
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
          </div>

          {/* Password */}
          <div className="auth-field auth-animate-4">
            <label htmlFor="reg-password" className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="new-password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                disabled={loading}
                aria-describedby="pw-requirements"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {/* Live password requirements */}
            {password.length > 0 && (
              <div id="pw-requirements" className="auth-pw-requirements" aria-live="polite">
                {PW_CHECKS.map((check, i) => (
                  <div key={i} className={`auth-pw-req-item${pwMet[i] ? " met" : ""}`}>
                    {pwMet[i] ? (
                      <CheckIcon />
                    ) : (
                      <span className="auth-pw-req-dot" />
                    )}
                    {check.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="auth-animate-5">
          <button
            id="register-submit"
            type="submit"
            disabled={loading || !firstName || !lastName || !email || !pwAllMet}
            className="auth-btn"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="auth-btn-spinner" aria-hidden="true" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </form>

      <div className="auth-bottom-nav auth-animate-6">
        <p className="auth-bottom-text">
          Already have an account?
          <Link href={`/login?redirect=${encodeURIComponent(searchParams.get("redirect") || "/")}`} className="auth-bottom-link">
            Sign In
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
