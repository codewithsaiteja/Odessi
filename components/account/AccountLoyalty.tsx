"use client";

import { useEffect, useState } from "react";
import { growthApi, LoyaltyAccountResponse } from "@/lib/api";
import { Crown, Sparkles, ShieldCheck, Star } from "lucide-react";

export default function AccountLoyalty() {
  const [loyalty, setLoyalty] = useState<LoyaltyAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    growthApi.getLoyaltyStatus()
      .then(setLoyalty)
      .catch((err) => console.error("Failed to load loyalty status", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500 font-mono">Loading membership status...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#B89A5A]/10 text-[#B89A5A] text-[10px] font-bold uppercase tracking-widest mb-1">
          <Crown className="w-3.5 h-3.5" /> Loyalty & Membership
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 uppercase tracking-tight">
          ODESSI CLUB
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Exclusive access tier, private drop allocations, and membership status.
        </p>
      </div>

      {/* Loyalty Status Card */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-lg border border-stone-800">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
              CURRENT MEMBERSHIP STATUS
            </span>
            <div className="text-3xl sm:text-4xl font-serif font-bold text-amber-400 tracking-wider mt-1 flex items-center gap-2">
              <Crown className="w-8 h-8 text-amber-400" />
              {loyalty?.tier || "STANDARD"}
            </div>
          </div>

          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full">
            {loyalty?.status || "ACTIVE"}
          </span>
        </div>

        <div className="pt-4 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between font-mono">
          <span>Member Since:</span>
          <span className="text-white">
            {loyalty?.joinedAt ? new Date(loyalty.joinedAt).toLocaleDateString() : "Active Account"}
          </span>
        </div>
      </div>

      {/* Tier Foundation Overview */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-600" /> Member Privileges Overview
        </h4>
        <p className="text-xs text-stone-600 leading-relaxed">
          As an Odessi Club <strong>{loyalty?.tier || "STANDARD"}</strong> member, your account is automatically registered for priority notification queues, early drop announcements, and concierge support.
        </p>
      </div>
    </div>
  );
}
