"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAdminUserById, toggleAdminUserEnabled } from "@/lib/api/admin";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, User, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const toast = useToast();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await getAdminUserById(id);
      setCustomer(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const handleToggle = async () => {
    if (!confirm("Are you sure you want to toggle this customer account status?")) return;
    try {
      await toggleAdminUserEnabled(id);
      toast.success("Account status updated");
      fetchCustomer();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update account status");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-slate-500">
        Loading Customer Profile...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-12 text-center text-xs text-red-600 font-semibold">
        Customer account not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/users"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{customer.email}</p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition ${
            customer.enabled
              ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
          }`}
        >
          {customer.enabled ? "Disable Account" : "Enable Account"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Account Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5 shadow-2xs">
          <span className="text-[11px] uppercase font-mono font-semibold text-slate-500">Security Role</span>
          <p className="text-sm font-bold text-slate-900 font-mono">{customer.role}</p>
          <span className="text-[11px] text-emerald-600 font-medium block">
            {customer.emailVerified ? "Verified Email" : "Unverified Email"}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5 shadow-2xs">
          <span className="text-[11px] uppercase font-mono font-semibold text-slate-500">Lifetime Orders</span>
          <p className="text-2xl font-bold text-slate-900">{customer.orderCount || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5 shadow-2xs">
          <span className="text-[11px] uppercase font-mono font-semibold text-slate-500">Registration Date</span>
          <p className="text-sm font-semibold text-slate-900 font-mono">
            {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
        <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
          Order History ({customer.recentOrders?.length || 0})
        </h2>

        {customer.recentOrders && customer.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customer.recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-semibold text-slate-900">{o.orderNumber}</td>
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">₹{o.totalAmount}</td>
                    <td className="p-3 font-mono text-[11px] font-semibold text-slate-700">{o.paymentStatus}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No previous orders for this customer account.</p>
        )}
      </div>
    </div>
  );
}
