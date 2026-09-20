"use client";

import React, { useEffect, useState } from "react";
import { getAdminInventory, adjustAdminInventory, getAdminInventoryLogs } from "@/lib/api/admin";
import { Layers, Plus, Minus, History, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminInventoryPage() {
  const [variants, setVariants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState<"stock" | "logs">("stock");

  // Adjustment Modal
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [delta, setDelta] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (tab === "stock") {
        const res = await getAdminInventory(page, 20);
        setVariants(res.content || []);
        setTotalPages(res.totalPages || 1);
      } else {
        const res = await getAdminInventoryLogs(page, 20);
        setLogs(res.content || []);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, tab]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || delta === 0 || !reason.trim()) {
      setError("Please specify a non-zero delta and adjustment reason");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await adjustAdminInventory({
        variantId: selectedVariant.id,
        quantityChange: delta,
        reason: reason.trim(),
      });
      setSelectedVariant(null);
      setDelta(0);
      setReason("");
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to adjust inventory");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Inventory & Stock Delta</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Concurrency-safe delta stock operations and immutable audit trail
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setTab("stock");
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              tab === "stock"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Variant Stock
          </button>
          <button
            onClick={() => {
              setTab("logs");
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              tab === "logs"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Audit Log
          </button>
        </div>
      </div>

      {tab === "stock" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-slate-500">
              Loading Variant Stock Levels...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">SKU</th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Variant</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Available Stock</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {variants.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-semibold text-slate-900">{v.sku}</td>
                      <td className="p-3.5 font-medium text-slate-900">{v.productName || "Odessi Product"}</td>
                      <td className="p-3.5">{v.color} / {v.size}</td>
                      <td className="p-3.5 font-mono font-semibold text-slate-900">₹{v.price}</td>
                      <td className="p-3.5 font-mono font-bold">
                        <span className={v.stockQuantity <= 5 ? "text-red-600" : "text-emerald-600"}>
                          {v.stockQuantity}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedVariant(v);
                            setDelta(0);
                            setReason("Stock adjustment");
                            setError(null);
                          }}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-[11px] transition shadow-2xs"
                        >
                          Adjust Delta
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-slate-500">
              Loading Inventory Audit History...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">SKU</th>
                    <th className="p-3.5">Product & Variant</th>
                    <th className="p-3.5">Delta</th>
                    <th className="p-3.5">Transition</th>
                    <th className="p-3.5">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-slate-900">{log.sku}</td>
                      <td className="p-3.5 font-medium">{log.productName} ({log.variantName})</td>
                      <td className="p-3.5 font-mono font-bold">
                        <span className={log.quantityChange > 0 ? "text-emerald-600" : "text-red-600"}>
                          {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-medium text-slate-900">
                        {log.previousQuantity} $\rightarrow$ {log.resultingQuantity}
                      </td>
                      <td className="p-3.5 text-slate-600">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delta Adjustment Dialog Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Adjust Variant Inventory Delta
            </h3>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <p><span className="font-semibold text-slate-700">SKU:</span> <span className="font-mono">{selectedVariant.sku}</span></p>
              <p><span className="font-semibold text-slate-700">Current Stock:</span> <span className="font-mono font-bold text-slate-900">{selectedVariant.stockQuantity}</span></p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Delta (+/-) *
                </label>
                <input
                  type="number"
                  required
                  value={delta}
                  onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono font-bold"
                  placeholder="e.g. +10 or -2"
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Resulting Stock: <span className="font-bold text-slate-900">{selectedVariant.stockQuantity + delta}</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Reason *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  placeholder="New stock shipment received / Damaged item"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || delta === 0}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs tracking-wider uppercase hover:bg-slate-800 transition"
                >
                  Apply Delta Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
