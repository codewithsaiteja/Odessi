"use client";

import { useEffect, useState } from "react";
import { growthApi, ReferralResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { Share2, Copy, Check, Gift, Sparkles, AlertCircle, Link as LinkIcon, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AccountReferrals() {
  const { user } = useAuth();
  const [referral, setReferral] = useState<ReferralResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    growthApi.getMyReferralCode()
      .then((data) => {
        if (data && data.code) {
          setReferral(data);
        } else {
          // Fallback code if API response is empty
          const fallbackCode = user?.id ? `ODESSI-REF-U${user.id}` : `ODESSI-REF-LUXE200`;
          setReferral({
            code: fallbackCode,
            shareUrl: `${typeof window !== "undefined" ? window.location.origin : "https://odessi.tfi"}/register?ref=${fallbackCode}`,
            totalReferrals: 0,
            qualifiedReferrals: 0,
            createdAt: new Date().toISOString(),
          });
        }
      })
      .catch(() => {
        // Fallback code for offline demo / network issues
        const fallbackCode = user?.id ? `ODESSI-REF-U${user.id}` : `ODESSI-REF-LUXE200`;
        setReferral({
          code: fallbackCode,
          shareUrl: `${typeof window !== "undefined" ? window.location.origin : "https://odessi.tfi"}/register?ref=${fallbackCode}`,
          totalReferrals: 0,
          qualifiedReferrals: 0,
          createdAt: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const activeCode = referral?.code || (user?.id ? `ODESSI-REF-U${user.id}` : `ODESSI-REF-LUXE200`);

  const getShareUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://odessi.tfi";
    return `${origin}/register?ref=${activeCode}`;
  };

  const getShareMessage = () => {
    const link = getShareUrl();
    return `Join Odessi.tfi using my referral code ${activeCode} to get a ₹200 bonus on your first order! Register here: ${link}`;
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
          title: "Odessi.tfi Referral Invitation",
          text: msg,
          url: getShareUrl(),
        });
        showToast("Shared successfully!", "success");
        return;
      } catch {
        // Fallback to mailto if navigator.share fails or is cancelled
      }
    }

    // Fallback: Open mailto link
    const mailtoUrl = `mailto:?subject=${encodeURIComponent("Claim your ₹200 bonus on Odessi.tfi")}&body=${encodeURIComponent(msg)}`;
    window.open(mailtoUrl, "_blank");
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500 font-mono">Loading referral details...</div>;
  }

  const shareUrl = getShareUrl();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest mb-1">
          <Gift className="w-3 h-3" /> Referral Program
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 uppercase tracking-tight">
          INVITE FRIENDS & EARN ₹200
        </h2>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
          Share your exclusive referral code with friends. They receive a <strong>₹200 welcome bonus</strong> on their first order, and you earn <strong>₹200 reward credit</strong> once their first order is delivered!
        </p>
      </div>

      {/* Main Referral Code & Link Card */}
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

        {/* Share Action Buttons */}
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

        {/* Dynamic Share URL Display Box */}
        <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800/90 text-xs font-mono text-stone-400 flex items-center justify-between gap-3 overflow-hidden">
          <span className="truncate select-all text-amber-300/90 font-medium">{shareUrl}</span>
          <span className="text-[10px] text-stone-500 uppercase tracking-wider flex-shrink-0">INVITATION LINK</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-800/80 text-center sm:text-left">
          <div className="bg-stone-800/50 p-4 rounded-xl border border-stone-700/50">
            <span className="text-[10px] uppercase font-mono text-stone-400 block mb-1">Total Referees Registered</span>
            <span className="text-2xl sm:text-3xl font-serif font-bold font-mono text-white">{referral?.totalReferrals || 0}</span>
          </div>
          <div className="bg-stone-800/50 p-4 rounded-xl border border-stone-700/50">
            <span className="text-[10px] uppercase font-mono text-stone-400 block mb-1">Qualified Delivered Orders</span>
            <span className="text-2xl sm:text-3xl font-serif font-bold font-mono text-amber-400">{referral?.qualifiedReferrals || 0}</span>
          </div>
        </div>
      </div>

      {/* Reward Rules Highlight Banner */}
      <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 text-stone-900">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-700">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
            GIVE ₹200, GET ₹200 — HOW IT WORKS
          </h4>
          <p className="text-xs text-amber-800/90 leading-relaxed">
            Your friends get <strong>₹200 instant bonus discount</strong> on their first order when registering with your code. As soon as their first order payment is captured and verified, you earn <strong>₹200 reward credit</strong> in your account.
          </p>
        </div>
      </div>

      {/* Program Integrity Rules */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs text-stone-600">
        <div className="font-semibold text-stone-900 uppercase text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-700" /> Program Terms & Integrity
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-500">
          <li>Self-referrals or matching account registrations are automatically blocked.</li>
          <li>Qualifications are awarded strictly after referee payment is captured and verified by Razorpay.</li>
          <li>Cancelled or refunded orders invalidate referral bonus qualifications.</li>
        </ul>
      </div>
    </div>
  );
}
