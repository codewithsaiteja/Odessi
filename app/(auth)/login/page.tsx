"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, UserCheck, Sparkles, Server } from "lucide-react";

function humanizeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("credentials") || lower.includes("invalid") || lower.includes("password") || lower.includes("unauthorized") || lower.includes("401")) {
    return "Invalid email address or password.";
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
  return raw || "Authentication failed. Please try again.";
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

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login({ email: demoEmail, password: demoPass });
      const redirect = getSafeRedirect(searchParams.get("redirect"), loggedInUser?.role);
      router.push(redirect);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      setError(humanizeError(msg));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <AuthShell>
      {/* Editorial Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-semibold">
            AUTHENTICATION
          </span>
          {backendLive !== null && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                backendLive
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
                  : "bg-amber-950/40 text-amber-400 border-amber-800/60"
              }`}
            >
              <Server size={10} />
              {backendLive ? "PostgreSQL Backend Live" : "Demo Mode Active"}
            </span>
          )}
        </div>

        <h1 className="type-h1 text-[#080808] font-serif text-3xl sm:text-4xl mb-2">
          SIGN IN TO ODESSI
        </h1>
        <p className="text-xs sm:text-sm text-[#7A7A7A] leading-relaxed">
          Access your orders, saved wishlist items, and luxury collection profile.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="bg-red-50 text-red-800 border border-red-200 px-4 py-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 mb-6 animate-fade-in shadow-xs"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1-Click Quick Login Options */}
      <div className="mb-6 p-4 bg-[#F7F5F0] border border-[#E8E8E8] rounded-xl">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#080808] font-bold mb-3">
          <Sparkles size={12} className="text-[#B89A5A]" />
          <span>Quick 1-Click Test Sign-In</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickLogin("admin@odessi.shop", "admin123")}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-2.5 bg-white border border-[#E8E8E8] hover:border-[#B89A5A] hover:bg-[#080808] hover:text-white rounded-lg text-xs font-semibold text-[#080808] transition-all group shadow-2xs"
          >
            <ShieldCheck size={14} className="text-amber-500 group-hover:text-amber-400" />
            <span>Admin Demo</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("customer@odessi.shop", "customer123")}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-2.5 bg-white border border-[#E8E8E8] hover:border-[#080808] hover:bg-[#080808] hover:text-white rounded-lg text-xs font-semibold text-[#080808] transition-all group shadow-2xs"
          >
            <UserCheck size={14} className="text-blue-500 group-hover:text-blue-400" />
            <span>Customer Demo</span>
          </button>
        </div>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Email Input */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold uppercase tracking-wider text-[#080808] mb-2"
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
            className="w-full px-4 py-3.5 bg-white border border-[#E8E8E8] rounded-xl text-sm text-[#080808] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#B89A5A] focus:ring-1 focus:ring-[#B89A5A] transition-all disabled:opacity-50"
            placeholder="e.g. customer@odessi.shop"
            disabled={loading}
          />
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#080808]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#7A7A7A] hover:text-[#080808] underline underline-offset-4 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 pr-11 bg-white border border-[#E8E8E8] rounded-xl text-sm text-[#080808] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#B89A5A] focus:ring-1 focus:ring-[#B89A5A] transition-all disabled:opacity-50"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#7A7A7A] hover:text-[#080808] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="login-submit"
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-4 bg-[#080808] hover:bg-[#2C2C2C] active:bg-black text-white text-xs font-semibold tracking-[0.2em] uppercase rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 group"
          aria-busy={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>SIGNING IN...</span>
            </span>
          ) : (
            <>
              <span>SIGN IN</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Account Registration Link */}
      <div className="mt-8 pt-6 border-t border-[#E8E8E8] text-center">
        <p className="text-xs text-[#7A7A7A]">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="text-[#080808] font-semibold hover:underline underline-offset-4 ml-1 transition-colors inline-flex items-center gap-1"
          >
            <span>CREATE AN ACCOUNT</span>
          </Link>
        </p>
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
