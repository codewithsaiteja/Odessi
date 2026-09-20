"use client";

import { useEffect, useState } from "react";
import { growthApi, ReferralResponse } from "@/lib/api";
import { Share2, Copy, Check, Award, Gift, Sparkles, AlertCircle } from "lucide-react";

export default function AccountReferrals() {
  const [referral, setReferral] = useState<ReferralResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    growthApi.getMyReferralCode()
      .then(setReferral)
      .catch((err) => console.error("Failed to load referral details", err))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    if (!referral?.code) return;
    navigator.clipboard.writeText(referral.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500 font-mono">Loading referral details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest mb-1">
          <Gift className="w-3 h-3" /> Referral Program
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 uppercase tracking-tight">
          INVITE FRIENDS & EARN
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Share your exclusive Odessi.tfi invitation code with friends. Rewards qualify automatically upon successful order delivery.
        </p>
      </div>

      {/* Code Card */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
              YOUR PERSONAL REFERRAL CODE
            </span>
            <div className="text-3xl sm:text-4xl font-serif font-bold font-mono text-white tracking-widest mt-1">
              {referral?.code || "GENERATING..."}
            </div>
          </div>

          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "COPIED TO CLIPBOARD!" : "COPY REFERRAL CODE"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-stone-800 text-center sm:text-left">
          <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700/50">
            <span className="text-[10px] uppercase font-mono text-stone-400 block">Total Referees Registered</span>
            <span className="text-2xl font-serif font-bold font-mono text-white">{referral?.totalReferrals || 0}</span>
          </div>
          <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700/50">
            <span className="text-[10px] uppercase font-mono text-stone-400 block">Qualified Completed Orders</span>
            <span className="text-2xl font-serif font-bold font-mono text-amber-400">{referral?.qualifiedReferrals || 0}</span>
          </div>
        </div>
      </div>

      {/* Program Integrity Rules */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs text-stone-600">
        <div className="font-semibold text-stone-900 uppercase text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-700" /> Program Terms & Security
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-500">
          <li>Self-referral or matching accounts are automatically blocked by the validation engine.</li>
          <li>Qualifications are awarded strictly after referee payment is captured and verified by Razorpay.</li>
          <li>Cancelled or refunded orders invalidate referral credit.</li>
        </ul>
      </div>
    </div>
  );
}
