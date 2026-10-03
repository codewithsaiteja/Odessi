"use client";

import React, { useState } from "react";
import { apiPost } from "@/lib/api/client";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AlertCircle } from "lucide-react";

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
        <div className="space-y-8">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
              ODISSI
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
              CHECK YOUR INBOX
            </h1>
            <p className="text-xs text-[#9C978E] leading-relaxed">
              Password reset instructions have been dispatched.
            </p>
          </div>

          <div className="bg-[#101010] border border-[#222222] rounded-[2px] p-5 text-xs text-[#9C978E] space-y-2">
            <p className="text-[#FAF9F6] font-medium">Reset link dispatched</p>
            <p className="leading-relaxed">
              If an account is associated with{" "}
              <span className="text-[#FAF9F6] font-medium">{email}</span>, you will receive an
              email with a secure reset link shortly.
            </p>
            <p className="text-[#737373] text-[11px] pt-1">
              If it does not appear within a few moments, please check your spam folder.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/login"
              className="w-full py-3.5 px-6 bg-[#F3F0E8] text-[#080808] hover:bg-white active:bg-[#E5E0D5] text-xs font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors duration-200 flex items-center justify-center cursor-pointer font-sans"
            >
              RETURN TO SIGN IN
            </Link>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="text-xs text-[#9C978E] hover:text-[#FAF9F6] underline underline-offset-4 transition-colors cursor-pointer"
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
      <div className="space-y-8">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono block mb-2">
            ODISSI
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#F3F0E8] font-normal tracking-tight mb-2">
            FORGOT PASSWORD
          </h1>
          <p className="text-xs text-[#9C978E] leading-relaxed">
            Enter your registered email address and we will send you a secure link to reset your password.
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

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                  <span>SENDING...</span>
                </span>
              ) : (
                "SEND RESET LINK"
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
