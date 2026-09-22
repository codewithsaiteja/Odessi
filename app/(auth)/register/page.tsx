"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { Eye, EyeOff, AlertCircle, ArrowRight, Check, CheckCircle, User, Gift, Sparkles, Mail, Lock } from "lucide-react";

function humanizeError(raw: string): string {
  if (!raw) return "Registration failed. Please try again.";
  const lower = raw.toLowerCase();
  if (lower.includes("exist") || lower.includes("duplicate") || lower.includes("already") || lower.includes("conflict") || lower.includes("409")) {
    return "An account with this email address already exists.";
  }
  if (lower.includes("password does not meet") || lower.includes("password must contain")) {
    return "Password does not meet the required complexity rules.";
  }
  if (lower.includes("network") || lower.includes("connect")) {
    return "Unable to connect to the server. Please try again.";
  }
  
  if (raw !== "UNKNOWN_ERROR" && raw !== "An unexpected error occurred. Please try again later." && raw !== "Registration failed") {
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

  // Extract referral code from URL search param if present (e.g. ?ref=CODESPECIFIC)
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
      setError("Please ensure your password meets all requirements.");
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
        <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold">
                ACCOUNT CREATED
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border bg-emerald-950/70 text-emerald-300 border-emerald-800/80">
                <CheckCircle size={10} />
                Welcome
              </span>
            </div>

            <h1 style={{ color: "#F3F0E8" }} className="text-3xl sm:text-4xl font-serif font-bold text-[#F3F0E8] mb-2">
              YOU&apos;RE IN.
            </h1>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-medium">
              Welcome to Odessi.tfi — where you wear the story.
            </p>
          </div>

          <div className="bg-emerald-950/40 text-emerald-200 border border-emerald-800/60 px-4 py-4 rounded-2xl text-xs shadow-xs space-y-1">
            <div className="flex items-start gap-2.5">
              <User size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-emerald-300 mb-1">Account Created Successfully</p>
                <p className="text-emerald-200 leading-relaxed">
                  Your account has been created and you&apos;re ready to start your luxury fashion journey with Odessi.
                </p>
              </div>
            </div>
          </div>

          <Link
            href={`/login?redirect=${encodeURIComponent(searchParams.get("redirect") || "/")}`}
            style={{ backgroundColor: "#B89A5A", color: "#080808" }}
            className="w-full py-4 bg-[#B89A5A] hover:bg-[#d4af37] text-[#080808] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all shadow-lg shadow-[#B89A5A]/10 flex items-center justify-center gap-2 group cursor-pointer font-sans"
          >
            <span>CONTINUE TO SIGN IN</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {/* High-Contrast Luxury Glass-Card Wrapper */}
      <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        {/* Header */}
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold block mb-1">
            NEW TO ODESSI
          </span>
          <h1 style={{ color: "#F3F0E8" }} className="text-3xl sm:text-4xl font-serif font-bold text-[#F3F0E8] mb-2 tracking-tight">
            CREATE AN ACCOUNT
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-medium">
            Join Odessi and become part of our luxury fashion community.
          </p>
        </div>

        {/* Error Alert */}
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

        {/* Referral Code Welcome Bonus Banner */}
        <div className="bg-[#B89A5A]/10 border border-[#B89A5A]/30 text-[#F3F0E8] px-4 py-3.5 rounded-2xl text-xs flex items-start gap-3 shadow-xs">
          <Gift size={18} className="text-[#B89A5A] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#B89A5A] uppercase block tracking-wider text-[10px] mb-0.5 font-mono">
              ✨ WELCOME REFERRAL OFFER
            </span>
            <span className="text-[#E5E5E5] text-xs font-medium leading-relaxed">
              Add a referral code below to get a <strong className="text-[#B89A5A]">₹200 bonus credit</strong> on your first order!
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="reg-first-name"
                className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4] mb-2"
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
                style={{ color: "#ffffff", backgroundColor: "#1A1A1A" }}
                className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm font-semibold text-white placeholder:text-[#737373] focus:outline-none focus:border-[#B89A5A] focus:ring-2 focus:ring-[#B89A5A]/30 transition-all disabled:opacity-50 shadow-inner"
                placeholder="Arjun"
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="reg-last-name"
                className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4] mb-2"
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
                style={{ color: "#ffffff", backgroundColor: "#1A1A1A" }}
                className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm font-semibold text-white placeholder:text-[#737373] focus:outline-none focus:border-[#B89A5A] focus:ring-2 focus:ring-[#B89A5A]/30 transition-all disabled:opacity-50 shadow-inner"
                placeholder="Sharma"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4] mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ color: "#ffffff", backgroundColor: "#1A1A1A" }}
                className="w-full px-4 py-3.5 pl-10 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm font-semibold text-white placeholder:text-[#737373] focus:outline-none focus:border-[#B89A5A] focus:ring-2 focus:ring-[#B89A5A]/30 transition-all disabled:opacity-50 shadow-inner"
                placeholder="you@example.com"
                disabled={loading}
              />
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B89A5A] pointer-events-none" />
            </div>
          </div>

          {/* Referral Code (Optional) Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="reg-referral-code"
                className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4]"
              >
                Referral Code <span className="text-[#A3A3A3] font-normal text-[10px] uppercase">(optional)</span>
              </label>
              {referralCode.trim().length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B89A5A] bg-[#B89A5A]/20 px-2.5 py-0.5 rounded-md font-mono border border-[#B89A5A]/40 shadow-xs">
                  <Sparkles size={10} className="text-[#B89A5A]" /> ₹200 BONUS APPLIED
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setReferralCode("ODESSI-REF-WELCOME")}
                  className="text-[10px] font-bold text-[#B89A5A] hover:text-[#d4af37] underline font-mono tracking-wider cursor-pointer"
                >
                  + APPLY WELCOME CODE
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                id="reg-referral-code"
                type="text"
                name="referralCode"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                style={{ color: "#ffffff", backgroundColor: "#1A1A1A" }}
                className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm font-mono tracking-wider font-semibold text-white placeholder:text-[#737373] focus:outline-none focus:border-[#B89A5A] focus:ring-2 focus:ring-[#B89A5A]/30 transition-all disabled:opacity-50 uppercase shadow-inner"
                placeholder="e.g. ODESSI-REF-123456"
                disabled={loading}
              />
              {!referralCode.trim() && (
                <button
                  type="button"
                  onClick={() => setReferralCode("ODESSI-REF-WELCOME")}
                  className="px-4 py-3.5 bg-[#242424] hover:bg-[#2E2E2E] text-white border border-[#383838] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  APPLY
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#A3A3A3] mt-1.5 font-medium">
              Add referral code to get ₹200 bonus on your first order.
            </p>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4] mb-2"
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
                style={{ color: "#ffffff", backgroundColor: "#1A1A1A" }}
                className="w-full px-4 py-3.5 pl-10 pr-11 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm font-semibold text-white placeholder:text-[#737373] focus:outline-none focus:border-[#B89A5A] focus:ring-2 focus:ring-[#B89A5A]/30 transition-all disabled:opacity-50 shadow-inner"
                placeholder="••••••••"
                disabled={loading}
                aria-describedby="pw-requirements"
              />
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B89A5A] pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Live Password Requirements */}
            {password.length > 0 && (
              <div id="pw-requirements" className="mt-3 space-y-2" aria-live="polite">
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

          {/* Submit Button */}
          <button
            id="register-submit"
            type="submit"
            disabled={loading || !firstName.trim() || !lastName.trim() || !email.trim() || !pwAllMet}
            style={{ backgroundColor: "#B89A5A", color: "#080808" }}
            className="w-full py-4 bg-[#B89A5A] hover:bg-[#d4af37] active:scale-[0.99] text-[#080808] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#B89A5A]/10 flex items-center justify-center gap-2 group cursor-pointer font-sans"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>CREATING ACCOUNT...</span>
              </span>
            ) : (
              <>
                <span>CREATE AN ACCOUNT</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Navigation */}
        <div className="pt-4 border-t border-[#262626] text-center">
          <p className="text-xs text-[#A3A3A3] font-medium">
            Already have an account?{" "}
            <Link
              href={`/login?redirect=${encodeURIComponent(searchParams.get("redirect") || "/")}`}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
