"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
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
  RefreshCw,
} from "lucide-react";

const MILESTONE_IMAGES: Record<number, string> = {
  1: "/sellers/gifts/milestone-10.webp",
  2: "/sellers/gifts/milestone-25.webp",
  3: "/sellers/gifts/milestone-50.webp",
  4: "/sellers/gifts/milestone-100.webp",
};

function getMilestoneImage(tierLevel: number, serverUrl?: string): string {
  if (serverUrl && serverUrl.trim().length > 0 && !serverUrl.includes("/images/rewards/")) {
    return serverUrl;
  }
  return MILESTONE_IMAGES[tierLevel] || "/sellers/gifts/milestone-10.webp";
}

export default function AccountSeller() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
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

  const loadSellerData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (!user) {
        setSellerStatus(null);
        setDashboard(null);
        return;
      }
      const statusRes = await sellerApi.getStatus();
      setSellerStatus(statusRes);

      if (statusRes && statusRes.status === "APPROVED") {
        const dashRes = await sellerApi.getDashboard();
        setDashboard(dashRes);
        setLastUpdated(new Date());
      } else {
        setDashboard(null);
      }
    } catch (err: any) {
      console.error("Failed to load seller status", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (!user) {
        toast.error("Please sign in to view your seller dashboard");
        return;
      }
      const statusRes = await sellerApi.getStatus();
      setSellerStatus(statusRes);
      if (statusRes && statusRes.status === "APPROVED") {
        const dashRes = await sellerApi.getDashboard();
        setDashboard(dashRes);
        setLastUpdated(new Date());
        toast.success("Dashboard refreshed with live sales and gift statuses.");
      } else {
        toast.success("Application status refreshed.");
      }
    } catch (err: any) {
      toast.error("Failed to refresh seller dashboard");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, [loadSellerData]);

  // Window focus & tab visibility change listener for live synchronization
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadSellerData(true);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        loadSellerData(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, loadSellerData]);

  // Status polling when application is PENDING
  useEffect(() => {
    if (sellerStatus?.status === "PENDING" && user) {
      const interval = setInterval(() => {
        loadSellerData(true);
      }, 15000); // Poll every 15s while pending
      return () => clearInterval(interval);
    }
  }, [sellerStatus?.status, user, loadSellerData]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit your Trusted Seller application.");
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Please enter your full legal name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please provide a valid email address.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      toast.error("Please provide a valid contact phone number.");
      return;
    }
    if (!socialChannel.trim() || socialChannel.trim().length < 2) {
      toast.error("Please enter your primary social media handle or promotional channel.");
      return;
    }
    if (!applicationReason.trim() || applicationReason.trim().length < 10) {
      toast.error("Please provide at least a short sentence explaining why you would like to join.");
      return;
    }
    if (!agreeToTerms) {
      toast.error("Please agree to the Trusted Sellers Program terms and conditions.");
      return;
    }

    setSubmittingApp(true);
    try {
      const res = await sellerApi.apply({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        socialChannel: socialChannel.trim(),
        applicationReason: applicationReason.trim(),
        agreeToTerms: true,
        termsAccepted: true,
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
    const pendingOrders = dashboard.pendingOrders;
    const nextMilestone = dashboard.nextMilestone;
    const currentMilestone = dashboard.currentMilestone;
    const targetThreshold = nextMilestone ? nextMilestone.qualifyingSalesThreshold : (currentMilestone ? currentMilestone.qualifyingSalesThreshold : 10);
    const progressPercent = dashboard.progressPercent;
    const remainingSales = dashboard.remainingSalesToNextMilestone;
    const sellerCode = dashboard.seller.sellerCode;
    const unlockedCount = dashboard.rewards.filter((r) => r.status === "UNLOCKED").length;
    const claimedCount = dashboard.rewards.filter((r) => r.status === "CLAIMED" || r.status === "APPROVED" || r.status === "PROCESSING").length;
    const deliveredCount = dashboard.rewards.filter((r) => r.status === "DELIVERED" || r.status === "SHIPPED").length;

    return (
      <div className="space-y-8">
        {/* Phase 4 Live Status & Sync Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-stone-900">Live Seller Tracking Active</span>
            <span className="text-stone-400">&bull;</span>
            <span className="text-stone-500 font-mono text-[11px]">
              Last synced: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-stone-800 font-medium transition disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-600 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Syncing..." : "Sync Live Sales"}
          </button>
        </div>

        {/* Phase 4 Live Summary Metrics KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
              Verified Sales
            </span>
            <span className="text-2xl font-bold text-stone-900 font-sans mt-1 block">
              {verifiedSales}
            </span>
            <span className="text-[11px] text-stone-500">Delivered &amp; qualified orders</span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
              Awaiting Verification
            </span>
            <span className="text-2xl font-bold text-amber-700 font-sans mt-1 block">
              {pendingOrders}
            </span>
            <span className="text-[11px] text-stone-500">In-flight customer orders</span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
              Unlocked Rewards
            </span>
            <span className="text-2xl font-bold text-emerald-700 font-sans mt-1 block">
              {unlockedCount}
            </span>
            <span className="text-[11px] text-stone-500">Ready to claim today</span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
              Fulfillment Pipeline
            </span>
            <span className="text-2xl font-bold text-indigo-700 font-sans mt-1 block">
              {claimedCount + deliveredCount}
            </span>
            <span className="text-[11px] text-stone-500">
              {deliveredCount} delivered, {claimedCount} in transit
            </span>
          </div>
        </div>

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

          {/* Next Milestone Sub-Card — Screenshot 1 with Dedicated Image */}
          {nextMilestone && (
            <div className="mt-6 bg-[#141823] border border-[#22293A] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-[#2B344A] bg-[#0A0D14]">
                  <Image
                    src={getMilestoneImage(nextMilestone.tierLevel, nextMilestone.imageUrl)}
                    alt={nextMilestone.milestoneName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
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

        {/* Unlocked & Claimed Rewards Shelf with Images */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" /> Earned Physical Rewards &amp; Gifts
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
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-stone-300 bg-stone-100">
                      <Image
                        src={getMilestoneImage(reward.tierLevel, reward.imageUrl)}
                        alt={reward.rewardTitleSnapshot}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 64px, 80px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">
                          {reward.milestoneNameSnapshot} (Level {reward.tierLevel})
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                            reward.status === "UNLOCKED"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : reward.status === "CLAIMED"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : reward.status === "APPROVED" || reward.status === "PROCESSING"
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
                            : reward.status === "APPROVED" || reward.status === "PROCESSING"
                            ? "Processing"
                            : reward.status === "SHIPPED"
                            ? "Dispatched"
                            : "Delivered"}
                        </span>
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm mt-0.5 truncate">
                        {reward.rewardTitleSnapshot}
                      </h4>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                        {reward.rewardDescriptionSnapshot}
                      </p>
                    </div>
                  </div>

                  {/* Dates / Lifecycle Stepper */}
                  <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                    <span>Unlocked: {new Date(reward.unlockedAt).toLocaleDateString()}</span>
                    {reward.claimedAt && (
                      <span>Claimed: {new Date(reward.claimedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Processing Status Notice */}
                  {(reward.status === "PROCESSING" || reward.status === "APPROVED") && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Reward claim verified! Your gift package is being prepared for dispatch.</span>
                    </div>
                  )}

                  {/* Shipment Tracking details if dispatched */}
                  {reward.status === "SHIPPED" && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                          <Truck className="w-3.5 h-3.5" /> Dispatched via {reward.shippingCarrier || "Dedicated Courier"}
                        </div>
                        {reward.dispatchedAt && (
                          <span className="text-[10px] text-indigo-700 font-mono">
                            {new Date(reward.dispatchedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-indigo-800">
                        Tracking:{" "}
                        {reward.trackingNumber ? (
                          <span className="font-bold">{reward.trackingNumber}</span>
                        ) : (
                          <span className="italic text-indigo-600 font-sans">
                            Tracking details have not been added yet.
                          </span>
                        )}
                      </div>
                      {reward.trackingUrl && (
                        <a
                          href={reward.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:underline font-semibold mt-1"
                        >
                          Track Package Live <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {reward.status === "DELIVERED" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs space-y-1.5 text-emerald-900">
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Reward successfully delivered!</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-mono flex items-center justify-between">
                        <span>Delivered: {reward.deliveredAt ? new Date(reward.deliveredAt).toLocaleDateString() : "Confirmed"}</span>
                        {reward.trackingNumber && <span>Tracking: {reward.trackingNumber}</span>}
                      </div>
                    </div>
                  )}

                  {reward.status === "UNLOCKED" && (
                    <button
                      onClick={() => handleOpenClaimModal(reward)}
                      className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5 text-amber-300" /> Claim Physical Reward
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestone Roadmap Progression (Screenshot 2 / Reference) */}
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
              const milestoneRemaining = Math.max(0, milestone.qualifyingSalesThreshold - verifiedSales);
              const milestonePercent = Math.min(100, Math.round((verifiedSales / milestone.qualifyingSalesThreshold) * 100));
              const associatedReward = dashboard.rewards.find(
                (r) => r.milestoneConfigId === milestone.id || r.tierLevel === milestone.tierLevel
              );

              return (
                <div
                  key={milestone.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                    isAchieved
                      ? "bg-amber-50/50 border-amber-200"
                      : isCurrent
                      ? "bg-stone-900 text-white border-stone-800 shadow-md"
                      : "bg-stone-50 border-stone-200 text-stone-700 opacity-90"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-stone-300 bg-stone-950">
                        <Image
                          src={getMilestoneImage(milestone.tierLevel, milestone.imageUrl)}
                          alt={milestone.milestoneName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 64px, 80px"
                        />
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
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isCurrent
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                : isAchieved
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-700"
                            }`}
                          >
                            {milestone.qualifyingSalesThreshold} sales
                          </span>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base mt-0.5">
                          {milestone.milestoneName} &mdash; <span className="font-normal">{milestone.rewardTitle}</span>
                        </h4>
                        <p className={`text-xs mt-0.5 ${isCurrent ? "text-slate-300" : "text-stone-600"}`}>
                          {milestone.rewardDescription}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-auto flex items-center gap-3">
                      {associatedReward ? (
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                            associatedReward.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : associatedReward.status === "SHIPPED"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                              : associatedReward.status === "UNLOCKED"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-purple-100 text-purple-800 border-purple-300"
                          }`}
                        >
                          {associatedReward.status === "UNLOCKED"
                            ? "Ready to Claim"
                            : associatedReward.status === "CLAIMED"
                            ? "Claimed"
                            : associatedReward.status === "APPROVED" || associatedReward.status === "PROCESSING"
                            ? "Processing"
                            : associatedReward.status === "SHIPPED"
                            ? "Dispatched"
                            : "Delivered"}
                        </span>
                      ) : isAchieved ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Unlocked
                        </span>
                      ) : isCurrent ? (
                        <span className="text-xs font-bold text-[#E5C378] flex items-center gap-1">
                          In Progress &bull; {milestoneRemaining} left
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 font-medium">
                          Locked &bull; {milestoneRemaining} left
                        </span>
                      )}

                      {associatedReward && associatedReward.status === "UNLOCKED" && (
                        <button
                          onClick={() => handleOpenClaimModal(associatedReward)}
                          className="px-3 py-1.5 bg-[#B89A5A] hover:bg-[#A3864A] text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          Claim Gift
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Individual Milestone Progress Bar */}
                  <div className="mt-2 pt-2 border-t border-stone-200/40 dark:border-stone-800/60">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className={isCurrent ? "text-slate-400" : "text-stone-500"}>
                        Progress: {verifiedSales} / {milestone.qualifyingSalesThreshold} sales
                      </span>
                      <span className={isCurrent ? "text-[#E5C378] font-bold" : "text-stone-700 font-semibold"}>
                        {isAchieved ? "100% Complete" : `${milestoneRemaining} sales remaining`}
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-1.5 overflow-hidden ${isCurrent ? "bg-stone-800" : "bg-stone-200"}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAchieved
                            ? "bg-emerald-500"
                            : isCurrent
                            ? "bg-gradient-to-r from-[#B89A5A] to-[#F3D58C]"
                            : "bg-stone-400"
                        }`}
                        style={{ width: `${milestonePercent}%` }}
                      />
                    </div>
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
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-stone-300 bg-stone-100">
                    <Image
                      src={getMilestoneImage(selectedRewardToClaim.tierLevel)}
                      alt={selectedRewardToClaim.rewardTitleSnapshot}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold block">
                      Claim Physical Gift Reward
                    </span>
                    <h3 className="font-bold text-stone-900 text-base sm:text-lg font-serif">
                      {selectedRewardToClaim.rewardTitleSnapshot}
                    </h3>
                  </div>
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

          <div className="mt-5 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Live status active &bull; Checking updates automatically</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-amber-800 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Checking..." : "Check Application Status"}
            </button>
          </div>
        </div>

        {/* Milestone roadmap preview with Images */}
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
                  Update Application &amp; Reapply
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
            ODESSI CREATOR &amp; TRUSTED SELLERS NETWORK
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif mt-2">
          Promote ODESSI. Unlock Exclusive Merchandise.
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          The ODESSI Trusted Sellers Program invites content creators, community leaders, and streetwear advocates to share authentic cinematic apparel. Earn qualifying sales to receive physical gifts, exclusive limited drops, and brand ambassador recognition.
        </p>
      </div>

      {/* 4 Milestone Tiers Roadmap matching Reference Screenshot 2 */}
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

        {!user && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <strong className="block font-semibold">Sign In Required to Apply</strong>
                <span>Please sign in or create an ODESSI account to submit your application and track milestone rewards.</span>
              </div>
            </div>
            <Link
              href="/login?redirect=/account?tab=seller"
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg shrink-0 transition"
            >
              Sign In to Apply
            </Link>
          </div>
        )}

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
            {!user ? (
              <Link
                href="/login?redirect=/account?tab=seller"
                className="px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-xs"
              >
                <span>Sign In to Submit Application</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                type="submit"
                disabled={submittingApp}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
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
            )}
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
 * Dynamic Milestone Tiers presentation matching Reference Screenshot 2 with Live Admin Sync
 */
function MilestoneTiersPreview() {
  const [milestones, setMilestones] = useState<SellerMilestoneConfigResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    sellerApi
      .getActiveMilestones()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setMilestones(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load dynamic milestones, using fallback", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackTiers: SellerMilestoneConfigResponse[] = [
    {
      id: 1,
      tierLevel: 1,
      milestoneName: "Rising Seller",
      qualifyingSalesThreshold: 10,
      rewardTitle: "Exclusive ODESSI Matte Bracelet Set",
      rewardDescription: "Custom matte-black ODESSI branded silicone band and velvet pouch with certificate.",
      rewardType: "PHYSICAL_GIFT",
      imageUrl: "/sellers/gifts/milestone-10.webp",
      active: true,
      version: 1,
    },
    {
      id: 2,
      tierLevel: 2,
      milestoneName: "Trusted Seller",
      qualifyingSalesThreshold: 25,
      rewardTitle: "Exclusive ODESSI T-Shirt Gift Set",
      rewardDescription: "Luxury matte box with custom tissue wrap containing an exclusive ODESSI tee.",
      rewardType: "PHYSICAL_GIFT",
      imageUrl: "/sellers/gifts/milestone-25.webp",
      active: true,
      version: 1,
    },
    {
      id: 3,
      tierLevel: 3,
      milestoneName: "Elite Seller",
      qualifyingSalesThreshold: 50,
      rewardTitle: "Luxury ODESSI French Terry Hoodie & Gift Box",
      rewardDescription: "Premium heavyweight ODESSI French terry hoodie in luxury presentation packaging with VIP correspondence.",
      rewardType: "PHYSICAL_GIFT",
      imageUrl: "/sellers/gifts/milestone-50.webp",
      active: true,
      version: 1,
    },
    {
      id: 4,
      tierLevel: 4,
      milestoneName: "ODDSI Brand Ambassador",
      qualifyingSalesThreshold: 100,
      rewardTitle: "ODDSI Brand Ambassador Luxury Hamper",
      rewardDescription: "The complete luxury ambassador unboxing chest with hoodie, tee, stainless thermos, cap, socks, keychain, and gold membership recognition.",
      rewardType: "PHYSICAL_GIFT",
      imageUrl: "/sellers/gifts/milestone-100.webp",
      active: true,
      version: 1,
    },
  ];

  const items = milestones.length > 0 ? milestones : fallbackTiers;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="pb-4 border-b border-stone-200 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="text-lg font-bold text-stone-900 font-serif">
            ODESSI Trusted Sellers Program Milestones
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Progress through tiers by generating attributable sales. All physical merchandise rewards include complimentary shipping.
          </p>
        </div>
        {loading && (
          <span className="text-[10px] font-mono text-stone-400">Loading active tiers...</span>
        )}
      </div>

      <div className="space-y-4">
        {items.map((tier) => (
          <div
            key={tier.tierLevel}
            className="p-5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-stone-300 bg-[#0A0D14] shadow-xs">
                <Image
                  src={getMilestoneImage(tier.tierLevel, tier.imageUrl)}
                  alt={tier.rewardTitle || tier.milestoneName}
                  fill
                  className="object-cover transition-transform hover:scale-105 duration-300"
                  sizes="(max-width: 640px) 80px, 96px"
                />
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-sm sm:text-base tracking-tight">
                  Level {tier.tierLevel} &mdash; {tier.milestoneName}
                </h4>
                <div className="mt-1">
                  <span className="inline-block px-2.5 py-0.5 bg-stone-200 text-stone-800 text-[10px] font-mono font-bold rounded">
                    {tier.qualifyingSalesThreshold} successful sales
                  </span>
                </div>
                <p className="text-xs font-semibold text-stone-800 mt-1">
                  {tier.rewardTitle}
                </p>
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                  {tier.rewardDescription}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
