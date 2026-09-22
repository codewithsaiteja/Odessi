"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  getAdminReviews,
  approveReview,
  rejectReview,
  deleteReview,
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
  ThumbsUp,
  ThumbsDown,
  Trash2,
  RefreshCw,
  Search,
  Check,
  X,
} from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewStatus | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [moderatingId, setModeratingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = activeTab === "ALL" ? undefined : activeTab;
      const res = await getAdminReviews(statusParam, 0, 100);
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

  const handleApprove = async (id: number) => {
    try {
      setModeratingId(id);
      setError(null);
      await approveReview(id);
      setSuccessMessage("Review approved successfully");
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadReviews();
    } catch (err: any) {
      setError(err?.message || "Failed to approve review");
    } finally {
      setModeratingId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setModeratingId(id);
      setError(null);
      await rejectReview(id);
      setSuccessMessage("Review rejected");
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadReviews();
    } catch (err: any) {
      setError(err?.message || "Failed to reject review");
    } finally {
      setModeratingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this review as spam? This action is logged.")) {
      return;
    }
    try {
      setDeletingId(id);
      setError(null);
      await deleteReview(id);
      setSuccessMessage("Review permanently deleted");
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadReviews();
    } catch (err: any) {
      setError(err?.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter(
      (r) =>
        r.productName?.toLowerCase().includes(q) ||
        r.userName?.toLowerCase().includes(q) ||
        r.orderNumber?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
    );
  }, [reviews, searchQuery]);

  const stats = useMemo(() => {
    const pending = reviews.filter((r) => r.status === "PENDING").length;
    const approved = reviews.filter((r) => r.status === "APPROVED").length;
    const rejected = reviews.filter((r) => r.status === "REJECTED").length;
    return { pending, approved, rejected, total: reviews.length };
  }, [reviews]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Product Reviews & Moderation
            </h2>
          </div>
          <p className="text-sm text-stone-500 mt-1.5 max-w-2xl">
            Customer reviews submitted exclusively by verified purchasers. Approving a review publishes it to the storefront product page and updates the live ratings.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadReviews}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold rounded transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls Bar: Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-2">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {(
            [
              { key: "PENDING", label: "Pending" },
              { key: "APPROVED", label: "Approved" },
              { key: "REJECTED", label: "Rejected" },
              { key: "ALL", label: "All Reviews" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition -mb-2 ${
                activeTab === tab.key
                  ? "border-stone-900 text-stone-950 font-bold bg-white"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300"
              }`}
            >
              {tab.label}
              {tab.key === "PENDING" && stats.pending > 0 && (
                <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search reviews, products, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-stone-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            <p className="text-sm font-medium">Loading moderation queue...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-16 text-center text-stone-500">
            <Star className="w-12 h-12 mx-auto text-stone-300 mb-3" />
            <p className="font-semibold text-stone-800">No reviews found</p>
            <p className="text-xs text-stone-400 mt-1">
              {activeTab === "PENDING"
                ? "No reviews are currently awaiting moderation."
                : "No reviews match your current filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 uppercase font-mono tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Product & Order</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Rating</th>
                  <th className="py-3.5 px-4 font-semibold">Review</th>
                  <th className="py-3.5 px-4 font-semibold">Recommendation</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredReviews.map((r) => {
                  const isBusy = moderatingId === r.id || deletingId === r.id;
                  return (
                    <tr key={r.id} className="hover:bg-stone-50/60 transition">
                      {/* Product & Order */}
                      <td className="py-4 px-4 font-medium text-stone-900 max-w-xs">
                        <div className="flex items-start space-x-2">
                          <Package className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-stone-900 line-clamp-1">{r.productName}</p>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[10px] font-mono text-stone-500">
                                #{r.orderNumber}
                              </span>
                              {r.verifiedPurchase && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
                                  VERIFIED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4 text-stone-800">
                        <div className="flex items-center space-x-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                          <span className="truncate">{r.userName}</span>
                        </div>
                        <p className="text-[10px] font-mono text-stone-400 mt-1">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {renderStars(r.rating)}
                        <span className="text-[11px] font-mono font-bold text-stone-900 mt-1 block">
                          {r.rating}.0 / 5.0
                        </span>
                      </td>

                      {/* Review Content */}
                      <td className="py-4 px-4 text-stone-800 max-w-sm">
                        {r.title && (
                          <p className="font-bold text-stone-950 mb-0.5 line-clamp-1">
                            {r.title}
                          </p>
                        )}
                        <p className="text-stone-600 line-clamp-3 leading-relaxed text-xs">
                          {r.comment}
                        </p>
                      </td>

                      {/* Recommendation */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {r.recommended === true ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ThumbsUp className="w-3 h-3 text-emerald-600" />
                            <span>Recommends</span>
                          </span>
                        ) : r.recommended === false ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                            <ThumbsDown className="w-3 h-3 text-stone-500" />
                            <span>Doesn't recommend</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {r.status === "APPROVED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1" /> Approved
                          </span>
                        ) : r.status === "REJECTED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3 h-3 mr-1" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </span>
                        )}
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {r.status !== "APPROVED" && (
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={isBusy}
                              title="Approve review"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}
                          {r.status !== "REJECTED" && (
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={isBusy}
                              title="Reject review"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-[11px] font-semibold transition disabled:opacity-50"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={isBusy}
                            title="Permanently delete spam review"
                            className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
