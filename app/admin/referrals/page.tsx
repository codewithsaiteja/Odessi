"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminReferrals } from "@/lib/api/admin";
import { Share2, RefreshCw, CheckCircle2, Clock, ShoppingBag } from "lucide-react";

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await getAdminReferrals(page, 20);
      setReferrals(res.content || []);
    } catch (err) {
      console.error("Failed to load referrals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-500" />
            Referral Audit Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Trace customer referrals, code usages, qualifying orders, order values, and reward status
          </p>
        </div>

        <button
          onClick={fetchReferrals}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Referrals Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Loading Customer Referrals...
          </div>
        ) : referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Referrer</th>
                  <th className="p-3.5">Referred Customer</th>
                  <th className="p-3.5">Code Used</th>
                  <th className="p-3.5">Qualification Status</th>
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
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border inline-flex items-center gap-1 ${
                          ref.status === "QUALIFIED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {ref.status === "QUALIFIED" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> QUALIFIED
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" /> PENDING
                          </>
                        )}
                      </span>
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
                      {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : "—"}
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
