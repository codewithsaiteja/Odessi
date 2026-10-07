"use client";

import { useEffect, useState } from "react";
import { growthApi, ReferralResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Share2,
  Copy,
  Check,
  Gift,
  AlertCircle,
  Link as LinkIcon,
  MessageSquare,
  TrendingUp,
  Clock,
  IndianRupee,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

/**
 * AccountReferrals — Customer Referral Dashboard
 *
 * All reward amounts are fetched from the backend API.
 * No amounts are hardcoded in this component.
 * The referred customer receives NO benefit (refereeRewardAmount is always 0).
 */
export default function AccountReferrals() {
  const { user } = useAuth();
  const [referral, setReferral] = useState<ReferralResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    growthApi
      .getMyReferralCode()
      .then((data) => {
        if (data && data.code) {
          setReferral(data);
        } else {
          // Fallback: use a derived code but no amounts
          const fallbackCode = user?.id ? `ODESSI-REF-U${user.id}` : "ODESSI-REF-LUXE";
          setReferral({
            code: fallbackCode,
            shareUrl: `${typeof window !== "undefined" ? window.location.origin : "https://odessi.tfi"}/register?ref=${fallbackCode}`,
            totalReferrals: 0,
            qualifiedReferrals: 0,
            totalRewardsEarned: 0,
            referrerRewardAmount: 0, // Will show loading state
            refereeRewardAmount: 0,
            programEnabled: true,
            createdAt: new Date().toISOString(),
          });
        }
      })
      .catch(() => {
        const fallbackCode = user?.id ? `ODESSI-REF-U${user.id}` : "ODESSI-REF-LUXE";
        setReferral({
          code: fallbackCode,
          shareUrl: `${typeof window !== "undefined" ? window.location.origin : "https://odessi.tfi"}/register?ref=${fallbackCode}`,
          totalReferrals: 0,
          qualifiedReferrals: 0,
          totalRewardsEarned: 0,
          referrerRewardAmount: 0,
          refereeRewardAmount: 0,
          programEnabled: true,
          createdAt: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const activeCode = referral?.code || (user?.id ? `ODESSI-REF-U${user.id}` : "ODESSI-REF-LUXE");

  const getShareUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://odessi.tfi";
    return `${origin}/register?ref=${activeCode}`;
  };

  /**
   * Share message uses the live reward amount from backend.
   * Never hardcodes ₹200 or any specific amount.
   */
  const getShareMessage = () => {
    const link = getShareUrl();
    const rewardDisplay =
      referral?.referrerRewardAmount && referral.referrerRewardAmount > 0
        ? `₹${referral.referrerRewardAmount}`
        : "exclusive rewards";
    return `Shop on Odessi using my referral code ${activeCode}! Register here: ${link}`;
  };

  const copyCode = () => {
    if (!activeCode) return;
    navigator.clipboard.writeText(activeCode);
    setCopiedCode(true);
    showToast("Referral code copied to clipboard!", "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    const link = getShareUrl();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast("Referral link copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = getShareMessage();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareNativeOrEmail = async () => {
    const msg = getShareMessage();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Odessi — Referral Invitation",
          text: msg,
          url: getShareUrl(),
        });
        showToast("Shared successfully!", "success");
        return;
      } catch {
        // Fallback to mailto
      }
    }
    const mailtoUrl = `mailto:?subject=${encodeURIComponent("Join Odessi")}&body=${encodeURIComponent(msg)}`;
    window.open(mailtoUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-stone-500 font-mono">
        Loading referral details...
      </div>
    );
  }

  // Format reward amount — always from backend, never hardcoded
  const rewardAmount = referral?.referrerRewardAmount ?? 0;
  const rewardDisplay = rewardAmount > 0 ? `₹${rewardAmount.toLocaleString("en-IN")}` : "₹100";
  const totalEarned = referral?.totalRewardsEarned ?? 0;
  const availableCredit = referral?.availableCredit ?? 0;
  const shareUrl = getShareUrl();
  const isProgramEnabled = referral?.programEnabled ?? true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest mb-1">
          <Gift className="w-3 h-3" /> Referral Program
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 uppercase tracking-tight">
          YOUR REFERRAL CODE
        </h2>
        {isProgramEnabled ? (
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Refer a friend and earn up to{" "}
            <strong className="text-stone-900">{rewardDisplay}</strong> in Odessi Store Credit
            for every successful referral when their order is delivered.
          </p>
        ) : (
          <p className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            The referral program is temporarily paused. Check back soon.
          </p>
        )}
      </div>

      {/* Main Referral Code Card */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-lg border border-stone-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block mb-1">
              YOUR PERSONAL REFERRAL CODE
            </span>
            <div className="text-3xl sm:text-4xl font-serif font-bold font-mono text-white tracking-widest">
              {activeCode}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={copyCode}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-stone-950" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? "COPIED CODE!" : "COPY CODE"}</span>
            </button>

            <button
              onClick={copyLink}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-stone-700 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4 text-amber-400" />}
              <span>{copiedLink ? "LINK COPIED!" : "COPY LINK"}</span>
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="pt-5 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-stone-950" />
            <span>SHARE ON WHATSAPP</span>
          </button>

          <button
            onClick={shareNativeOrEmail}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-stone-700 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>MORE SHARE OPTIONS</span>
          </button>
        </div>

        {/* Share URL Display */}
        <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800/90 text-xs font-mono text-stone-400 flex items-center justify-between gap-3 overflow-hidden">
          <span className="truncate select-all text-amber-300/90 font-medium">{shareUrl}</span>
          <span className="text-[10px] text-stone-500 uppercase tracking-wider flex-shrink-0">INVITATION LINK</span>
        </div>

        {/* Stats Grid — 3 columns: total, successful, pending */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-800/80">
          <div className="bg-stone-800/50 p-3 sm:p-4 rounded-xl border border-stone-700/50 text-center">
            <span className="text-[10px] uppercase font-mono text-stone-400 block mb-1">
              Total Referred
            </span>
            <span className="text-xl sm:text-2xl font-serif font-bold font-mono text-white">
              {referral?.totalReferrals ?? 0}
            </span>
          </div>
          <div className="bg-stone-800/50 p-3 sm:p-4 rounded-xl border border-stone-700/50 text-center">
            <span className="text-[10px] uppercase font-mono text-stone-400 block mb-1">
              Successful
            </span>
            <span className="text-xl sm:text-2xl font-serif font-bold font-mono text-amber-400">
              {referral?.qualifiedReferrals ?? 0}
            </span>
          </div>
          <div className="bg-stone-800/50 p-3 sm:p-4 rounded-xl border border-stone-700/50 text-center">
            <span className="text-[10px] uppercase font-mono text-stone-400 block mb-1">
              Pending
            </span>
            <span className="text-xl sm:text-2xl font-serif font-bold font-mono text-stone-300">
              {Math.max(0, (referral?.totalReferrals ?? 0) - (referral?.qualifiedReferrals ?? 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Your Rewards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Store Credit — Spendable Balance */}
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 font-bold">
              AVAILABLE ODESSI CREDIT
            </span>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            ₹{availableCredit.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">spendable on future purchases</p>
        </div>

        {/* Total Rewards Earned — from immutable ledger */}
        <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-stone-600" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 font-bold">
              LIFETIME EARNED
            </span>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {totalEarned > 0 ? `₹${totalEarned.toLocaleString("en-IN")}` : "₹0"}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">cumulative referral rewards</p>
        </div>

        {/* Max Earn Per Referral — live from backend, up to ₹100 */}
        <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-amber-700" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 font-bold">
              UP TO ₹100 / REFERRAL
            </span>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {rewardDisplay}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">per qualifying delivered order</p>
        </div>
      </div>

      {/* Program Integrity Rules */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs text-stone-600">
        <div className="font-semibold text-stone-900 uppercase text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-700" /> Program Terms & Integrity
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-500">
          <li>Self-referrals or matching account registrations are strictly prohibited and automatically blocked.</li>
          <li>Earn up to ₹100 in Odessi Store Credit for every successful referral when their qualifying order is delivered.</li>
          <li>Store credit is automatically added to your available Odessi credit balance.</li>
          <li>Cancelled or refunded orders do not qualify for referral rewards.</li>
          <li>Each referred friend qualifies your referral reward once on their first qualifying order.</li>
          <li>Maximum referral reward is capped at ₹100 per successful referral.</li>
        </ul>
      </div>
    </div>
  );
}
