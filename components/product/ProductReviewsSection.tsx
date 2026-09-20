"use client";

import React, { useEffect, useState } from "react";
import {
  getProductReviews,
  getProductRatingSummary,
  submitProductReview,
  ProductReview,
  ProductRatingSummary,
} from "@/lib/api/reviews";
import { useAuth } from "@/lib/auth/AuthContext";
import { Star, CheckCircle, Loader2, MessageSquare, Plus, AlertCircle } from "lucide-react";

export default function ProductReviewsSection({ productId }: { productId: number }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Review Submission Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [orderId, setOrderId] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [revRes, sumRes] = await Promise.all([
        getProductReviews(productId, 0, 20),
        getProductRatingSummary(productId),
      ]);
      setReviews(revRes.content);
      setSummary(sumRes);
    } catch (e) {
      console.error("Failed to load product reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      setError("Order ID is required to verify your purchase.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await submitProductReview(productId, {
        orderId: Number(orderId),
        rating,
        title: title || undefined,
        comment,
      });
      setModalOpen(false);
      setSuccessMessage("Thank you! Your verified review was submitted and is pending moderation.");
      setOrderId("");
      setTitle("");
      setComment("");
      setRating(5);
    } catch (err: any) {
      setError(err?.message || "Failed to submit review. Ensure you own an eligible paid order for this product.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center space-x-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= score ? "fill-amber-500 text-amber-500" : "text-neutral-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="py-12 border-t border-[var(--color-odessi-smoke)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="type-h2 text-[var(--color-odessi-black)]">CUSTOMER REVIEWS</h2>
          {summary && (
            <div className="flex items-center space-x-3 mt-2">
              {renderStars(Math.round(summary.averageRating))}
              <span className="text-sm font-bold text-neutral-900">
                {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "0.0"} out of 5
              </span>
              <span className="text-xs text-neutral-500">
                ({summary.totalReviews} verified review{summary.totalReviews === 1 ? "" : "s"})
              </span>
            </div>
          )}
        </div>

        {user && (
          <button
            onClick={() => {
              setError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-[var(--color-odessi-black)] hover:bg-[var(--color-odessi-stone)] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Write a Verified Review</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-600 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Review List */}
      {loading ? (
        <div className="p-8 text-center text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          <p className="text-xs font-medium">Loading verified reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 text-center bg-neutral-50 border border-neutral-200 rounded-sm text-neutral-500">
          <MessageSquare className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
          <p className="font-semibold text-neutral-800">No verified reviews yet</p>
          <p className="text-xs text-neutral-500 mt-1">
            Be the first verified customer to share feedback on this product!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-6 bg-white border border-neutral-200 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {renderStars(rev.rating)}
                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded uppercase">
                      <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> Verified Purchase
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-400">
                  {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {rev.title && <h3 className="font-bold text-neutral-900 text-sm">{rev.title}</h3>}
              <p className="text-sm text-neutral-700 leading-relaxed">{rev.comment}</p>
              <p className="text-xs font-medium text-neutral-500 pt-1">— {rev.userName}</p>
            </div>
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xl max-w-md w-full overflow-hidden text-neutral-900">
            <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide">Write a Verified Review</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Order ID / Reference Number</label>
                <input
                  type="number"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter numeric order ID (e.g. 50)"
                  className="w-full px-3 py-2 border border-neutral-300 rounded font-mono focus:outline-hidden focus:border-neutral-900"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Backend verifies that you purchased this item in a confirmed order.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Rating Score</label>
                <div className="flex items-center space-x-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= rating ? "fill-amber-500 text-amber-500" : "text-neutral-300"}`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-sm text-neutral-800 ml-2">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Review Headline (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Perfect fit and luxurious feel"
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Review Details</label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with fit, fabric quality, and finish..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded font-semibold hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-semibold inline-flex items-center space-x-2 transition"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? "Submitting..." : "Submit Review"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
