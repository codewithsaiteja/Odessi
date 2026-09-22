"use client";

import React, { useState } from "react";
import { apiPost } from "@/lib/api/client";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiPost("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("connect")) {
        setError("Unable to connect to the server. Please try again later.");
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold">
                EMAIL SENT
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border bg-emerald-950/70 text-emerald-300 border-emerald-800/80">
                <CheckCircle size={10} />
                Success
              </span>
            </div>

            <h1 style={{ color: "#F3F0E8" }} className="text-3xl sm:text-4xl font-serif font-bold text-[#F3F0E8] mb-2 tracking-tight">
              CHECK YOUR INBOX
            </h1>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-medium">
              Reset instructions have been sent if the account exists.
            </p>
          </div>

          <div className="bg-emerald-950/40 text-emerald-200 border border-emerald-800/60 px-4 py-4 rounded-2xl text-xs shadow-xs space-y-1">
            <div className="flex items-start gap-2.5">
              <Mail size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-emerald-300 mb-1">Reset Link Sent</p>
                <p className="text-emerald-200 leading-relaxed mb-2">
                  If an account exists for{" "}
                  <span className="font-bold text-white">{email}</span>, you will receive an
                  email with instructions to reset your password within a few minutes.
                </p>
                <p className="text-emerald-300/80">
                  Don&apos;t see it? Check your spam folder or promotions tab.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              style={{ backgroundColor: "#B89A5A", color: "#080808" }}
              className="w-full py-4 bg-[#B89A5A] hover:bg-[#d4af37] text-[#080808] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group cursor-pointer font-sans"
            >
              <span>RETURN TO SIGN IN</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="text-xs text-[#A3A3A3] hover:text-[#B89A5A] underline underline-offset-4 transition-colors font-medium cursor-pointer"
              >
                Try a different email address
              </button>
            </div>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold block mb-1">
            ACCOUNT RECOVERY
          </span>
          <h1 style={{ color: "#F3F0E8" }} className="text-3xl sm:text-4xl font-serif font-bold text-[#F3F0E8] mb-2 tracking-tight">
            FORGOT PASSWORD?
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-medium">
            Enter your email address and we&apos;ll send you a secure reset link.
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
              htmlFor="forgot-email"
              className="block text-xs font-bold uppercase tracking-wider text-[#D4D4D4] mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="forgot-email"
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
            <p className="text-[11px] text-[#A3A3A3] mt-2 leading-relaxed">
              For security, we won&apos;t reveal whether this email is registered with us.
            </p>
          </div>

          <button
            id="forgot-submit"
            type="submit"
            disabled={loading || !email.trim()}
            style={{ backgroundColor: "#B89A5A", color: "#080808" }}
            className="w-full py-4 bg-[#B89A5A] hover:bg-[#d4af37] text-[#080808] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 group cursor-pointer font-sans"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>SENDING...</span>
              </span>
            ) : (
              <>
                <span>SEND RESET LINK</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#262626] text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-[#A3A3A3] hover:text-[#B89A5A] transition-colors uppercase font-mono"
          >
            <ArrowLeft size={15} className="text-[#B89A5A]" />
            <span>BACK TO SIGN IN</span>
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
