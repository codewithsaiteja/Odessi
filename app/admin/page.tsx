"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminDashboardStats, getAdminAuditLogs, AdminDashboardStats } from "@/lib/api/admin";
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
  CheckCircle2,
  Clock,
  ShieldCheck,
  Package,
  TrendingUp,
  Tag,
  Star,
  Truck,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"TODAY" | "7_DAYS" | "30_DAYS" | "90_DAYS" | "ALL">("30_DAYS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, auditData] = await Promise.all([
        getAdminDashboardStats(),
        getAdminAuditLogs(0, 5),
      ]);
      setStats(statsData);
      setRecentAudits(auditData?.content || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load executive commerce metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === "ADMIN") {
      fetchStats();
    }
  }, [user, authLoading]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-mono uppercase tracking-widest text-slate-500">
          Loading Authoritative Commerce Metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Control Bar & Quick Action Shortcuts */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Range:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
            {(["TODAY", "7_DAYS", "30_DAYS", "90_DAYS", "ALL"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded transition ${
                  timeRange === range
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "hover:text-slate-900"
                }`}
              >
                {range === "TODAY" ? "Today" : range === "7_DAYS" ? "7 Days" : range === "30_DAYS" ? "30 Days" : range === "90_DAYS" ? "90 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchStats}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Revalidate Data</span>
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#0B0F17] text-white font-medium rounded text-xs uppercase tracking-wider hover:bg-slate-800 transition shadow-2xs"
          >
            <Plus className="w-4 h-4 text-[#B89A5A]" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStats} className="underline text-red-800 font-semibold">Retry</button>
        </div>
      )}

      {/* KPI Cards Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
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
              <span>Captured sales balance</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              Total Orders
            </span>
            <div className="p-2.5 bg-blue-50 rounded-md">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono text-slate-900">
              {stats?.totalOrders || 0}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
              <span className="text-emerald-600 font-medium">
                {stats?.confirmedCount || 0} Confirmed
              </span>
              <span>•</span>
              <span className="text-amber-600 font-medium">
                {stats?.pendingPaymentCount || 0} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              Total Customers
            </span>
            <div className="p-2.5 bg-purple-50 rounded-md">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono text-slate-900">
              {stats?.totalCustomers || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Registered customer accounts</p>
          </div>
        </div>

        {/* Catalog & Low Stock */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
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
              <h3 className="text-2xl font-bold font-mono text-slate-900">
                {stats?.lowStockCount || 0}
              </h3>
              <span className="text-xs text-amber-600 font-medium">Low Stock</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats?.outOfStockCount || 0} out of stock variants
            </p>
          </div>
        </div>
      </div>

      {/* Quick Business Actions Grid */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
          Quick Management Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/products/new"
            className="flex flex-col items-center justify-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-center transition group"
          >
            <Plus className="w-5 h-5 text-[#B89A5A] mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">Add Product</span>
          </Link>
          <Link
            href="/admin/inventory"
            className="flex flex-col items-center justify-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-center transition group"
          >
            <Layers className="w-5 h-5 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">Manage Stock</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex flex-col items-center justify-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-center transition group"
          >
            <ShoppingBag className="w-5 h-5 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">View Orders</span>
          </Link>
          <Link
            href="/admin/coupons"
            className="flex flex-col items-center justify-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-center transition group"
          >
            <Tag className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">Create Coupon</span>
          </Link>
          <Link
            href="/admin/reviews"
            className="flex flex-col items-center justify-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-center transition group"
          >
            <Star className="w-5 h-5 text-amber-500 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">Moderation</span>
          </Link>
          <Link
            href="/admin/shipping"
            className="flex flex-col items-center justify-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-center transition group"
          >
            <Truck className="w-5 h-5 text-slate-700 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">Shipping</span>
          </Link>
        </div>
      </div>

      {/* Main Insights Grid: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Orders
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Authoritative live order stream</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        #{order.orderNumber || order.id}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">
                          {order.customerName || order.userEmail || "Guest"}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">{order.userEmail}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        ₹{(order.totalAmount || order.total || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {order.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                            order.status === "CONFIRMED" || order.status === "DELIVERED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No orders recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Low Stock Alerts */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Low Stock Alerts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Variants below threshold</p>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Adjust →
            </Link>
          </div>

          <div className="flex-1 p-4 space-y-3">
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              stats.lowStockProducts.slice(0, 5).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50/60 border border-amber-200/80 rounded flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.productName || item.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      SKU: {item.sku || "N/A"} • Size: {item.size} • Color: {item.color}
                    </p>
                  </div>
                  <div className="text-right">
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
              <div className="py-10 text-center text-xs text-slate-400">
                All inventory levels are currently optimal.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Audit Logs Preview */}
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
            recentAudits.map((log: any) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded uppercase">
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-800">{log.entityName || log.entityType}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 truncate max-w-xs">{log.details}</span>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-400">
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
