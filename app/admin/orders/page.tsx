"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminOrders } from "@/lib/api/admin";
import { ShoppingBag, Eye, RefreshCw } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAdminOrders(page, 20, statusFilter);
      setOrders(res.content || []);
    } catch (err) {
      console.error("Failed to fetch admin orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Order Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational order workflows, status transitions, and immutable historical item snapshots
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
          </select>

          <button
            onClick={fetchOrders}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Loading Customer Orders...
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Order Number</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5">Customer & City</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Fulfillment Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-semibold text-slate-900">{order.orderNumber}</td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-900">
                        {order.shippingAddress?.fullName || `Customer #${order.userId}`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {order.shippingAddress?.city || "N/A"}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">₹{order.totalAmount}</td>
                    <td className="p-3.5 font-mono text-[11px] font-semibold text-slate-700">
                      {order.paymentStatus}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border ${
                          order.status === "CONFIRMED" || order.status === "DELIVERED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : order.status === "CANCELLED" || order.status === "PAYMENT_FAILED"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No orders found matching filter.
          </div>
        )}
      </div>
    </div>
  );
}
