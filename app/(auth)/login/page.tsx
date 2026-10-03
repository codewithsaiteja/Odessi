"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

function humanizeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("credentials") ||
    lower.includes("invalid") ||
    lower.includes("password") ||
    lower.includes("unauthorized") ||
    lower.includes("401")
  ) {
    return "Invalid email address or password. Please try again.";
  }
  if (lower.includes("verify") || lower.includes("unverified")) {
    return "Please verify your email address before signing in.";
  }
  if (lower.includes("disabled") || lower.includes("locked")) {
    return "Your account has been disabled. Please contact support.";
  }
  if (lower.includes("network") || lower.includes("connect")) {
    return "Unable to connect to the server. Please check your connection or try again later.";
  }
  return raw || "Authentication failed. Please check your credentials.";
}

function getSafeRedirect(url: string | null, userRole?: string): string {
  if (url && url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  if (userRole === "ADMIN") {
    return "/admin";
  }
  return "/";
}

function LoginContent() {
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirect = getSafeRedirect(searchParams.get("redirect"), user.role);
      router.replace(redirect);
    }
  }, [user, authLoading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const loggedInUser = await login({ email: cleanEmail, password });
      const redirect = getSafeRedirect(
        searchParams.get("redirect"),
        loggedInUser?.role || user?.role
      );
      router.push(redirect);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setError(humanizeError(msg));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <AuthShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
            ODISSI
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
            SIGN IN
          </h1>
          <p className="text-xs text-[#9C978E] leading-relaxed">
            Welcome back to Odessi. Enter your credentials to continue.
          </p>
        </div>

        {/* Inactivity Alert */}
        {searchParams.get("reason") === "inactivity" && !error && (
          <div
            className="bg-[#141414] text-[#EAE7DF] border border-[#2E2E2E] px-4 py-3 rounded-[2px] text-xs flex items-center gap-2.5"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={15} className="text-[#B89A5A] shrink-0" />
            <span>Your session expired due to inactivity. Please sign in again.</span>
          </div>
        )}

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

        {/* Main Sign-In Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email Input */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
            >
              Email Address
            </label>
            <input
              id="login-email"
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
              htmlFor="login-password"
              className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9C978E] mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-14 bg-[#101010] border border-[#222222] rounded-[2px] text-sm text-[#FAF9F6] placeholder:text-[#555555] focus:outline-none focus:border-[#9C978E] transition-colors disabled:opacity-50"
                placeholder="••••••••"
                disabled={loading}
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

            {/* Forgot Password Link */}
            <div className="flex justify-end mt-2">
              <Link
                href="/forgot-password"
                className="text-xs text-[#9C978E] hover:text-[#FAF9F6] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="login-submit"
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-sans"
              aria-busy={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>SIGNING IN...</span>
                </span>
              ) : (
                "SIGN IN"
              )}
            </button>
          </div>
        </form>

        {/* Account Registration Link */}
        <div className="pt-6 border-t border-[#171717] text-center text-xs text-[#9C978E]">
          <span>New to Odessi? </span>
          <Link
            href="/register"
            className="text-[#FAF9F6] hover:underline underline-offset-4 font-medium transition-colors ml-1"
          >
            Create account
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
