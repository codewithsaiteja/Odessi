"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  ShippingMethod,
  ShippingMethodRequest,
} from "@/lib/api/shipping";
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ShippingMethodRequest>({
    name: "",
    code: "",
    charge: 0,
    freeShippingThreshold: null,
    estimatedDays: "",
    active: true,
  });

  const loadMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminShippingMethods();
      setMethods(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load shipping methods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleOpenCreate = () => {
    setEditingMethod(null);
    setFormData({
      name: "",
      code: "",
      charge: 150,
      freeShippingThreshold: 1999,
      estimatedDays: "3-5 Business Days",
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (m: ShippingMethod) => {
    setEditingMethod(m);
    setFormData({
      name: m.name,
      code: m.code,
      charge: m.charge,
      freeShippingThreshold: m.freeShippingThreshold,
      estimatedDays: m.estimatedDays || "",
      active: m.active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const requestPayload: ShippingMethodRequest = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        charge: Number(formData.charge),
        freeShippingThreshold: formData.freeShippingThreshold ? Number(formData.freeShippingThreshold) : null,
        estimatedDays: formData.estimatedDays,
        active: formData.active,
      };

      if (editingMethod) {
        await updateShippingMethod(editingMethod.id, requestPayload);
      } else {
        await createShippingMethod(requestPayload);
      }

      setModalOpen(false);
      await loadMethods();
    } catch (err: any) {
      setError(err?.message || "Failed to save shipping method");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete shipping method "${name}"?`)) return;
    try {
      setError(null);
      await deleteShippingMethod(id);
      await loadMethods();
    } catch (err: any) {
      setError(err?.message || "Failed to delete shipping method");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Shipping Authority & Rate Rules</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Backend-calculated shipping methods and free shipping thresholds. Frontend only submits the selected method code.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold uppercase tracking-wider transition"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Shipping Method</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Methods Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Loading shipping rules...</p>
          </div>
        ) : methods.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No shipping methods configured</p>
            <p className="text-xs text-slate-400 mt-1">Click "New Shipping Method" to add one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Method Name</th>
                  <th className="py-3.5 px-4 font-semibold">Identifier Code</th>
                  <th className="py-3.5 px-4 font-semibold">Standard Charge</th>
                  <th className="py-3.5 px-4 font-semibold">Free Threshold</th>
                  <th className="py-3.5 px-4 font-semibold">Delivery Time</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {methods.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-medium text-slate-900">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
                        {m.code}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-900 font-semibold">
                      ₹{typeof m.charge === "number" ? m.charge.toFixed(2) : "0.00"}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-700">
                      {m.freeShippingThreshold != null && typeof m.freeShippingThreshold === "number" ? (
                        <span className="text-emerald-700 font-semibold">
                          ₹{m.freeShippingThreshold.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.estimatedDays || "—"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {m.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <XCircle className="w-3 h-3 mr-1" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                          title="Edit shipping rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.name)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                          title="Delete shipping method"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide">
                {editingMethod ? "Edit Shipping Method" : "New Shipping Method"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Method Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Standard Delivery"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Method Code (Unique Identifier)</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. STANDARD"
                  className="w-full px-3 py-2 border border-slate-300 rounded uppercase font-mono focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Base Charge (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.charge}
                    onChange={(e) => setFormData({ ...formData, charge: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Free Threshold (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.freeShippingThreshold ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeShippingThreshold: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="Leave empty if none"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Estimated Delivery Time</label>
                <input
                  type="text"
                  value={formData.estimatedDays}
                  onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                  placeholder="e.g. 3-5 Business Days"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <label htmlFor="active" className="text-slate-700 font-medium cursor-pointer">
                  Active and selectable by customers at checkout
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold inline-flex items-center space-x-2 transition"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? "Saving..." : "Save Shipping Method"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
