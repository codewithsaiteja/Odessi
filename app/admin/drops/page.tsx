"use client";

import { useEffect, useState, useCallback } from "react";
import { growthApi } from "@/lib/api";
import { Product } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { Timer, Lock, CheckCircle, Save } from "lucide-react";

export default function AdminDropsPage() {
  const toast = useToast();
  const [drops, setDrops] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrop, setIsDrop] = useState(false);
  const [dropTitle, setDropTitle] = useState("");
  const [dropDescription, setDropDescription] = useState("");
  const [launchAt, setLaunchAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(0);

  useEffect(() => {
    setNowTimestamp(Date.now());
  }, []);

  const fetchDrops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await growthApi.getDrops({ page: 0, size: 50 });
      setDrops(res.content || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load drop configurations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  const handleOpenConfig = (p: Product) => {
    setSelectedProduct(p);
    setIsDrop(Boolean(p.isDrop));
    setDropTitle(p.dropTitle || p.name);
    setDropDescription(p.dropDescription || p.shortDescription || "");
    if (p.launchAt) {
      const date = new Date(p.launchAt);
      const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setLaunchAt(localIso);
    } else {
      setLaunchAt("");
    }
  };

  const handleSaveDrop = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const isoLaunchAt = launchAt ? new Date(launchAt).toISOString() : undefined;
      const updated = await growthApi.configureDrop(Number(selectedProduct.id), {
        isDrop,
        dropTitle: isDrop ? dropTitle : undefined,
        dropDescription: isDrop ? dropDescription : undefined,
        launchAt: isDrop ? isoLaunchAt : undefined,
      });

      setDrops((prev) => prev.map((item) => (item.id === selectedProduct.id ? updated : item)));
      setSelectedProduct(null);
      toast.success("Drop configuration saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to configure drop";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Timer className="w-5 h-5 text-amber-500" /> Limited Drops Management
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure server-authoritative release dates and timed drops for products. Unreleased drop products are strictly locked across cart, buy now, and order creation.
        </p>
      </div>

      {/* Drops Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading drop catalog...</div>
        ) : drops.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No products found in catalog.</div>
        ) : (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Drop Mode</th>
                <th className="py-3.5 px-4">Drop Title</th>
                <th className="py-3.5 px-4">Server Launch Date (UTC)</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4 text-right">Configure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {drops.map((item) => {
                const launchTime = item.launchAt ? new Date(item.launchAt).getTime() : null;
                const isReleased = !launchTime || (nowTimestamp > 0 && launchTime <= nowTimestamp);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">#{item.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.isDrop
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {item.isDrop ? "ACTIVE DROP" : "STANDARD"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{item.dropTitle || "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {item.launchAt ? new Date(item.launchAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isDrop ? (
                        isReleased ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Released (Purchasable)
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Locked (Unreleased)
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">Purchasable</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenConfig(item)}
                        className="px-3 py-1 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800 transition"
                      >
                        Configure Drop
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drop Configuration Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Configure Drop Settings</h3>
                <span className="text-xs text-slate-500">Product: {selectedProduct.name} (#{selectedProduct.id})</span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-800 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Enable Limited Drop Mode</span>
                  <span className="text-[10px] text-slate-500">Locks purchase until server reach launch date</span>
                </div>
                <input
                  type="checkbox"
                  checked={isDrop}
                  onChange={(e) => setIsDrop(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {isDrop && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Drop Marketing Title
                    </label>
                    <input
                      type="text"
                      value={dropTitle}
                      onChange={(e) => setDropTitle(e.target.value)}
                      placeholder="e.g. CINEMATIC CAPSULE — DROP 01"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Drop Description / Narrative
                    </label>
                    <textarea
                      rows={3}
                      value={dropDescription}
                      onChange={(e) => setDropDescription(e.target.value)}
                      placeholder="Describe the limited release collection, story, or drop details..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Server Launch Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={launchAt}
                      onChange={(e) => setLaunchAt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Server time will strictly govern purchase capability. Client time is ignored.
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-2 text-xs font-semibold uppercase text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDrop}
                disabled={saving}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase rounded-lg shadow-sm flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

