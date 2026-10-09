"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  growthApi,
  PartnershipResponse,
  sellerApi,
  SellerResponse,
  SellerStatus,
  SellerRewardResponse,
  SellerRewardStatus,
  SellerMilestoneConfigResponse,
  SellerMilestoneConfigRequest,
  SellerAttributionResponse,
  SellerAuditLogResponse,
  SellerPerformanceStatsResponse,
  SellerGiftMediaItem,
} from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  Building2,
  Search,
  Filter,
  Save,
  ShieldAlert,
  Crown,
  Gift,
  Truck,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  ArrowRight,
  ExternalLink,
  Edit2,
  Plus,
  Ban,
  Check,
  RotateCcw,
  Users,
  BarChart3,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Upload,
  Copy,
  Clock,
  Package,
} from "lucide-react";

export type AdminSection =
  | "applications"
  | "directory"
  | "attributions"
  | "performance"
  | "milestones"
  | "rewards"
  | "media"
  | "audit"
  | "wholesale";

export default function AdminPartnershipsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AdminSection>("applications");

  // ──────────────────────────────────────────────────────────────────────────
  // 1. APPLICATIONS & DIRECTORY STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [sellers, setSellers] = useState<SellerResponse[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellerStatusFilter, setSellerStatusFilter] = useState<string>("");
  const [sellerSearch, setSellerSearch] = useState<string>("");
  const [selectedSeller, setSelectedSeller] = useState<SellerResponse | null>(null);
  const [sellerAuditLogs, setSellerAuditLogs] = useState<SellerAuditLogResponse[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [statusActionReason, setStatusActionReason] = useState<string>("");
  const [actionModal, setActionModal] = useState<{
    type: "REJECT" | "SUSPEND" | "APPROVE";
    seller: SellerResponse;
  } | null>(null);
  const [updatingSellerStatus, setUpdatingSellerStatus] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. REWARD FULFILLMENT STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [rewardClaims, setRewardClaims] = useState<SellerRewardResponse[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [rewardStatusFilter, setRewardStatusFilter] = useState<string>("");
  const [selectedReward, setSelectedReward] = useState<SellerRewardResponse | null>(null);
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [rewardAdminNotes, setRewardAdminNotes] = useState("");
  const [updatingReward, setUpdatingReward] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SALES ATTRIBUTIONS STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [attributions, setAttributions] = useState<SellerAttributionResponse[]>([]);
  const [loadingAttributions, setLoadingAttributions] = useState(false);
  const [attributionStatusFilter, setAttributionStatusFilter] = useState<string>("");
  const [selectedAttributionForOverride, setSelectedAttributionForOverride] =
    useState<SellerAttributionResponse | null>(null);
  const [overrideQualifying, setOverrideQualifying] = useState<boolean>(true);
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [savingOverride, setSavingOverride] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PERFORMANCE STATS STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<SellerPerformanceStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. MILESTONES STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [milestones, setMilestones] = useState<SellerMilestoneConfigResponse[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<SellerMilestoneConfigResponse | null>(null);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState<SellerMilestoneConfigRequest>({
    milestoneName: "",
    qualifyingSalesThreshold: 10,
    rewardTitle: "",
    rewardDescription: "",
    rewardType: "PHYSICAL_GIFT",
    active: true,
  });
  const [savingMilestone, setSavingMilestone] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // 5b. GIFT MEDIA GALLERY STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [giftMedia, setGiftMedia] = useState<SellerGiftMediaItem[]>([]);
  const [loadingGiftMedia, setLoadingGiftMedia] = useState(false);
  const [uploadingGiftMedia, setUploadingGiftMedia] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. GLOBAL AUDIT HISTORY STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [globalAuditLogs, setGlobalAuditLogs] = useState<SellerAuditLogResponse[]>([]);
  const [loadingGlobalAudit, setLoadingGlobalAudit] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. WHOLESALE INQUIRIES STATE (PRESERVED)
  // ──────────────────────────────────────────────────────────────────────────
  const [wholesaleApps, setWholesaleApps] = useState<PartnershipResponse[]>([]);
  const [loadingWholesale, setLoadingWholesale] = useState(false);
  const [wholesaleStatusFilter, setWholesaleStatusFilter] = useState<string>("");
  const [wholesaleSearch, setWholesaleSearch] = useState<string>("");
  const [selectedWholesaleApp, setSelectedWholesaleApp] = useState<PartnershipResponse | null>(null);
  const [wholesaleNotes, setWholesaleNotes] = useState<string>("");
  const [savingWholesaleNotes, setSavingWholesaleNotes] = useState(false);
  const [updatingWholesaleStatus, setUpdatingWholesaleStatus] = useState(false);

  // ── Data Fetchers ──────────────────────────────────────────────────────────

  const fetchGiftMedia = useCallback(async () => {
    setLoadingGiftMedia(true);
    try {
      const res = await sellerApi.getGiftMediaList();
      setGiftMedia(res || []);
    } catch {
      setGiftMedia([]);
    } finally {
      setLoadingGiftMedia(false);
    }
  }, []);

  const handleUploadGiftFile = async (file: File): Promise<string | null> => {
    if (!file) return null;
    setUploadingGiftMedia(true);
    try {
      const res = await sellerApi.uploadGiftMedia(file);
      toast.success(`Gift image "${res.filename}" uploaded successfully!`);
      await fetchGiftMedia();
      return res.url;
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload gift image");
      return null;
    } finally {
      setUploadingGiftMedia(false);
    }
  };

  const fetchSellers = useCallback(async () => {
    setLoadingSellers(true);
    try {
      const res = await sellerApi.getAdminSellers({
        status: sellerStatusFilter || undefined,
        search: sellerSearch || undefined,
        page: 0,
        size: 100,
      });
      setSellers(res.content || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load seller list");
    } finally {
      setLoadingSellers(false);
    }
  }, [sellerStatusFilter, sellerSearch]);

  const fetchRewardClaims = useCallback(async () => {
    setLoadingRewards(true);
    try {
      const res = await sellerApi.getAdminRewardClaims({
        status: rewardStatusFilter || undefined,
        page: 0,
        size: 50,
      });
      setRewardClaims(res.content || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load reward claims");
    } finally {
      setLoadingRewards(false);
    }
  }, [rewardStatusFilter]);

  const fetchAttributions = useCallback(async () => {
    setLoadingAttributions(true);
    try {
      const res = await sellerApi.getAdminAttributions({
        status: attributionStatusFilter || undefined,
        page: 0,
        size: 100,
      });
      setAttributions(res.content || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load sales attributions");
    } finally {
      setLoadingAttributions(false);
    }
  }, [attributionStatusFilter]);

  const fetchPerformanceStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await sellerApi.getAdminPerformanceStats();
      setStats(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load performance stats");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchMilestones = useCallback(async () => {
    setLoadingMilestones(true);
    try {
      const res = await sellerApi.getAdminMilestones();
      setMilestones(res || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load milestones");
    } finally {
      setLoadingMilestones(false);
    }
  }, []);

  const fetchGlobalAuditLogs = useCallback(async () => {
    setLoadingGlobalAudit(true);
    try {
      const res = await sellerApi.getAllAdminAuditLogs({ page: 0, size: 100 });
      setGlobalAuditLogs(res.content || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load audit history");
    } finally {
      setLoadingGlobalAudit(false);
    }
  }, []);

  const fetchWholesale = useCallback(async () => {
    setLoadingWholesale(true);
    try {
      const res = await growthApi.getPartnerships({
        status: wholesaleStatusFilter || undefined,
        search: wholesaleSearch || undefined,
        page: 0,
        size: 50,
      });
      setWholesaleApps(res.content || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load wholesale partnerships");
    } finally {
      setLoadingWholesale(false);
    }
  }, [wholesaleStatusFilter, wholesaleSearch]);

  // Load based on active tab
  useEffect(() => {
    if (activeTab === "applications" || activeTab === "directory") fetchSellers();
    else if (activeTab === "rewards") fetchRewardClaims();
    else if (activeTab === "attributions") fetchAttributions();
    else if (activeTab === "performance") fetchPerformanceStats();
    else if (activeTab === "milestones") {
      fetchMilestones();
      fetchGiftMedia();
    } else if (activeTab === "media") {
      fetchGiftMedia();
    } else if (activeTab === "audit") fetchGlobalAuditLogs();
    else if (activeTab === "wholesale") fetchWholesale();
  }, [
    activeTab,
    fetchSellers,
    fetchRewardClaims,
    fetchAttributions,
    fetchPerformanceStats,
    fetchMilestones,
    fetchGiftMedia,
    fetchGlobalAuditLogs,
    fetchWholesale,
  ]);

  // Load audit logs when seller selected
  const handleSelectSeller = async (seller: SellerResponse) => {
    setSelectedSeller(seller);
    setLoadingAuditLogs(true);
    try {
      const logs = await sellerApi.getAdminSellerAuditLogs(seller.id);
      setSellerAuditLogs(logs || []);
    } catch {
      setSellerAuditLogs([]);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  // ── Seller Status Actions ──────────────────────────────────────────────────

  const executeStatusChange = async (sellerId: number, newStatus: SellerStatus, reason?: string) => {
    setUpdatingSellerStatus(true);
    try {
      const updated = await sellerApi.updateAdminSellerStatus(sellerId, {
        status: newStatus,
        reason: reason || undefined,
      });
      setSellers((prev) => prev.map((s) => (s.id === sellerId ? updated : s)));
      if (selectedSeller?.id === sellerId) {
        setSelectedSeller(updated);
        const logs = await sellerApi.getAdminSellerAuditLogs(sellerId);
        setSellerAuditLogs(logs || []);
      }
      toast.success(`Seller status updated to ${newStatus}`);
      setActionModal(null);
      setStatusActionReason("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update seller status");
    } finally {
      setUpdatingSellerStatus(false);
    }
  };

  // ── Reward Fulfillment Actions ─────────────────────────────────────────────

  const handleUpdateRewardStatus = async (
    rewardId: number,
    newStatus: SellerRewardStatus,
    carrier?: string,
    tracking?: string,
    url?: string,
    notes?: string
  ) => {
    setUpdatingReward(true);
    try {
      const updated = await sellerApi.updateAdminRewardStatus(rewardId, {
        status: newStatus,
        shippingCarrier: carrier || undefined,
        trackingNumber: tracking || undefined,
        trackingUrl: url || undefined,
        adminNotes: notes || undefined,
      });
      setRewardClaims((prev) => prev.map((r) => (r.id === rewardId ? updated : r)));
      if (selectedReward?.id === rewardId) setSelectedReward(updated);
      toast.success(`Reward fulfillment status updated to ${newStatus}`);
      if (newStatus === "DELIVERED" || newStatus === "SHIPPED") {
        setSelectedReward(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update reward status");
    } finally {
      setUpdatingReward(false);
    }
  };

  // ── Attribution Override Actions ───────────────────────────────────────────

  const handleExecuteAttributionOverride = async () => {
    if (!selectedAttributionForOverride) return;
    if (!overrideReason.trim()) {
      toast.error("Please provide an audit rationale for the attribution override.");
      return;
    }

    setSavingOverride(true);
    try {
      const updated = await sellerApi.overrideAdminAttribution(
        selectedAttributionForOverride.id,
        overrideQualifying,
        overrideReason.trim()
      );
      setAttributions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success("Attribution qualification updated with immutable audit record.");
      setSelectedAttributionForOverride(null);
      setOverrideReason("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to override attribution");
    } finally {
      setSavingOverride(false);
    }
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────

  const handleExportAttributionsCSV = () => {
    if (attributions.length === 0) {
      toast.error("No attribution records available to export.");
      return;
    }

    const headers = [
      "Order Number",
      "Order Total (INR)",
      "Seller Code",
      "Customer Name",
      "Customer Email",
      "Is Qualifying",
      "Qualification Status",
      "Qualification Reason",
      "Order Date",
    ];

    const rows = attributions.map((a) => [
      `"${a.orderNumber}"`,
      a.orderTotal,
      `"${a.sellerCodeUsed}"`,
      `"${(a.customerName || "Customer").replace(/"/g, '""')}"`,
      `"${(a.customerEmail || "").replace(/"/g, '""')}"`,
      a.isQualifying ? "YES" : "NO",
      `"${a.qualificationStatus}"`,
      `"${(a.qualificationReason || "").replace(/"/g, '""')}"`,
      `"${new Date(a.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `odessi_seller_attributions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sales attribution report exported to CSV.");
  };

  // ── Milestone Config Actions ───────────────────────────────────────────────

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMilestone(true);
    try {
      if (editingMilestone) {
        const updated = await sellerApi.updateAdminMilestone(editingMilestone.id, milestoneForm);
        setMilestones((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        toast.success(`Milestone #${updated.tierLevel} updated successfully`);
      } else {
        const created = await sellerApi.createAdminMilestone(milestoneForm);
        setMilestones((prev) => [...prev, created]);
        toast.success(`New milestone tier created successfully`);
      }
      setEditingMilestone(null);
      setIsCreatingMilestone(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save milestone configuration");
    } finally {
      setSavingMilestone(false);
    }
  };

  // ── Wholesale Actions ──────────────────────────────────────────────────────

  const handleUpdateWholesaleStatus = async (id: number, newStatus: string) => {
    setUpdatingWholesaleStatus(true);
    try {
      const updated = await growthApi.updatePartnershipStatus(id, newStatus);
      setWholesaleApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (selectedWholesaleApp?.id === id) setSelectedWholesaleApp(updated);
      toast.success(`Wholesale inquiry status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setUpdatingWholesaleStatus(false);
    }
  };

  const handleSaveWholesaleNotes = async () => {
    if (!selectedWholesaleApp) return;
    setSavingWholesaleNotes(true);
    try {
      const updated = await growthApi.updatePartnershipNotes(selectedWholesaleApp.id, wholesaleNotes);
      setWholesaleApps((prev) => prev.map((a) => (a.id === selectedWholesaleApp.id ? updated : a)));
      setSelectedWholesaleApp(updated);
      toast.success("Confidential notes saved.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save notes");
    } finally {
      setSavingWholesaleNotes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" /> Admin &mdash; Seller Network &amp; Partnerships
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive administrative portal for Trusted Sellers onboarding, verified sales attributions, reward fulfillment, milestones, and wholesale B2B inquiries.
            </p>
          </div>
        </div>

        {/* 8 Tab Navigation Pills */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => {
              setActiveTab("applications");
              setSellerStatusFilter("PENDING");
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeTab === "applications"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Applications</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("directory");
              setSellerStatusFilter("APPROVED");
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeTab === "directory"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Seller Directory</span>
          </button>

          <button
            onClick={() => setActiveTab("attributions")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeTab === "attributions"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. Sales &amp; Attributions</span>
          </button>

          <button
            onClick={() => setActiveTab("performance")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeTab === "performance"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>4. Performance</span>
          </button>

          <button
            onClick={() => setActiveTab("milestones")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeTab === "milestones"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>5. Milestones</span>
          </button>

          <button
            onClick={() => setActiveTab("rewards")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeTab === "rewards"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-rose-500" />
            <span>6. Reward Fulfillment</span>
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeTab === "media"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
            <span>7. Gift Media Gallery</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>8. Audit History</span>
          </button>

          <button
            onClick={() => setActiveTab("wholesale")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeTab === "wholesale"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>9. Wholesale Inquiries</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: APPLICATIONS & SECTION 2: SELLER DIRECTORY */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === "applications" || activeTab === "directory") && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search seller name, code, email..."
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-500 w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sellerStatusFilter}
                  onChange={(e) => setSellerStatusFilter(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-800 text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved Active</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchSellers}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {loadingSellers ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading sellers...</div>
            ) : sellers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No seller records found matching filters.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Seller ID</th>
                    <th className="py-3.5 px-4">Applicant / Contact</th>
                    <th className="py-3.5 px-4">Seller Code</th>
                    <th className="py-3.5 px-4">Social / Channel</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Verified Sales</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">#{s.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{s.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.email} &bull; {s.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {s.sellerCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">{s.socialChannel}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            s.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : s.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : s.status === "SUSPENDED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                        {s.verifiedSalesCount}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(s.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleSelectSeller(s)}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800 transition"
                        >
                          Review &amp; Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Seller Management Modal */}
          {selectedSeller && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white w-full max-w-2xl rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-600 block">
                      Trusted Seller Record
                    </span>
                    <h3 className="font-bold text-slate-900 text-xl">{selectedSeller.fullName}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Seller Code: {selectedSeller.sellerCode} &bull; Registered User ID: #{selectedSeller.userId}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSeller(null)}
                    className="text-slate-400 hover:text-slate-800 text-sm font-bold"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                    <span className="font-mono text-slate-900">{selectedSeller.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                    <span className="font-mono text-slate-900">{selectedSeller.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Promotional Channel</span>
                    <span className="font-semibold text-slate-900">{selectedSeller.socialChannel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Verified Sales</span>
                    <span className="text-base font-bold font-mono text-emerald-700">
                      {selectedSeller.verifiedSalesCount} sales
                    </span>
                  </div>
                </div>

                {selectedSeller.applicationReason && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                      Applicant Message &amp; Promotional Strategy
                    </span>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedSeller.applicationReason}</p>
                  </div>
                )}

                {/* Status Decision Controls */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                    Administrative Workflow Status (Current: {selectedSeller.status})
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {selectedSeller.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => executeStatusChange(selectedSeller.id, "APPROVED")}
                          disabled={updatingSellerStatus}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Seller
                        </button>
                        <button
                          onClick={() => setActionModal({ type: "REJECT", seller: selectedSeller })}
                          disabled={updatingSellerStatus}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Ban className="w-3.5 h-3.5" /> Reject with Reason
                        </button>
                      </>
                    )}

                    {selectedSeller.status === "APPROVED" && (
                      <button
                        onClick={() => setActionModal({ type: "SUSPEND", seller: selectedSeller })}
                        disabled={updatingSellerStatus}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Ban className="w-3.5 h-3.5" /> Suspend Seller
                      </button>
                    )}

                    {selectedSeller.status === "SUSPENDED" && (
                      <button
                        onClick={() => executeStatusChange(selectedSeller.id, "APPROVED")}
                        disabled={updatingSellerStatus}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Reactivate / Approve Seller
                      </button>
                    )}

                    {selectedSeller.status === "REJECTED" && (
                      <button
                        onClick={() => executeStatusChange(selectedSeller.id, "APPROVED")}
                        disabled={updatingSellerStatus}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Reconsider &amp; Approve
                      </button>
                    )}
                  </div>
                </div>

                {/* Seller Audit Logs */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-500" /> Seller Verification &amp; Audit Trail
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sellerAuditLogs.length} events recorded
                    </span>
                  </div>

                  {loadingAuditLogs ? (
                    <div className="p-4 text-center text-slate-400 text-xs">Loading audit trail...</div>
                  ) : sellerAuditLogs.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">No audit logs recorded yet.</div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-100">
                      {sellerAuditLogs.map((log) => (
                        <div key={log.id} className="pt-2 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-semibold text-slate-700">{log.action}</span>
                            <span className="font-mono">
                              {new Date(log.createdAt).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                          {log.adminEmail && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              Admin: {log.adminEmail}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Reason Input Modal */}
          {actionModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
              <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
                <h3 className="font-bold text-slate-900 text-base">
                  {actionModal.type === "REJECT" ? "Reject Seller Application" : "Suspend Seller Account"}
                </h3>
                <p className="text-xs text-slate-500">
                  Please provide a documented reason for this action. This will be recorded in the audit trail and visible to the applicant.
                </p>

                <textarea
                  rows={3}
                  required
                  value={statusActionReason}
                  onChange={(e) => setStatusActionReason(e.target.value)}
                  placeholder="e.g. Incomplete social presence, suspected self-attribution, policy violation..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setActionModal(null);
                      setStatusActionReason("");
                    }}
                    className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={updatingSellerStatus || !statusActionReason.trim()}
                    onClick={() =>
                      executeStatusChange(
                        actionModal.seller.id,
                        actionModal.type === "REJECT" ? "REJECTED" : "SUSPENDED",
                        statusActionReason.trim()
                      )
                    }
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {updatingSellerStatus ? "Saving..." : "Confirm Action"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 3: SALES & ATTRIBUTIONS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "attributions" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Filter Qualification:</span>
              <select
                value={attributionStatusFilter}
                onChange={(e) => setAttributionStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">All Qualification Statuses</option>
                <option value="QUALIFIED">Qualified (+1 Sale)</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="DISQUALIFIED_CANCELLED">Disqualified (Cancelled/Refunded)</option>
                <option value="DISQUALIFIED_SELF_REFERRAL">Disqualified (Self-Attribution Fraud)</option>
                <option value="OVERRIDDEN">Overridden by Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAttributionsCSV}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>

              <button
                onClick={fetchAttributions}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {loadingAttributions ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading attributions...</div>
            ) : attributions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No attributed orders recorded.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Order Total</th>
                    <th className="py-3.5 px-4">Attributed Seller</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Qualifying?</th>
                    <th className="py-3.5 px-4">Status &amp; Reason</th>
                    <th className="py-3.5 px-4">Order Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attributions.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{a.orderNumber}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        ₹{Number(a.orderTotal || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {a.sellerCodeUsed}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">Seller #{a.sellerId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{a.customerName || "Customer"}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{a.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {a.isQualifying ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <Check className="w-3.5 h-3.5" /> YES
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                            <Ban className="w-3.5 h-3.5" /> NO
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            a.qualificationStatus === "QUALIFIED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : a.qualificationStatus === "DISQUALIFIED_SELF_REFERRAL"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : a.qualificationStatus === "OVERRIDDEN"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {a.qualificationStatus}
                        </span>
                        {a.qualificationReason && (
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                            {a.qualificationReason}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedAttributionForOverride(a);
                            setOverrideQualifying(!a.isQualifying);
                            setOverrideReason("");
                          }}
                          className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition"
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Override Modal */}
          {selectedAttributionForOverride && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
                <h3 className="font-bold text-slate-900 text-base">
                  Override Qualification for Order #{selectedAttributionForOverride.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Manually adjust qualification status with an immutable audit rationale.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Set Status:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="overrideQualifying"
                        checked={overrideQualifying === true}
                        onChange={() => setOverrideQualifying(true)}
                      />
                      <span className="font-semibold text-emerald-700">Qualify (+1 Verified Sale)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="overrideQualifying"
                        checked={overrideQualifying === false}
                        onChange={() => setOverrideQualifying(false)}
                      />
                      <span className="font-semibold text-rose-700">Disqualify (0)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Audit Rationale / Justification *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Verified genuine order following customer concierge outreach..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedAttributionForOverride(null)}
                    className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={savingOverride || !overrideReason.trim()}
                    onClick={handleExecuteAttributionOverride}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {savingOverride ? "Saving..." : "Apply Override"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 4: PERFORMANCE REPORTS DASHBOARD */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Program Performance &amp; KPI Metrics</h3>
              <p className="text-xs text-slate-500">
                Authoritative metrics computed directly from database tables. No illustrative data.
              </p>
            </div>
            <button
              onClick={fetchPerformanceStats}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Analytics
            </button>
          </div>

          {loadingStats || !stats ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading performance metrics...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Total Applications
                </span>
                <span className="text-3xl font-extrabold text-slate-900 font-sans">
                  {stats.totalApplications}
                </span>
                <p className="text-[11px] text-amber-700 font-medium">
                  {stats.pendingApplications} awaiting review
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Active Approved Sellers
                </span>
                <span className="text-3xl font-extrabold text-emerald-700 font-sans">
                  {stats.approvedSellers}
                </span>
                <p className="text-[11px] text-slate-500">
                  {stats.suspendedSellers} suspended &bull; {stats.rejectedSellers} rejected
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Verified Qualifying Sales
                </span>
                <span className="text-3xl font-extrabold text-slate-900 font-sans">
                  {stats.verifiedQualifyingSales}
                </span>
                <p className="text-[11px] text-slate-500">
                  {stats.pendingAttributions} pending orders
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Eligible Order Value
                </span>
                <span className="text-3xl font-extrabold text-slate-900 font-sans">
                  ₹{Number(stats.totalEligibleOrderValue || 0).toLocaleString("en-IN")}
                </span>
                <p className="text-[11px] text-slate-400">Total qualified gross merchandise volume</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Milestones Unlocked
                </span>
                <span className="text-3xl font-extrabold text-amber-600 font-sans">
                  {stats.milestonesUnlocked}
                </span>
                <p className="text-[11px] text-slate-500">Physical gift rewards earned</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Awaiting Approval
                </span>
                <span className="text-3xl font-extrabold text-blue-600 font-sans">
                  {stats.rewardsAwaitingApproval}
                </span>
                <p className="text-[11px] text-blue-700">Claimed with address, ready to pack</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Awaiting Shipment
                </span>
                <span className="text-3xl font-extrabold text-purple-600 font-sans">
                  {stats.rewardsAwaitingShipment}
                </span>
                <p className="text-[11px] text-purple-700">Approved, needs tracking details</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Gifts Delivered
                </span>
                <span className="text-3xl font-extrabold text-emerald-600 font-sans">
                  {stats.rewardsDelivered}
                </span>
                <p className="text-[11px] text-emerald-700">Fulfillment lifecycle completed</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 5: MILESTONES CONFIGURATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configurable Seller Milestones &amp; Rewards</h3>
              <p className="text-xs text-slate-500">
                All thresholds and reward titles are dynamically editable. When sellers unlock rewards, a snapshot is preserved.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingMilestone(null);
                setMilestoneForm({
                  milestoneName: "",
                  qualifyingSalesThreshold: 10,
                  rewardTitle: "",
                  rewardDescription: "",
                  rewardType: "PHYSICAL_GIFT",
                  active: true,
                });
                setIsCreatingMilestone(true);
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tier
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {loadingMilestones ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading milestone tiers...</div>
            ) : milestones.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No milestones configured yet.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Tier Level</th>
                    <th className="py-3.5 px-4">Milestone Title</th>
                    <th className="py-3.5 px-4">Qualifying Sales</th>
                    <th className="py-3.5 px-4">Physical Reward Title &amp; Gift</th>
                    <th className="py-3.5 px-4">Image Asset</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {milestones.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">Level {m.tierLevel}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{m.milestoneName}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                        {m.qualifyingSalesThreshold} sales
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{m.rewardTitle}</div>
                        <div className="text-[11px] text-slate-500">{m.rewardDescription}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                            <img
                              src={
                                m.imageUrl ||
                                (m.tierLevel === 1
                                  ? "/sellers/gifts/milestone-10.webp"
                                  : m.tierLevel === 2
                                  ? "/sellers/gifts/milestone-25.webp"
                                  : m.tierLevel === 3
                                  ? "/sellers/gifts/milestone-50.webp"
                                  : "/sellers/gifts/milestone-100.webp")
                              }
                              alt={m.rewardTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/sellers/gifts/milestone-10.webp";
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] text-slate-700 font-medium truncate max-w-[140px]" title={m.imageUrl || ""}>
                              {m.imageUrl ? m.imageUrl.split("/").pop() : "default.webp"}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {m.imageUrl?.startsWith("/api/media") ? "Uploaded Media" : "Dedicated Asset"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            m.active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {m.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingMilestone(m);
                            setMilestoneForm({
                              milestoneName: m.milestoneName,
                              qualifyingSalesThreshold: m.qualifyingSalesThreshold,
                              rewardTitle: m.rewardTitle,
                              rewardDescription: m.rewardDescription,
                              rewardType: m.rewardType,
                              imageUrl: m.imageUrl,
                              active: m.active,
                            });
                            setIsCreatingMilestone(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 text-white rounded hover:bg-slate-800 transition flex items-center gap-1 ml-auto"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Edit / Create Milestone Modal */}
          {isCreatingMilestone && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingMilestone ? `Edit Milestone #${editingMilestone.tierLevel}` : "Create Milestone Tier"}
                  </h3>
                  <button
                    onClick={() => setIsCreatingMilestone(false)}
                    className="text-slate-400 hover:text-slate-800 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveMilestone} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Milestone Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={milestoneForm.milestoneName}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, milestoneName: e.target.value })}
                      placeholder="e.g. Rising Seller, Trusted Seller"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Qualifying Sales Required *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={milestoneForm.qualifyingSalesThreshold}
                      onChange={(e) =>
                        setMilestoneForm({
                          ...milestoneForm,
                          qualifyingSalesThreshold: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Reward Gift Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={milestoneForm.rewardTitle}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, rewardTitle: e.target.value })}
                      placeholder="e.g. One exclusive ODESSI T-shirt as a gift"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Reward Full Description *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={milestoneForm.rewardDescription}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, rewardDescription: e.target.value })}
                      placeholder="Detailed gift description sent to seller upon unlock..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  {/* Gift Image Management & Live Preview */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                      Gift Product Photography
                    </label>

                    {/* Live Preview Box */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 shadow-2xs">
                        <img
                          src={milestoneForm.imageUrl || "/sellers/gifts/milestone-10.webp"}
                          alt="Gift Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/sellers/gifts/milestone-10.webp";
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-amber-600 block">
                          Current Milestone Asset
                        </span>
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {milestoneForm.imageUrl ? milestoneForm.imageUrl.split("/").pop() : "Default Gift Image"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {milestoneForm.imageUrl || "/sellers/gifts/milestone-10.webp"}
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Selector */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">
                        Select Default Gift Photography:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: "Level 1: Bracelet", url: "/sellers/gifts/milestone-10.webp" },
                          { label: "Level 2: T-Shirt Set", url: "/sellers/gifts/milestone-25.webp" },
                          { label: "Level 3: Hoodie Box", url: "/sellers/gifts/milestone-50.webp" },
                          { label: "Level 4: Luxury Hamper", url: "/sellers/gifts/milestone-100.webp" },
                        ].map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setMilestoneForm({ ...milestoneForm, imageUrl: preset.url })}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border text-left truncate transition ${
                              milestoneForm.imageUrl === preset.url
                                ? "bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-2xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upload or Custom URL */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingGiftMedia ? "Uploading..." : "Upload New Image"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={uploadingGiftMedia}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await handleUploadGiftFile(file);
                              if (url) {
                                setMilestoneForm((prev) => ({ ...prev, imageUrl: url }));
                              }
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={milestoneForm.imageUrl || ""}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, imageUrl: e.target.value })}
                        placeholder="Or enter custom URL (/sellers/gifts/...)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="milestoneActive"
                      checked={milestoneForm.active}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, active: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="milestoneActive" className="text-xs text-slate-800 font-medium">
                      Active Tier (Sellers can unlock this reward)
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsCreatingMilestone(false)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingMilestone}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      {savingMilestone ? "Saving..." : "Save Milestone Tier"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 6: REWARD FULFILLMENT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "rewards" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
              <select
                value={rewardStatusFilter}
                onChange={(e) => setRewardStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">All Fulfillment Statuses</option>
                <option value="UNLOCKED">Unlocked (Unclaimed)</option>
                <option value="CLAIMED">Claimed (Awaiting Approval)</option>
                <option value="APPROVED">Approved (Ready for Packaging)</option>
                <option value="PROCESSING">Processing (In Packaging)</option>
                <option value="SHIPPED">Shipped (In Transit)</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <button
              onClick={fetchRewardClaims}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Claims
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {loadingRewards ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading rewards...</div>
            ) : rewardClaims.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No reward claims found.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Reward ID</th>
                    <th className="py-3.5 px-4">Milestone Tier</th>
                    <th className="py-3.5 px-4">Gift Photo &amp; Reward</th>
                    <th className="py-3.5 px-4">Shipping Destination</th>
                    <th className="py-3.5 px-4">Size</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rewardClaims.map((r) => {
                    const fallbackImg =
                      r.tierLevel === 1
                        ? "/sellers/gifts/milestone-10.webp"
                        : r.tierLevel === 2
                        ? "/sellers/gifts/milestone-25.webp"
                        : r.tierLevel === 3
                        ? "/sellers/gifts/milestone-50.webp"
                        : "/sellers/gifts/milestone-100.webp";
                    const rewardImg = r.imageUrl || fallbackImg;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900">#{r.id}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">{r.milestoneNameSnapshot}</span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Level {r.tierLevel} ({r.qualifyingSalesAtUnlock} sales)
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                              <img
                                src={rewardImg}
                                alt={r.rewardTitleSnapshot}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = fallbackImg;
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate max-w-xs">{r.rewardTitleSnapshot}</div>
                              {r.shippingCarrier && r.trackingNumber && (
                                <div className="text-[10px] text-indigo-700 font-mono mt-0.5">
                                  {r.shippingCarrier}: {r.trackingNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {r.shippingFullName ? (
                            <div>
                              <span className="font-semibold text-slate-900">{r.shippingFullName}</span>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {r.shippingCity} - {r.shippingPostalCode}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Address not submitted</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{r.tshirtSize || "N/A"}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              r.status === "UNLOCKED"
                                ? "bg-slate-100 text-slate-700 border-slate-300"
                                : r.status === "CLAIMED"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : r.status === "APPROVED"
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : r.status === "PROCESSING"
                                ? "bg-amber-100 text-amber-900 border-amber-300 font-semibold"
                                : r.status === "SHIPPED"
                                ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedReward(r);
                              setShippingCarrier(r.shippingCarrier || "Delhivery");
                              setTrackingNumber(r.trackingNumber || "");
                              setTrackingUrl(r.trackingUrl || "");
                              setRewardAdminNotes(r.adminNotes || "");
                            }}
                            className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800 transition"
                          >
                            Fulfillment
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Reward Fulfillment Management Modal */}
          {selectedReward && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white w-full max-w-xl rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-xs">
                      <img
                        src={
                          selectedReward.imageUrl ||
                          (selectedReward.tierLevel === 1
                            ? "/sellers/gifts/milestone-10.webp"
                            : selectedReward.tierLevel === 2
                            ? "/sellers/gifts/milestone-25.webp"
                            : selectedReward.tierLevel === 3
                            ? "/sellers/gifts/milestone-50.webp"
                            : "/sellers/gifts/milestone-100.webp")
                        }
                        alt={selectedReward.rewardTitleSnapshot}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-amber-600 block">
                        Physical Reward Fulfillment #{selectedReward.id}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">
                        {selectedReward.rewardTitleSnapshot}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Milestone: {selectedReward.milestoneNameSnapshot} (Level {selectedReward.tierLevel} &bull; {selectedReward.qualifyingSalesAtUnlock} sales)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReward(null)}
                    className="text-slate-400 hover:text-slate-800 text-sm font-bold"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Shipping Address Card */}
                {selectedReward.shippingFullName ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                      Recipient Shipping Destination
                    </span>
                    <div className="font-bold text-slate-900">{selectedReward.shippingFullName}</div>
                    <div className="text-slate-700">{selectedReward.shippingAddressLine1}</div>
                    {selectedReward.shippingAddressLine2 && (
                      <div className="text-slate-700">{selectedReward.shippingAddressLine2}</div>
                    )}
                    <div className="text-slate-700 font-mono">
                      {selectedReward.shippingCity}, {selectedReward.shippingState} - {selectedReward.shippingPostalCode}
                    </div>
                    <div className="text-slate-600 font-mono">Phone: {selectedReward.shippingPhone}</div>
                    {selectedReward.tshirtSize && (
                      <div className="font-semibold text-slate-900 pt-1">
                        Requested Size: <span className="font-mono text-amber-700">{selectedReward.tshirtSize}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800">
                    Seller has unlocked this milestone but has not yet submitted shipping address details.
                  </div>
                )}

                {/* Status Transitions */}
                <div className="space-y-4">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Fulfillment Workflow Steps
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {selectedReward.status === "CLAIMED" && (
                      <button
                        disabled={updatingReward}
                        onClick={() =>
                          handleUpdateRewardStatus(
                            selectedReward.id,
                            "APPROVED",
                            shippingCarrier,
                            trackingNumber,
                            trackingUrl,
                            rewardAdminNotes
                          )
                        }
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Approve Claim
                      </button>
                    )}

                    {(selectedReward.status === "CLAIMED" || selectedReward.status === "APPROVED") && (
                      <button
                        disabled={updatingReward}
                        onClick={() =>
                          handleUpdateRewardStatus(
                            selectedReward.id,
                            "PROCESSING",
                            shippingCarrier,
                            trackingNumber,
                            trackingUrl,
                            rewardAdminNotes
                          )
                        }
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Package className="w-3.5 h-3.5" /> Move to Processing &amp; Packaging
                      </button>
                    )}

                    {selectedReward.status === "SHIPPED" && (
                      <button
                        disabled={updatingReward}
                        onClick={() =>
                          handleUpdateRewardStatus(
                            selectedReward.id,
                            "DELIVERED",
                            shippingCarrier,
                            trackingNumber,
                            trackingUrl,
                            rewardAdminNotes
                          )
                        }
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Delivered
                      </button>
                    )}
                  </div>

                  {/* Shipment Tracking Input */}
                  {(selectedReward.status === "CLAIMED" ||
                    selectedReward.status === "APPROVED" ||
                    selectedReward.status === "PROCESSING" ||
                    selectedReward.status === "SHIPPED") && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <span className="text-slate-700 block text-[11px] font-bold">
                        Dispatch &amp; Shipment Tracking Details
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                            Courier Carrier
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Blue Dart, Delhivery, DTDC"
                            value={shippingCarrier}
                            onChange={(e) => setShippingCarrier(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                            Tracking / AWB Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. BD102938475"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                          Tracking URL (Optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://track.courier.com/..."
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>

                      {/* Internal Admin Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            Internal Fulfillment Notes
                          </label>
                          <span className="text-[10px] text-slate-400">Hidden from seller</span>
                        </div>
                        <textarea
                          rows={2}
                          value={rewardAdminNotes}
                          onChange={(e) => setRewardAdminNotes(e.target.value)}
                          placeholder="Record warehouse batch number, packaging checklist, dispatch notes..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          disabled={updatingReward}
                          onClick={() =>
                            handleUpdateRewardStatus(
                              selectedReward.id,
                              selectedReward.status === "UNLOCKED"
                                ? "APPROVED"
                                : (selectedReward.status as SellerRewardStatus),
                              shippingCarrier,
                              trackingNumber,
                              trackingUrl,
                              rewardAdminNotes
                            )
                          }
                          className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
                        >
                          Save Notes &amp; Tracking Only
                        </button>

                        <button
                          disabled={updatingReward || !trackingNumber.trim()}
                          onClick={() =>
                            handleUpdateRewardStatus(
                              selectedReward.id,
                              "SHIPPED",
                              shippingCarrier,
                              trackingNumber,
                              trackingUrl,
                              rewardAdminNotes
                            )
                          }
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Truck className="w-3.5 h-3.5" /> Save &amp; Mark Dispatched
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 7: GIFT MEDIA GALLERY */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "media" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-sky-500" />
                <h3 className="text-base font-bold text-slate-900">Dedicated Seller Gift Photography Gallery</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage high-resolution physical gift photography for seller milestone rewards. Assets reside in{" "}
                <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">public/sellers/gifts/</span> and persistent media storage.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchGiftMedia}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Refresh Assets
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingGiftMedia ? "Uploading..." : "Upload New Gift Image"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingGiftMedia}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await handleUploadGiftFile(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Standard 4 Tier Presets Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" /> Milestone Tier Default Photography
              </span>
              <span className="text-[11px] text-slate-500">Live assets wired to reward levels</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  tier: 1,
                  threshold: 10,
                  name: "Signature Matte Bracelet Set",
                  url: "/sellers/gifts/milestone-10.webp",
                  desc: "Matte black & gold beads with branded luxury pouch",
                },
                {
                  tier: 2,
                  threshold: 25,
                  name: "Luxury ODESSI T-Shirt Gift Set",
                  url: "/sellers/gifts/milestone-25.webp",
                  desc: "Premium heavyweight organic cotton tee in matte presentation box",
                },
                {
                  tier: 3,
                  threshold: 50,
                  name: "Premium Hoodie & VIP Gift Box",
                  url: "/sellers/gifts/milestone-50.webp",
                  desc: "500 GSM embroidered French terry hoodie with gold accents",
                },
                {
                  tier: 4,
                  threshold: 100,
                  name: "Ambassador Luxury Gift Set",
                  url: "/sellers/gifts/milestone-100.webp",
                  desc: "All-black matte & gold presentation hamper with engraved seal",
                },
              ].map((preset) => (
                <div
                  key={preset.url}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:border-slate-300 transition group"
                >
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-amber-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      Level {preset.tier} &bull; {preset.threshold} Sales
                    </div>
                  </div>
                  <div className="p-3.5 space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{preset.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{preset.desc}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{preset.url}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(preset.url);
                          toast.success(`Copied asset path: ${preset.url}`);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition"
                        title="Copy image URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Storage Uploads Gallery */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-500" /> Uploaded &amp; Stored Gift Media
              </span>
              <span className="text-[11px] text-slate-500">
                {giftMedia.length} {giftMedia.length === 1 ? "file" : "files"} in storage
              </span>
            </div>

            {loadingGiftMedia ? (
              <div className="bg-white p-12 text-center text-slate-400 text-xs font-mono rounded-2xl border border-slate-200">
                Scanning seller gift media directory...
              </div>
            ) : giftMedia.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-2xl border border-dashed border-slate-200 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">No additional custom gift images uploaded yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  The 4 standard milestone assets above are active. Upload custom photography for special editions, promotional gifts, or revised packaging.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {giftMedia.map((item) => (
                  <div
                    key={item.filename}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs group hover:border-slate-300 transition"
                  >
                    <div className="relative aspect-square bg-slate-100 overflow-hidden">
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/sellers/gifts/milestone-10.webp";
                        }}
                      />
                      {item.isDefault && (
                        <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                          Default Preset
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="font-mono text-xs font-medium text-slate-900 truncate" title={item.filename}>
                        {item.filename}
                      </div>
                      {item.usedInMilestones && item.usedInMilestones.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.usedInMilestones.map((milestoneName) => (
                            <span
                              key={milestoneName}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-50 text-amber-800 border border-amber-200"
                            >
                              {milestoneName}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={item.url}>
                          {item.url}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.url);
                            toast.success(`Copied image URL: ${item.url}`);
                          }}
                          className="px-2 py-1 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded flex items-center gap-1 transition"
                        >
                          <Copy className="w-3 h-3" /> Copy URL
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 8: AUDIT HISTORY */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">System-wide Seller Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Immutable ledger of all admin decisions, status transitions, milestone unlocks, and attribution overrides.
              </p>
            </div>
            <button
              onClick={fetchGlobalAuditLogs}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Audit Trail
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {loadingGlobalAudit ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading audit logs...</div>
            ) : globalAuditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No audit events recorded yet.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Event ID</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Seller ID</th>
                    <th className="py-3.5 px-4">Acting Administrator</th>
                    <th className="py-3.5 px-4">Event Details</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {globalAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">#{log.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        {log.sellerId ? `#${log.sellerId}` : "System / Config"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {log.adminEmail || "Automated System"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(log.createdAt).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 9: WHOLESALE INQUIRIES (PRESERVED) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "wholesale" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search company or contact..."
                  value={wholesaleSearch}
                  onChange={(e) => setWholesaleSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-500 w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={wholesaleStatusFilter}
                  onChange={(e) => setWholesaleStatusFilter(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-800 text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchWholesale}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {loadingWholesale ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading partnership records...</div>
            ) : wholesaleApps.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No partnership applications found matching criteria.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Company</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">City</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {wholesaleApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">#{app.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{app.companyName}</td>
                      <td className="py-3.5 px-4">
                        <div>{app.contactName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{app.email} | {app.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">{app.city}</td>
                      <td className="py-3.5 px-4 font-mono uppercase text-[11px]">{app.businessType}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          app.status === "NEW" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          app.status === "CONTACTED" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          app.status === "QUALIFIED" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          app.status === "CONVERTED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedWholesaleApp(app);
                            setWholesaleNotes(app.internalNotes || "");
                          }}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800 transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Wholesale Drawer / Modal */}
          {selectedWholesaleApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white w-full max-w-xl rounded-2xl p-6 border border-slate-200 shadow-xl space-y-5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{selectedWholesaleApp.companyName}</h3>
                    <span className="text-xs text-slate-500 font-mono">Application #{selectedWholesaleApp.id}</span>
                  </div>
                  <button
                    onClick={() => setSelectedWholesaleApp(null)}
                    className="text-slate-400 hover:text-slate-800 text-sm font-semibold"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Person</span>
                    <span className="font-medium text-slate-900">{selectedWholesaleApp.contactName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                    <span className="font-mono text-slate-900">{selectedWholesaleApp.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                    <span className="font-mono text-slate-900">{selectedWholesaleApp.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">City</span>
                    <span className="text-slate-900">{selectedWholesaleApp.city}</span>
                  </div>
                </div>

                {selectedWholesaleApp.message && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Applicant Message</span>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedWholesaleApp.message}</p>
                  </div>
                )}

                {/* Status Workflow Buttons */}
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-2">Update Application Workflow Status</span>
                  <div className="flex flex-wrap gap-2">
                    {(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED"] as const).map((st) => (
                      <button
                        key={st}
                        disabled={updatingWholesaleStatus || selectedWholesaleApp.status === st}
                        onClick={() => handleUpdateWholesaleStatus(selectedWholesaleApp.id, st)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
                          selectedWholesaleApp.status === st
                            ? "bg-amber-500 text-slate-950 shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internal Notes (Admin Confidential) */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 uppercase flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      Internal Admin Notes (Confidential)
                    </label>
                    <span className="text-[10px] text-slate-400">Never exposed to customer</span>
                  </div>
                  <textarea
                    rows={3}
                    value={wholesaleNotes}
                    onChange={(e) => setWholesaleNotes(e.target.value)}
                    placeholder="Record deal terms, background checks, meeting notes..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                  <button
                    onClick={handleSaveWholesaleNotes}
                    disabled={savingWholesaleNotes}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingWholesaleNotes ? "Saving Notes..." : "Save Internal Notes"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
