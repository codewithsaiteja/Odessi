"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminReviews,
  moderateReview,
  ProductReview,
  ReviewStatus,
} from "@/lib/api/reviews";
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Package,
  User,
} from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewStatus | "ALL">("PENDING");
  const [moderatingId, setModeratingId] = useState<number | null>(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = activeTab === "ALL" ? undefined : activeTab;
      const res = await getAdminReviews(statusParam, 0, 50);
      setReviews(res?.content || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [activeTab]);

  const handleModerate = async (id: number, status: ReviewStatus) => {
    try {
      setModeratingId(id);
      setError(null);
      await moderateReview(id, status);
      await loadReviews();
    } catch (err: any) {
      setError(err?.message || "Failed to update review status");
    } finally {
      setModeratingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Star className="w-6 h-6 text-amber-600 fill-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Product Reviews & Moderation Queue</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Backend-verified purchase reviews. Approving a review makes it publicly visible on the product details page and updates average ratings.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === tab
                ? "border-amber-500 text-slate-950 font-bold bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {tab === "PENDING"
              ? "Pending Moderation"
              : tab === "APPROVED"
              ? "Approved"
              : tab === "REJECTED"
              ? "Rejected"
              : "All Reviews"}
          </button>
        ))}
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Loading moderation queue...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Star className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No reviews found in this view</p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "PENDING"
                ? "All pending reviews have been moderated!"
                : "No customer reviews recorded yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Product & Order</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Rating</th>
                  <th className="py-3.5 px-4 font-semibold">Review Content</th>
                  <th className="py-3.5 px-4 font-semibold">Verification</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-medium text-slate-900 max-w-xs">
                      <div className="flex items-start space-x-2">
                        <Package className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold truncate text-slate-900">{r.productName}</p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            Order #{r.orderNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-800">
                      <div className="flex items-center space-x-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.userName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {renderStars(r.rating)}
                      <span className="text-[10px] font-mono font-bold text-slate-700 mt-1 block">
                        {r.rating} / 5
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-800 max-w-sm">
                      {r.title && <p className="font-bold text-slate-900 mb-0.5">{r.title}</p>}
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">{r.comment}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {r.verifiedPurchase ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> VERIFIED
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unverified</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {r.status === "APPROVED" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1" /> Approved
                        </span>
                      ) : r.status === "REJECTED" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3 mr-1" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {r.status !== "APPROVED" && (
                          <button
                            onClick={() => handleModerate(r.id, "APPROVED")}
                            disabled={moderatingId === r.id}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== "REJECTED" && (
                          <button
                            onClick={() => handleModerate(r.id, "REJECTED")}
                            disabled={moderatingId === r.id}
                            className="px-3 py-1 bg-slate-200 hover:bg-red-600 hover:text-white text-slate-700 rounded text-[11px] font-semibold transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
