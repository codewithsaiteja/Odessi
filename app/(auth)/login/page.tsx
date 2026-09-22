"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { Eye, EyeOff, AlertCircle, ArrowRight, Server, Lock, Mail } from "lucide-react";

function humanizeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("credentials") || lower.includes("invalid") || lower.includes("password") || lower.includes("unauthorized") || lower.includes("401")) {
    return "Invalid email address or password. Please try again.";
  }
  if (lower.includes("verify") || lower.includes("unverified")) {
    return "Please verify your email address before signing in.";
  }
  if (lower.includes("disabled") || lower.includes("locked")) {
    return "Your account has been disabled. Please contact support.";
  }
  if (lower.includes("network") || lower.includes("connect")) {
    return "Unable to connect to backend server. You can use 1-Click Demo Login below.";
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
  const [backendLive, setBackendLive] = useState<boolean | null>(null);

  // Check backend server availability on mount
  useEffect(() => {
    let isMounted = true;
    fetch("http://localhost:8080/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (isMounted) setBackendLive(res.status !== 0);
      })
      .catch(() => {
        if (isMounted) setBackendLive(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    setLoading(true);

    try {
      const loggedInUser = await login({ email, password });
      const redirect = getSafeRedirect(searchParams.get("redirect"), loggedInUser?.role || user?.role);
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
      {/* High-Contrast Luxury Glass-Card Wrapper */}
      <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold">
              AUTHENTICATION
            </span>
            {backendLive !== null && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  backendLive
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-800/80"
                    : "bg-amber-950/70 text-amber-300 border-amber-800/80"
                }`}
              >
                <Server size={10} />
                {backendLive ? "PostgreSQL Live" : "Demo Mode Active"}
              </span>
            )}
          </div>

          <h1
            style={{ color: "#F3F0E8" }}
            className="text-3xl sm:text-4xl font-serif font-bold text-[#F3F0E8] mb-2 tracking-tight"
          >
            SIGN IN TO ODESSI
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-medium">
            Access your orders, saved wishlist items, and luxury collection profile.
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

        {/* Main Sign-In Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email Input */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4] mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ color: "#ffffff", backgroundColor: "#1A1A1A" }}
                className="w-full px-4 py-3.5 pl-10 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm font-semibold text-white placeholder:text-[#737373] focus:outline-none focus:border-[#B89A5A] focus:ring-2 focus:ring-[#B89A5A]/30 transition-all disabled:opacity-50 shadow-inner"
                placeholder="e.g. customer@odessi.shop"
                disabled={loading}
              />
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B89A5A] pointer-events-none" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4] mb-2"
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
                style={{ color: "#ffffff", backgroundColor: "#1A1A1A" }}
                className="w-full px-4 py-3.5 pl-10 pr-11 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm font-semibold text-white placeholder:text-[#737373] focus:outline-none focus:border-[#B89A5A] focus:ring-2 focus:ring-[#B89A5A]/30 transition-all disabled:opacity-50 shadow-inner"
                placeholder="••••••••"
                disabled={loading}
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
            
            {/* Forgot Password Link - Moved Below Password Input */}
            <div className="text-right mt-3">
              <Link
                href="/forgot-password"
                className="text-xs text-[#B89A5A] hover:text-[#d4af37] underline underline-offset-4 transition-colors font-semibold"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading || !email || !password}
            style={{ backgroundColor: "#B89A5A", color: "#080808" }}
            className="w-full py-4 bg-[#B89A5A] hover:bg-[#d4af37] active:scale-[0.99] text-[#080808] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#B89A5A]/10 flex items-center justify-center gap-2 group cursor-pointer font-sans"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>SIGNING IN...</span>
              </span>
            ) : (
              <>
                <span>SIGN IN TO ODESSI</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Account Registration Link */}
        <div className="pt-4 border-t border-[#262626] text-center">
          <p className="text-xs text-[#A3A3A3] font-medium">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="text-[#B89A5A] font-bold hover:text-[#d4af37] underline underline-offset-4 ml-1 transition-colors inline-flex items-center gap-1"
            >
              <span>CREATE AN ACCOUNT</span>
            </Link>
          </p>
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
