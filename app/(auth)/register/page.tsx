"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AlertCircle, Check } from "lucide-react";

function humanizeError(raw: string): string {
  if (!raw) return "Registration failed. Please try again.";
  const lower = raw.toLowerCase();
  if (
    lower.includes("exist") ||
    lower.includes("duplicate") ||
    lower.includes("already") ||
    lower.includes("conflict") ||
    lower.includes("409")
  ) {
    return "An account with this email address already exists.";
  }
  if (lower.includes("password does not meet") || lower.includes("password must contain")) {
    return "Password does not meet the required complexity rules.";
  }
  if (lower.includes("network") || lower.includes("connect")) {
    return "Unable to connect to the server. Please try again.";
  }

  if (
    raw !== "UNKNOWN_ERROR" &&
    raw !== "An unexpected error occurred. Please try again later." &&
    raw !== "Registration failed"
  ) {
    return raw;
  }

  return "Registration failed. Please try again.";
}

function getSafeRedirect(url: string | null): string {
  if (!url) return "/";
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
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One special character", test: (v) => /[@#$%^&+=!]/.test(v) },
];

function RegisterContent() {
  const { register, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Extract referral code from URL search param if present (e.g. ?ref=CODE)
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam && refParam.trim()) {
      setReferralCode(refParam.trim().toUpperCase());
    }
  }, [searchParams]);

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
      setError("Please ensure your password meets all complexity rules.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await register({ firstName, lastName, email, password, referralCode: referralCode.trim() });
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
        <div className="space-y-6">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
              ACCOUNT CREATED
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
              WELCOME TO ODESSI
            </h1>
            <p className="text-xs text-[#9C978E] leading-relaxed">
              Your profile has been created. You can now access your orders and personalized archive.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href={`/login?redirect=${encodeURIComponent(searchParams.get("redirect") || "/")}`}
              className="inline-block w-full py-3.5 px-6 text-center bg-[#F3F0E8] text-[#080808] hover:bg-white text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors"
            >
              CONTINUE TO SIGN IN
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
            ODISSI
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
            CREATE ACCOUNT
          </h1>
          <p className="text-xs text-[#9C978E] leading-relaxed">
            Begin your Odessi journey. Join our client archive.
          </p>
        </div>

        {/* Error Alert */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="reg-first-name"
                className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
              >
                First Name
              </label>
              <input
                id="reg-first-name"
                type="text"
                name="firstName"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#101010] border border-[#222222] rounded-[2px] text-sm text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] transition-colors disabled:opacity-50"
                placeholder="First"
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="reg-last-name"
                className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
              >
                Last Name
              </label>
              <input
                id="reg-last-name"
                type="text"
                name="lastName"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#101010] border border-[#222222] rounded-[2px] text-sm text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] transition-colors disabled:opacity-50"
                placeholder="Last"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
            >
              Email Address
            </label>
            <input
              id="reg-email"
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
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="new-password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-14 bg-[#101010] border border-[#222222] rounded-[2px] text-sm text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] transition-colors disabled:opacity-50"
                placeholder="••••••••"
                disabled={loading}
                aria-describedby="pw-requirements"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[10px] tracking-wider uppercase font-mono text-[#737373] hover:text-[#FAF9F6] transition-colors cursor-pointer select-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            {/* Restrained Password Requirements Checklist */}
            {password.length > 0 && (
              <div id="pw-requirements" className="mt-3 space-y-1.5" aria-live="polite">
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

          {/* Referral Code (Optional) Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="reg-referral-code"
                className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E]"
              >
                Referral Code <span className="text-[#555555] normal-case">(optional)</span>
              </label>
              {referralCode.trim().length > 0 ? (
                <span className="text-[10px] text-[#CBB57B] font-mono">
                  CODE APPLIED
                </span>
              ) : null}
            </div>
            <input
              id="reg-referral-code"
              type="text"
              name="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-[#101010] border border-[#222222] rounded-[2px] text-xs font-mono tracking-wider text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] uppercase transition-colors disabled:opacity-50"
              placeholder="e.g. ODESSI-REF"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="register-submit"
              type="submit"
              disabled={loading || !firstName.trim() || !lastName.trim() || !email.trim() || !pwAllMet}
              className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-sans"
              aria-busy={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>CREATING ACCOUNT...</span>
                </span>
              ) : (
                "CREATE ACCOUNT"
              )}
            </button>
          </div>
        </form>

        {/* Bottom Navigation */}
        <div className="pt-6 border-t border-[#171717] text-center text-xs text-[#9C978E]">
          <span>Already have an account? </span>
          <Link
            href={`/login?redirect=${encodeURIComponent(searchParams.get("redirect") || "/")}`}
            className="text-[#FAF9F6] hover:underline underline-offset-4 font-medium transition-colors ml-1"
          >
            Sign in
          </Link>
        </div>
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
