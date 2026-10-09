"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  sellerApi,
  SellerResponse,
  SellerDashboardResponse,
  SellerMilestoneConfigResponse,
  SellerRewardResponse,
  SellerRewardClaimRequest,
} from "@/lib/api/seller";
import { useToast } from "@/components/ui/Toast";
import {
  Crown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Gift,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Truck,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Package,
} from "lucide-react";

export default function AccountSeller() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [sellerStatus, setSellerStatus] = useState<SellerResponse | null>(null);
  const [dashboard, setDashboard] = useState<SellerDashboardResponse | null>(null);

  // Application form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialChannel, setSocialChannel] = useState("");
  const [applicationReason, setApplicationReason] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [reapplyMode, setReapplyMode] = useState(false);

  // Reward claim modal state
  const [selectedRewardToClaim, setSelectedRewardToClaim] = useState<SellerRewardResponse | null>(null);
  const [claimFullName, setClaimFullName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimAddress1, setClaimAddress1] = useState("");
  const [claimAddress2, setClaimAddress2] = useState("");
  const [claimCity, setClaimCity] = useState("");
  const [claimState, setClaimState] = useState("");
  const [claimPostalCode, setClaimPostalCode] = useState("");
  const [claimTshirtSize, setClaimTshirtSize] = useState("L");
  const [claiming, setClaiming] = useState(false);

  // Copy feedbacks
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Pre-fill user data when user is loaded
  useEffect(() => {
    if (user) {
      setFullName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
      setEmail(user.email || "");
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const loadSellerData = useCallback(async () => {
    setLoading(true);
    try {
      const statusRes = await sellerApi.getStatus();
      setSellerStatus(statusRes);

      if (statusRes && statusRes.status === "APPROVED") {
        const dashRes = await sellerApi.getDashboard();
        setDashboard(dashRes);
      }
    } catch (err: any) {
      console.error("Failed to load seller status", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSellerData();
  }, [loadSellerData]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeToTerms) {
      toast.error("Please agree to the Trusted Sellers Program terms.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please provide your contact phone number.");
      return;
    }
    if (!socialChannel.trim()) {
      toast.error("Please enter your primary social media handle or promotional channel.");
      return;
    }
    if (!applicationReason.trim()) {
      toast.error("Please tell us why you would like to join the program.");
      return;
    }

    setSubmittingApp(true);
    try {
      const res = await sellerApi.apply({
        fullName,
        email,
        phone,
        socialChannel,
        applicationReason,
        agreeToTerms,
      });
      setSellerStatus(res);
      setReapplyMode(false);
      toast.success("Application submitted successfully! Our team will review it shortly.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Seller code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = (code: string) => {
    if (!code) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://odessi.shop";
    const link = `${origin}?seller=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Tracked seller link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenClaimModal = (reward: SellerRewardResponse) => {
    setSelectedRewardToClaim(reward);
    setClaimFullName(sellerStatus?.fullName || (user ? `${user.firstName} ${user.lastName}`.trim() : ""));
    setClaimPhone(sellerStatus?.phone || "");
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRewardToClaim) return;
    if (!claimFullName.trim() || !claimPhone.trim() || !claimAddress1.trim() || !claimCity.trim() || !claimPostalCode.trim()) {
      toast.error("Please fill in all required shipping address fields.");
      return;
    }

    setClaiming(true);
    try {
      const payload: SellerRewardClaimRequest = {
        shippingFullName: claimFullName,
        shippingPhone: claimPhone,
        shippingAddressLine1: claimAddress1,
        shippingAddressLine2: claimAddress2 || undefined,
        shippingCity: claimCity,
        shippingState: claimState || "Telangana",
        shippingPostalCode: claimPostalCode,
        tshirtSize: claimTshirtSize,
      };

      await sellerApi.claimReward(selectedRewardToClaim.id, payload);
      toast.success("Reward claimed successfully! Our logistics team will process shipment.");
      setSelectedRewardToClaim(null);
      await loadSellerData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit claim. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-2 border-[#B89A5A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs uppercase tracking-widest text-stone-500 font-mono">
          Loading Seller Portal...
        </p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 1: APPROVED SELLER — FULL LIVE DASHBOARD (Screenshots 1 & 3)
  // ──────────────────────────────────────────────────────────────────────────
  if (sellerStatus && sellerStatus.status === "APPROVED" && dashboard) {
    const verifiedSales = dashboard.verifiedSales;
    const nextMilestone = dashboard.nextMilestone;
    const currentMilestone = dashboard.currentMilestone;
    const targetThreshold = nextMilestone ? nextMilestone.qualifyingSalesThreshold : (currentMilestone ? currentMilestone.qualifyingSalesThreshold : 10);
    const progressPercent = dashboard.progressPercent;
    const remainingSales = dashboard.remainingSalesToNextMilestone;
    const sellerCode = dashboard.seller.sellerCode;

    return (
      <div className="space-y-8">
        {/* Top Header Card — Primary visual from Screenshot 1 & 3 */}
        <div className="bg-[#0D0F15] border border-[#232836] rounded-2xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#B89A5A]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header Row */}
          <div className="flex items-center justify-between pb-6 border-b border-[#1C2230]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#B89A5A]/15 border border-[#B89A5A]/40 flex items-center justify-center text-[#B89A5A] shadow-inner">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#B89A5A] font-semibold block">
                  ODESSI REWARDS
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                  TRUSTED SELLERS PROGRAM
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
          </div>

          {/* Main Progress Block — Screenshot 1 exact visual hierarchy */}
          <div className="mt-7 space-y-3">
            <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400 font-semibold block">
              YOUR VERIFIED SALES
            </span>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                {verifiedSales}
              </span>
              <span className="text-lg text-slate-400 font-medium">
                / {targetThreshold} sales
              </span>
            </div>

            {/* Custom Gold Progress Bar */}
            <div className="w-full bg-[#1A1F2C] rounded-full h-2.5 overflow-hidden border border-[#2A3246]/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#B89A5A] via-[#D4AF37] to-[#F3D58C] transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 pt-1 font-sans">
              {nextMilestone ? (
                <>
                  <span className="text-[#E5C378] font-semibold">{remainingSales} more qualifying sales</span> to unlock your next reward.
                </>
              ) : (
                <span className="text-emerald-400 font-semibold">
                  Congratulations! You have unlocked all elite ambassador tiers.
                </span>
              )}
            </p>
          </div>

          {/* Next Milestone Sub-Card — Screenshot 1 */}
          {nextMilestone && (
            <div className="mt-6 bg-[#141823] border border-[#22293A] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-[#0A0D14] border border-[#2B344A] flex items-center justify-center shrink-0 text-[#B89A5A] overflow-hidden">
                  <Gift className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#B89A5A] font-semibold block">
                    NEXT MILESTONE
                  </span>
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {nextMilestone.milestoneName}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {nextMilestone.qualifyingSalesThreshold} verified sales &bull; {nextMilestone.rewardTitle}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-[#1E2536] border border-[#2E3952] text-slate-300 text-xs font-semibold rounded-full uppercase tracking-wider shrink-0">
                In progress
              </span>
            </div>
          )}

          {/* Seller Attribution Tools */}
          <div className="mt-7 pt-6 border-t border-[#1C2230] grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141823] border border-[#22293A] rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-semibold">
                  Your Unique Seller Code
                </span>
                <span className="font-mono text-base font-bold text-[#E5C378] tracking-wider">
                  {sellerCode}
                </span>
              </div>
              <button
                onClick={() => handleCopyCode(sellerCode)}
                className="px-3 py-1.5 bg-[#1F2536] hover:bg-[#2A334A] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? "Copied" : "Copy Code"}
              </button>
            </div>

            <div className="bg-[#141823] border border-[#22293A] rounded-xl p-4 flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-semibold">
                  Tracked Storefront Link
                </span>
                <span className="text-xs font-mono text-slate-300 truncate block">
                  odessi.shop/?seller={sellerCode}
                </span>
              </div>
              <button
                onClick={() => handleCopyLink(sellerCode)}
                className="px-3 py-1.5 bg-[#B89A5A] hover:bg-[#A3864A] text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copiedLink ? "Copied" : "Share Link"}
              </button>
            </div>
          </div>
        </div>

        {/* Unlocked & Claimed Rewards Shelf */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" /> Earned Physical Rewards & Gifts
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Physical merchandise rewards unlocked through your verified sales milestones.
              </p>
            </div>
            <span className="text-xs font-mono bg-stone-100 px-2.5 py-1 rounded text-stone-700 font-semibold">
              {dashboard.rewards.length} Unlocked
            </span>
          </div>

          {dashboard.rewards.length === 0 ? (
            <div className="py-10 text-center text-stone-500 text-xs">
              <Package className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="font-semibold text-stone-700">No milestone rewards unlocked yet.</p>
              <p className="text-[11px] text-stone-400 mt-1">
                Reach {nextMilestone ? nextMilestone.qualifyingSalesThreshold : 10} verified sales to unlock your first physical gift.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboard.rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-5 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">
                        {reward.milestoneNameSnapshot}
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm mt-0.5">
                        {reward.rewardTitleSnapshot}
                      </h4>
                      <p className="text-xs text-stone-600 mt-1">
                        {reward.rewardDescriptionSnapshot}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                        reward.status === "UNLOCKED"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : reward.status === "CLAIMED"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : reward.status === "APPROVED"
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : reward.status === "SHIPPED"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                          : "bg-emerald-100 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      {reward.status === "UNLOCKED"
                        ? "Ready to Claim"
                        : reward.status === "CLAIMED"
                        ? "Claimed"
                        : reward.status === "APPROVED"
                        ? "Approved"
                        : reward.status === "SHIPPED"
                        ? "Dispatched"
                        : "Delivered"}
                    </span>
                  </div>

                  {/* Shipment Tracking details if dispatched */}
                  {reward.status === "SHIPPED" && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                        <Truck className="w-3.5 h-3.5" /> Dispatched via {reward.shippingCarrier || "Courier"}
                      </div>
                      <div className="font-mono text-[11px] text-indigo-800">
                        Tracking: <span className="font-bold">{reward.trackingNumber || "N/A"}</span>
                      </div>
                      {reward.trackingUrl && (
                        <a
                          href={reward.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:underline font-semibold mt-1"
                        >
                          Track Package <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {reward.status === "DELIVERED" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Reward successfully delivered. Enjoy your ODESSI merchandise!</span>
                    </div>
                  )}

                  {reward.status === "UNLOCKED" && (
                    <button
                      onClick={() => handleOpenClaimModal(reward)}
                      className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <Gift className="w-3.5 h-3.5 text-amber-300" /> Claim Physical Reward
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestone Roadmap Progression (Screenshot 2) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="pb-4 border-b border-stone-200 mb-6">
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              Trusted Sellers Progression Roadmap
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Accumulate verified customer orders using your seller code to progress through each tier.
            </p>
          </div>

          <div className="space-y-4">
            {dashboard.milestones.map((milestone) => {
              const isAchieved = verifiedSales >= milestone.qualifyingSalesThreshold;
              const isCurrent =
                nextMilestone?.id === milestone.id ||
                (!nextMilestone && isAchieved && currentMilestone?.id === milestone.id);

              return (
                <div
                  key={milestone.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isAchieved
                      ? "bg-amber-50/50 border-amber-200"
                      : isCurrent
                      ? "bg-stone-900 text-white border-stone-800 shadow-md"
                      : "bg-stone-50 border-stone-200 text-stone-700 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${
                        isAchieved
                          ? "bg-amber-500 text-stone-950 border-amber-600 font-bold"
                          : isCurrent
                          ? "bg-[#1E2536] text-[#B89A5A] border-[#2A344A]"
                          : "bg-white text-stone-400 border-stone-200"
                      }`}
                    >
                      {isAchieved ? <CheckCircle2 className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
                            isCurrent ? "text-[#B89A5A]" : isAchieved ? "text-amber-800" : "text-stone-400"
                          }`}
                        >
                          Level {milestone.tierLevel}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isCurrent
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                              : isAchieved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {milestone.qualifyingSalesThreshold} sales
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base mt-0.5">
                        {milestone.milestoneName}
                      </h4>
                      <p className={`text-xs mt-0.5 ${isCurrent ? "text-slate-300" : "text-stone-600"}`}>
                        {milestone.rewardDescription}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-auto">
                    {isAchieved ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Unlocked
                      </span>
                    ) : isCurrent ? (
                      <span className="text-xs font-bold text-[#E5C378] flex items-center gap-1">
                        In Progress &bull; {remainingSales} left
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400 font-medium">Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim Reward Modal Dialog */}
        {selectedRewardToClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-stone-200 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold block">
                    Claim Physical Gift Reward
                  </span>
                  <h3 className="font-bold text-stone-900 text-lg sm:text-xl font-serif">
                    {selectedRewardToClaim.rewardTitleSnapshot}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Please provide your delivery shipping address and apparel size.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRewardToClaim(null)}
                  className="text-stone-400 hover:text-stone-800 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={claimFullName}
                    onChange={(e) => setClaimFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                    Contact Phone Number (for delivery courier) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={claimPhone}
                    onChange={(e) => setClaimPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                    Shipping Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House/Flat No., Building, Street"
                    value={claimAddress1}
                    onChange={(e) => setClaimAddress1(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Landmark, Area"
                    value={claimAddress2}
                    onChange={(e) => setClaimAddress2(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={claimCity}
                      onChange={(e) => setClaimCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                      Postal / PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={claimPostalCode}
                      onChange={(e) => setClaimPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                    Apparel / T-shirt Size (if applicable)
                  </label>
                  <select
                    value={claimTshirtSize}
                    onChange={(e) => setClaimTshirtSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
                  >
                    <option value="S">Small (S)</option>
                    <option value="M">Medium (M)</option>
                    <option value="L">Large (L)</option>
                    <option value="XL">Extra Large (XL)</option>
                    <option value="XXL">Double Extra Large (XXL)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRewardToClaim(null)}
                    className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claiming}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {claiming ? "Submitting..." : "Confirm & Submit Claim"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 2: PENDING REVIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (sellerStatus && sellerStatus.status === "PENDING") {
    return (
      <div className="space-y-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-amber-800 block">
                Application Status: Pending Review
              </span>
              <h2 className="text-xl font-bold text-amber-950 font-serif mt-1">
                Your Trusted Seller Application is Under Review
              </h2>
              <p className="text-xs text-amber-900/80 mt-2 leading-relaxed">
                Thank you for applying to become an ODESSI Trusted Seller. Our team is currently reviewing your application and social channels. You will be notified once a decision has been reached.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-amber-800/70 block text-[10px] uppercase font-semibold">Applicant</span>
              <span className="font-semibold text-amber-950">{sellerStatus.fullName}</span>
            </div>
            <div>
              <span className="text-amber-800/70 block text-[10px] uppercase font-semibold">Social / Channel</span>
              <span className="font-mono text-amber-950">{sellerStatus.socialChannel}</span>
            </div>
            <div>
              <span className="text-amber-800/70 block text-[10px] uppercase font-semibold">Submitted On</span>
              <span className="text-amber-950">
                {new Date(sellerStatus.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Milestone roadmap preview */}
        <MilestoneTiersPreview />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 3: SUSPENDED
  // ──────────────────────────────────────────────────────────────────────────
  if (sellerStatus && sellerStatus.status === "SUSPENDED") {
    return (
      <div className="space-y-6">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 text-rose-800 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-rose-800 block">
                Account Status: Suspended
              </span>
              <h2 className="text-xl font-bold text-rose-950 font-serif mt-1">
                Seller Account Suspended
              </h2>
              <p className="text-xs text-rose-900/80 mt-2 leading-relaxed">
                Your seller privileges have been temporarily suspended. New orders will not be attributed to your code while suspended.
              </p>
              {sellerStatus.suspensionReason && (
                <div className="mt-3 p-3 bg-white/80 border border-rose-200 rounded-lg text-xs text-rose-900 font-mono">
                  Reason: {sellerStatus.suspensionReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 4: REJECTED (allows reapplication)
  // ──────────────────────────────────────────────────────────────────────────
  if (sellerStatus && sellerStatus.status === "REJECTED" && !reapplyMode) {
    return (
      <div className="space-y-8">
        <div className="bg-stone-50 border border-stone-300 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-stone-200 text-stone-700 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-stone-600 block">
                Application Status: Declined
              </span>
              <h2 className="text-xl font-bold text-stone-900 font-serif mt-1">
                Application Not Approved at This Time
              </h2>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Thank you for your interest in representing ODESSI. We were unable to approve your application based on our current seller network criteria.
              </p>
              {sellerStatus.rejectionReason && (
                <div className="mt-3 p-3 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 font-mono">
                  Feedback from Reviewer: {sellerStatus.rejectionReason}
                </div>
              )}
              <div className="mt-5">
                <button
                  onClick={() => setReapplyMode(true)}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition"
                >
                  Update Application & Reapply
                </button>
              </div>
            </div>
          </div>
        </div>

        <MilestoneTiersPreview />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 5: NOT APPLIED (or Reapplying) — Application Form & Program Presentation
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">
      {/* Hero Presentation */}
      <div className="bg-[#0B0E14] border border-[#1E2536] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#B89A5A]/20 border border-[#B89A5A]/40 flex items-center justify-center text-[#B89A5A]">
            <Crown className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#B89A5A] font-semibold">
            ODESSI CREATOR & TRUSTED SELLERS NETWORK
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif mt-2">
          Promote ODESSI. Unlock Exclusive Merchandise.
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          The ODESSI Trusted Sellers Program invites content creators, community leaders, and streetwear advocates to share authentic cinematic apparel. Earn qualifying sales to receive physical gifts, exclusive limited drops, and brand ambassador recognition.
        </p>
      </div>

      {/* 4 Milestone Tiers Roadmap (Screenshot 2) */}
      <MilestoneTiersPreview />

      {/* Application Form */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="pb-4 border-b border-stone-200 mb-6">
          <h3 className="text-lg font-bold text-stone-900 font-serif">
            {reapplyMode ? "Update & Re-submit Application" : "Apply to Become a Trusted Seller"}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Fill out your details below. Applications are reviewed manually by the ODESSI team.
          </p>
        </div>

        <form onSubmit={handleApply} className="space-y-5 text-xs max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sai Teja"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                Contact Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                Primary Social / Promotional Channel *
              </label>
              <input
                type="text"
                required
                value={socialChannel}
                onChange={(e) => setSocialChannel(e.target.value)}
                placeholder="@instagram, YouTube channel, TikTok, or community"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
              Why do you want to represent ODESSI? *
            </label>
            <textarea
              rows={4}
              required
              value={applicationReason}
              onChange={(e) => setApplicationReason(e.target.value)}
              placeholder="Tell us about your audience, why you love ODESSI's cinematic designs, and how you plan to promote the brand..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500"
            />
          </div>

          {/* Program terms checkbox */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-0.5 rounded text-stone-900 focus:ring-0"
              />
              <span className="text-stone-700 text-xs leading-relaxed">
                I agree to the ODESSI Trusted Sellers Program terms and conditions. I understand that qualifying sales require real, paid, and completed customer orders. Self-referrals and fraudulent orders are disqualified.
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submittingApp}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-xs disabled:opacity-50"
            >
              {submittingApp ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            {reapplyMode && (
              <button
                type="button"
                onClick={() => setReapplyMode(false)}
                className="px-4 py-2.5 text-stone-600 hover:text-stone-900 text-xs font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 4 Milestone Tiers presentation matching Screenshot 2
 */
function MilestoneTiersPreview() {
  const TIERS = [
    {
      level: 1,
      title: "Rising Seller",
      sales: "10 successful sales",
      reward: "ODISSI appreciation certificate + exclusive sticker pack.",
    },
    {
      level: 2,
      title: "Trusted Seller",
      sales: "25 successful sales",
      reward: "One exclusive ODESSI T-shirt as a gift.",
    },
    {
      level: 3,
      title: "Elite Seller",
      sales: "50 successful sales",
      reward: "One exclusive ODESSI hoodie + a trusted seller badge.",
    },
    {
      level: 4,
      title: "ODISSI Brand Ambassador",
      sales: "100 successful sales",
      reward: "Exclusive premium gift box, ambassador recognition, and early access to new drops.",
    },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="pb-4 border-b border-stone-200 mb-6">
        <h3 className="text-lg font-bold text-stone-900 font-serif">
          ODESSI Trusted Sellers Program Milestones
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Progress through tiers by generating attributable sales. All physical merchandise rewards include complimentary shipping.
        </p>
      </div>

      <div className="space-y-4">
        {TIERS.map((tier) => (
          <div
            key={tier.level}
            className="p-5 rounded-xl border border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-stone-900 text-[#B89A5A] border border-stone-800 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                    Level {tier.level} &mdash; {tier.title}
                  </h4>
                </div>
                <div className="mt-1">
                  <span className="inline-block px-2.5 py-0.5 bg-stone-200 text-stone-800 text-[10px] font-mono font-bold rounded">
                    {tier.sales}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1">{tier.reward}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
