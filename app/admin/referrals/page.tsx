"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getAdminReferrals,
  getAdminReferralSettings,
  updateAdminReferralSettings,
  getAdminReferralAnalytics,
  ReferralSettingsData,
  ReferralSettingsUpdatePayload,
  ReferralAnalyticsData,
} from "@/lib/api/admin";
import {
  Share2,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Settings,
  ToggleLeft,
  ToggleRight,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Save,
  Users,
  XCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ReferralRow {
  id: number;
  referrerName: string;
  referrerEmail: string;
  refereeName: string;
  refereeEmail: string;
  codeUsed: string;
  status: string;
  qualifyingOrderId: number | null;
  qualifyingOrderNumber: string | null;
  qualifyingOrderTotal: number | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "QUALIFIED") {
    return (
      <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> QUALIFIED
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border inline-flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
      <Clock className="w-3 h-3 text-amber-600" /> PENDING
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminReferralsPage() {
  // Audit data
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Settings state
  const [settings, setSettings] = useState<ReferralSettingsData | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Editable settings form state
  const [formEnabled, setFormEnabled] = useState(true);
  const [formReward, setFormReward] = useState<string>("100");
  const [formMinOrder, setFormMinOrder] = useState<string>("");
  const [formTrigger, setFormTrigger] = useState<"ORDER_DELIVERED" | "ORDER_PAID">("ORDER_DELIVERED");

  // Analytics
  const [analytics, setAnalytics] = useState<ReferralAnalyticsData | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminReferrals(page, 20);
      setReferrals(res.content || []);
    } catch (err) {
      console.error("Failed to load referrals", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const s = await getAdminReferralSettings();
      setSettings(s);
      // Populate form from backend — never hardcode amounts here
      setFormEnabled(s.enabled);
      setFormReward(String(s.referrerRewardAmount));
      setFormMinOrder(s.minimumOrderValue != null ? String(s.minimumOrderValue) : "");
      setFormTrigger(s.rewardTrigger);
    } catch (err) {
      console.error("Failed to load referral settings", err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const a = await getAdminReferralAnalytics();
      setAnalytics(a);
    } catch (err) {
      console.error("Failed to load referral analytics", err);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  useEffect(() => {
    fetchSettings();
    fetchAnalytics();
  }, [fetchSettings, fetchAnalytics]);

  // ── Settings save ────────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setSettingsError(null);
    setSettingsSuccess(false);

    const rewardVal = parseFloat(formReward);
    if (isNaN(rewardVal) || rewardVal < 0) {
      setSettingsError("Reward amount must be a valid number >= 0.");
      return;
    }

    const payload: ReferralSettingsUpdatePayload = {
      enabled: formEnabled,
      referrerRewardAmount: rewardVal,
      minimumOrderValue: formMinOrder.trim() !== "" ? parseFloat(formMinOrder) : null,
      rewardTrigger: formTrigger,
    };

    try {
      setSettingsSaving(true);
      const updated = await updateAdminReferralSettings(payload);
      setSettings(updated);
      setFormEnabled(updated.enabled);
      setFormReward(String(updated.referrerRewardAmount));
      setFormMinOrder(updated.minimumOrderValue != null ? String(updated.minimumOrderValue) : "");
      setFormTrigger(updated.rewardTrigger);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 4000);
      // Refresh analytics after settings change
      fetchAnalytics();
    } catch (err: any) {
      setSettingsError(err?.message || "Failed to save settings. Please try again.");
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── REFERRAL PROGRAM HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-500" />
            Referral Program
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin control centre for the referral program — settings, analytics, and audit matrix.
          </p>
        </div>

        {/* Program Status Badge */}
        {settings && (
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider border ${
              settings.enabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {settings.enabled ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> ACTIVE
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" /> DISABLED
              </>
            )}
          </div>
        )}
      </div>

      {/* ── SETTINGS + ANALYTICS ROW ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Settings Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Referral Program Settings
            </h2>
          </div>

          {settingsLoading ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              Loading settings...
            </div>
          ) : (
            <div className="p-5 space-y-5">

              {/* Program Enabled Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Program Status</div>
                  <div className="text-xs text-slate-500">
                    Disable to pause all new referral rewards
                  </div>
                </div>
                <button
                  onClick={() => setFormEnabled(!formEnabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    formEnabled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  }`}
                >
                  {formEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4" /> ENABLED
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" /> DISABLED
                    </>
                  )}
                </button>
              </div>

              {/* Reward per Referral */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Reward per Successful Referral (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <IndianRupee className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formReward}
                    onChange={(e) => setFormReward(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                    placeholder="100"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  This amount is read directly from the database by the customer account page.
                  No redeployment needed after saving.
                </p>
              </div>

              {/* Referred Customer Benefit — always 0, admin cannot change */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Referred Customer Benefit</div>
                  <div className="text-xs text-slate-500">
                    Referral program rewards only the referrer
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-600 uppercase">
                  NO REWARD
                </div>
              </div>

              {/* Reward Trigger */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Reward Trigger
                </label>
                <select
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value as "ORDER_DELIVERED" | "ORDER_PAID")}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white"
                >
                  <option value="ORDER_DELIVERED">Order Delivered</option>
                  <option value="ORDER_PAID">Order Paid (Payment Captured)</option>
                </select>
              </div>

              {/* Minimum Order Value (optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Minimum Qualifying Order Value (₹) — Optional
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <IndianRupee className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                    placeholder="Leave blank for no minimum"
                  />
                </div>
              </div>

              {/* Error / Success messages */}
              {settingsError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {settingsError}
                </div>
              )}
              {settingsSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Settings saved. Customer account will reflect the new amount immediately.
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {settingsSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {settingsSaving ? "Saving..." : "Save Referral Settings"}
              </button>

              {settings?.updatedAt && (
                <p className="text-[10px] text-slate-400 text-center font-mono">
                  Last updated: {new Date(settings.updatedAt).toLocaleString("en-IN")}
                  {settings.updatedBy ? ` by ${settings.updatedBy}` : ""}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Analytics Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Referral Performance
            </h2>
          </div>

          <div className="p-5">
            {/* Summary Info Bar */}
            {settings && (
              <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className={`font-bold uppercase ${settings.enabled ? "text-emerald-600" : "text-red-600"}`}>
                    {settings.enabled ? "ACTIVE" : "DISABLED"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Current Reward</span>
                  {/* Amount from DB — never hardcoded */}
                  <span className="font-bold text-slate-900 font-mono">
                    ₹{settings.referrerRewardAmount} per referral
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Referred Customer Benefit</span>
                  <span className="font-bold text-red-600 font-mono">NONE</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Trigger</span>
                  <span className="font-mono text-slate-700">
                    {settings.rewardTrigger === "ORDER_DELIVERED" ? "Order Delivered" : "Order Paid"}
                  </span>
                </div>
              </div>
            )}

            {/* Analytics Grid */}
            {analytics ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <Users className="w-4 h-4 text-slate-500 mb-2" />
                  <div className="text-xl font-bold font-mono text-slate-900">{analytics.totalReferrals}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
                    Total Referrals
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
                  <div className="text-xl font-bold font-mono text-emerald-700">{analytics.successfulReferrals}</div>
                  <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium mt-0.5">
                    Successful
                  </div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <Clock className="w-4 h-4 text-amber-600 mb-2" />
                  <div className="text-xl font-bold font-mono text-amber-700">{analytics.pendingReferrals}</div>
                  <div className="text-[10px] uppercase tracking-wider text-amber-600 font-medium mt-0.5">
                    Pending
                  </div>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                  <IndianRupee className="w-4 h-4 text-stone-600 mb-2" />
                  <div className="text-xl font-bold font-mono text-stone-900">
                    ₹{(analytics.totalRewardValue || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mt-0.5">
                    Rewards Issued
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                Loading analytics...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── REFERRAL AUDIT MATRIX ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Referral Audit Matrix
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              — trace referrals, qualifying orders, and reward status
            </p>
          </div>
          <button
            onClick={fetchReferrals}
            className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Loading referrals...
          </div>
        ) : referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Referrer</th>
                  <th className="p-3.5">Referred Customer</th>
                  <th className="p-3.5">Code Used</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Qualifying Order</th>
                  <th className="p-3.5">Order Total</th>
                  <th className="p-3.5">Referral Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{ref.referrerName || "Unknown"}</div>
                      <div className="text-[11px] font-mono text-slate-500">{ref.referrerEmail}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{ref.refereeName || "Unknown"}</div>
                      <div className="text-[11px] font-mono text-slate-500">{ref.refereeEmail}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-600">
                      {ref.codeUsed}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={ref.status} />
                    </td>
                    <td className="p-3.5">
                      {ref.qualifyingOrderNumber ? (
                        <Link
                          href={`/admin/orders/${ref.qualifyingOrderId}`}
                          className="inline-flex items-center gap-1 font-mono font-semibold text-slate-900 hover:text-amber-600 underline transition"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                          #{ref.qualifyingOrderNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {ref.qualifyingOrderTotal != null ? `₹${ref.qualifyingOrderTotal}` : "—"}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                      {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No customer referrals recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
