"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponActive,
  Coupon,
  CouponRequest,
  DiscountType,
} from "@/lib/api/coupons";
import {
  Tag,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Percent,
  DollarSign,
  Calendar,
  Users,
} from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CouponRequest>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 500,
    maxDiscountAmount: 500,
    startDate: null,
    expiryDate: null,
    totalUsageLimit: 100,
    perCustomerLimit: 1,
    active: true,
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminCoupons();
      setCoupons(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discountType: "PERCENTAGE",
      discountValue: 15,
      minOrderAmount: 1000,
      maxDiscountAmount: 500,
      startDate: null,
      expiryDate: null,
      totalUsageLimit: 500,
      perCustomerLimit: 1,
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount,
      maxDiscountAmount: c.maxDiscountAmount,
      startDate: c.startDate ? c.startDate.substring(0, 10) : null,
      expiryDate: c.expiryDate ? c.expiryDate.substring(0, 10) : null,
      totalUsageLimit: c.totalUsageLimit,
      perCustomerLimit: c.perCustomerLimit,
      active: c.active,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      setError(null);
      await toggleCouponActive(c.id);
      await loadCoupons();
    } catch (err: any) {
      setError(err?.message || "Failed to toggle coupon active status");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const requestPayload: CouponRequest = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        totalUsageLimit: formData.totalUsageLimit ? Number(formData.totalUsageLimit) : null,
        perCustomerLimit: formData.perCustomerLimit ? Number(formData.perCustomerLimit) : 1,
        active: formData.active,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, requestPayload);
      } else {
        await createCoupon(requestPayload);
      }

      setModalOpen(false);
      await loadCoupons();
    } catch (err: any) {
      setError(err?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Coupon & Promotion Engine</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Server-authoritative discount rules with atomic reservation (RESERVED $\rightarrow$ CONSUMED / RELEASED) and pessimistic locking limit checks.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold uppercase tracking-wider transition"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Coupon</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Loading promotional coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Tag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No coupons active or created</p>
            <p className="text-xs text-slate-400 mt-1">Click "New Coupon" to issue discount codes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Code</th>
                  <th className="py-3.5 px-4 font-semibold">Type & Value</th>
                  <th className="py-3.5 px-4 font-semibold">Min Order</th>
                  <th className="py-3.5 px-4 font-semibold">Max Discount</th>
                  <th className="py-3.5 px-4 font-semibold">Usage / Limit</th>
                  <th className="py-3.5 px-4 font-semibold">Per Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded tracking-wider">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800">
                      <div className="flex items-center space-x-1 font-semibold">
                        {c.discountType === "PERCENTAGE" ? (
                          <span className="text-blue-600 flex items-center">
                            <Percent className="w-3.5 h-3.5 mr-0.5" />
                            {c.discountValue}% OFF
                          </span>
                        ) : (
                          <span className="text-emerald-700 flex items-center">
                            ₹{typeof c.discountValue === "number" ? c.discountValue.toFixed(2) : "0.00"} FLAT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-700">
                      ₹{typeof c.minOrderAmount === "number" ? c.minOrderAmount.toFixed(2) : "0.00"}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-700">
                      {c.maxDiscountAmount != null && typeof c.maxDiscountAmount === "number" ? `₹${c.maxDiscountAmount.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <span className="font-bold text-slate-900">{c.timesUsed}</span>
                      <span className="text-slate-400"> / {c.totalUsageLimit ?? "∞"}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-700">
                      {c.perCustomerLimit} max
                    </td>
                    <td className="py-4 px-4">
                      {c.active ? (
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
                          onClick={() => handleToggleActive(c)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition"
                        >
                          {c.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                          title="Edit coupon"
                        >
                          <Edit2 className="w-4 h-4" />
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
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide">
                {editingCoupon ? "Edit Coupon" : "New Promotional Coupon"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. WELCOME10"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono uppercase focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Value ({formData.discountType === "PERCENTAGE" ? "%" : "₹"})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minOrderAmount ?? 0}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxDiscountAmount ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="Optional cap"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalUsageLimit ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalUsageLimit: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="Unlimited if empty"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Per-Customer Limit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.perCustomerLimit}
                    onChange={(e) => setFormData({ ...formData, perCustomerLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.startDate ?? ""}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiryDate ?? ""}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <label htmlFor="couponActive" className="text-slate-700 font-medium cursor-pointer">
                  Active for checkout validation & reservation
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
                  <span>{saving ? "Saving..." : "Save Coupon"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
