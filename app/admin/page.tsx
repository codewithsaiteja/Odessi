"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminDashboardStats,
  getAdminAuditLogs,
  AdminDashboardStats,
  DashboardOrderSummary,
} from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ShoppingBag,
  IndianRupee,
  Users,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
  Layers,
  ShieldCheck,
  Tag,
  Star,
  Truck,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

// ── Range options ────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { value: "TODAY",   label: "Today" },
  { value: "7_DAYS",  label: "7 Days" },
  { value: "30_DAYS", label: "30 Days" },
  { value: "90_DAYS", label: "90 Days" },
  { value: "ALL",     label: "All Time" },
] as const;

type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

// ── Order/Payment status colour helpers ──────────────────────────────────────

function orderStatusClass(status: string): string {
  switch (status) {
    case "CONFIRMED":
    case "PROCESSING":
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
    case "DELIVERED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "PENDING":
    case "PENDING_PAYMENT":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "CANCELLED":
    case "PAYMENT_FAILED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function paymentStatusClass(status: string): string {
  switch (status) {
    case "CAPTURED":
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "AUTHORIZED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "FAILED":
    case "REFUNDED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

// ── Error status message helper ───────────────────────────────────────────────

function friendlyErrorMessage(err: any): string {
  if (err?.status === 401) return "Session expired. Please sign in again.";
  if (err?.status === 403) return "You are not authorized to view admin data.";
  if (err?.status === 429) return "Too many requests. Please wait a moment and retry.";
  if (err?.status >= 500) return "Server error. Our team has been notified. Please retry.";
  if (err?.errorCode === "NETWORK_ERROR" || err?.status === 0)
    return "Cannot reach the backend server. Check that it is running.";
  return err?.message || "Dashboard data could not be loaded.";
}

// ── Skeleton components ───────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="w-10 h-10 bg-slate-200 rounded-md" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-8 w-28 bg-slate-200 rounded" />
        <div className="h-3 w-36 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

function OrderRowSkeleton() {
  return (
    <tr className="border-b border-slate-100">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <td key={n} className="py-3 px-4">
          <div className="h-3 bg-slate-200 rounded animate-pulse" style={{ width: n === 1 ? "5rem" : n === 2 ? "8rem" : "4rem" }} />
        </td>
      ))}
    </tr>
  );
}

function LowStockRowSkeleton() {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded animate-pulse flex items-center justify-between">
      <div className="space-y-1.5">
        <div className="h-3 w-28 bg-slate-200 rounded" />
        <div className="h-2 w-40 bg-slate-100 rounded" />
      </div>
      <div className="h-4 w-10 bg-slate-200 rounded" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<RangeValue>("30_DAYS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dashboard stats for the currently selected range.
   * Wrapped in useCallback so it can be safely listed in dependency arrays.
   */
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, auditData] = await Promise.all([
        getAdminDashboardStats(timeRange),
        getAdminAuditLogs(0, 5),
      ]);
      setStats(statsData);
      setRecentAudits(auditData?.content || []);
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Refetch whenever the selected range changes (or auth resolves).
  useEffect(() => {
    if (!authLoading && user && user.role === "ADMIN") {
      fetchStats();
    }
  }, [user, authLoading, fetchStats]);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  // AuthContext handles redirect for unauthenticated users; just show
  // a spinner here while auth resolves.
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-mono uppercase tracking-widest text-slate-500">
          Authenticating...
        </p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Control Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        {/* Range selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Range:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600 flex-wrap gap-0.5">
            {RANGE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTimeRange(value)}
                disabled={loading}
                className={`px-3 py-1 rounded transition disabled:cursor-not-allowed ${
                  timeRange === value
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchStats}
            disabled={loading}
            aria-label="Revalidate dashboard data"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed rounded text-xs font-medium text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Revalidate Data</span>
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B0F17] text-white font-medium rounded text-xs uppercase tracking-wider hover:bg-slate-800 transition shadow-2xs"
          >
            <Plus className="w-4 h-4 text-[#B89A5A]" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>{error}</span>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="underline text-red-800 font-semibold whitespace-nowrap disabled:opacity-60"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Revenue */}
        {loading && !stats ? (
          <KpiSkeleton />
        ) : (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                Total Revenue
              </span>
              <div className="p-2.5 bg-emerald-50 rounded-md">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold font-mono text-slate-900">
                ₹{(stats?.totalRevenue || 0).toLocaleString("en-IN")}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Captured &amp; paid orders only</span>
              </p>
            </div>
          </div>
        )}

        {/* Total Orders */}
        {loading && !stats ? (
          <KpiSkeleton />
        ) : (
          <Link
            href="/admin/orders"
            className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between h-full hover:border-blue-300 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                Total Orders
              </span>
              <div className="p-2.5 bg-blue-50 rounded-md">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold font-mono text-slate-900 group-hover:text-blue-700 transition">
                {stats?.totalOrders ?? 0}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                <span className="text-emerald-600 font-medium">
                  {stats?.confirmedCount ?? 0} Confirmed
                </span>
                <span>•</span>
                <span className="text-amber-600 font-medium">
                  {stats?.pendingPaymentCount ?? 0} Pending
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Total Customers */}
        {loading && !stats ? (
          <KpiSkeleton />
        ) : (
          <Link
            href="/admin/users"
            className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between h-full hover:border-purple-300 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                Total Customers
              </span>
              <div className="p-2.5 bg-purple-50 rounded-md">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold font-mono text-slate-900 group-hover:text-purple-700 transition">
                {stats?.totalCustomers ?? 0}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Registered customer accounts</p>
            </div>
          </Link>
        )}

        {/* Inventory Alerts */}
        {loading && !stats ? (
          <KpiSkeleton />
        ) : (
          <Link
            href="/admin/inventory"
            className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between h-full hover:border-amber-300 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                Inventory Alerts
              </span>
              <div className="p-2.5 bg-amber-50 rounded-md">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold font-mono text-slate-900 group-hover:text-amber-700 transition">
                  {stats?.lowStockCount ?? 0}
                </h3>
                <span className="text-xs text-amber-600 font-medium">Low Stock</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {stats?.outOfStockCount ?? 0} out of stock variant{(stats?.outOfStockCount ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* ── Quick Management Actions ───────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
          Quick Management Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/admin/products/new", icon: Plus,        label: "Add Product",   color: "text-[#B89A5A]" },
            { href: "/admin/inventory",    icon: Layers,      label: "Manage Stock",  color: "text-blue-600" },
            { href: "/admin/orders",       icon: ShoppingBag, label: "View Orders",   color: "text-emerald-600" },
            { href: "/admin/coupons",      icon: Tag,         label: "Create Coupon", color: "text-purple-600" },
            { href: "/admin/reviews",      icon: Star,        label: "Moderation",    color: "text-amber-500" },
            { href: "/admin/shipping",     icon: Truck,       label: "Shipping",      color: "text-slate-700" },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-center transition group min-h-[72px]"
            >
              <Icon className={`w-5 h-5 ${color} mb-1.5 group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-semibold text-slate-800">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main insights grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Orders
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {timeRange === "ALL" ? "All-time order stream" : `Orders in selected range`} · latest {stats?.recentOrders?.length ?? 0} shown
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[180px]">
            {loading && !stats ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    {["Order ID", "Customer", "Amount", "Payment", "Status", "Action"].map((h) => (
                      <th key={h} className="py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((n) => <OrderRowSkeleton key={n} />)}
                </tbody>
              </table>
            ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentOrders.map((order: DashboardOrderSummary) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        #{order.orderNumber || order.id}
                      </td>
                      <td className="py-3 px-4 max-w-[140px]">
                        <p className="font-semibold text-slate-800 truncate">
                          {order.customerName || "Guest"}
                        </p>
                        {order.customerEmail && (
                          <p className="text-[10px] font-mono text-slate-400 truncate">
                            {order.customerEmail}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        ₹{(order.totalAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase border ${paymentStatusClass(order.paymentStatus)}`}
                        >
                          {order.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase border ${orderStatusClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs text-blue-600 hover:underline font-semibold whitespace-nowrap"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-400">
                <ShoppingBag className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">No orders yet</p>
                <p className="text-xs mt-1">
                  {timeRange === "TODAY"
                    ? "No orders have been placed today."
                    : timeRange === "ALL"
                    ? "Once your first customer order is placed, it will appear here."
                    : `No orders in the last ${RANGE_OPTIONS.find(r => r.value === timeRange)?.label.toLowerCase()}.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts (1/3 width) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Low Stock Alerts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Variants below threshold (≤5)</p>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0"
            >
              Adjust →
            </Link>
          </div>

          <div className="flex-1 p-4 space-y-2.5 overflow-y-auto">
            {loading && !stats ? (
              <>
                <LowStockRowSkeleton />
                <LowStockRowSkeleton />
                <LowStockRowSkeleton />
              </>
            ) : stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              stats.lowStockProducts.map((item, idx) => (
                <div
                  key={`low-stock-${item.variantId ?? item.sku ?? idx}`}
                  className="p-3 bg-amber-50/60 border border-amber-200/80 rounded flex items-center justify-between text-xs gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      SKU: {item.sku || "N/A"} · {item.size} / {item.color}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-red-600 block">
                      {item.stockQuantity} left
                    </span>
                    <Link
                      href="/admin/inventory"
                      className="text-[10px] text-amber-800 font-semibold underline"
                    >
                      Restock
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-xs font-medium text-slate-500">All inventory levels are healthy.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No variants below threshold.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── System Audit Logs Preview ─────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B89A5A]" />
              <span>Recent Operations Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Immutable administrative action log</p>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Full Audit Trail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentAudits.length > 0 ? (
            recentAudits.map((log: any, idx: number) => (
              <div key={`audit-${log.id ?? idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50 transition gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded uppercase shrink-0">
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-800 truncate">{log.entityName || log.entityType}</span>
                  <span className="text-slate-400 shrink-0">•</span>
                  <span className="text-slate-600 truncate max-w-xs">{log.details}</span>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString("en-IN")}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No recent audit logs available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
