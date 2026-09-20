"use client";

import { useState } from "react";
import { X, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { growthApi } from "@/lib/api";

interface BackInStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  variantId: number;
  variantSku: string;
}

export function BackInStockModal({
  isOpen,
  onClose,
  productId,
  productName,
  variantId,
  variantSku,
}: BackInStockModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await growthApi.subscribeBackInStock({
        productId,
        variantId,
        email: email.trim().toLowerCase(),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xl animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-14 h-14 text-[#B89A5A] mx-auto animate-bounce" />
            <h3 className="text-2xl font-serif font-bold uppercase tracking-tight text-[#0A0A0A]">
              NOTIFIED!
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-xs mx-auto">
              We have saved your alert request for <strong>{productName}</strong> ({variantSku}). As soon as stock is replenished, we will notify <strong>{email}</strong>.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-3 bg-[#0A0A0A] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Back to Product
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2 text-[#B89A5A] text-xs font-semibold uppercase tracking-widest">
              <Bell className="w-4 h-4" />
              Restock Notification
            </div>
            <h3 className="text-2xl font-serif font-bold uppercase tracking-tight text-[#0A0A0A] mb-1">
              NOTIFY ME WHEN AVAILABLE
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Enter your email to receive an instant priority notification when this specific variant restocks.
            </p>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 mb-5 text-xs">
              <span className="text-neutral-500">Item: </span>
              <span className="font-semibold text-[#0A0A0A]">{productName}</span>
              <span className="text-neutral-400 font-mono ml-2">({variantSku})</span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@domain.com"
                  className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0A0A0A] hover:bg-[#171717] text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Saving Subscription..." : "NOTIFY ME ON RESTOCK →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
