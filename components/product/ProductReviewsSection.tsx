"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  getProductReviews,
  getProductRatingSummary,
  checkReviewEligibility,
  submitProductReview,
  ProductReview,
  ProductRatingSummary,
  ReviewEligibilityResponse,
} from "@/lib/api/reviews";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatPrice, getMediaUrl } from "@/lib/product-utils";
import {
  Star,
  ShieldCheck,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";

interface ProductReviewsSectionProps {
  productId: number;
  productName?: string;
  productImage?: string;
}

export default function ProductReviewsSection({
  productId,
  productName = "Product",
  productImage,
}: ProductReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Eligibility & Modal State
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityNotice, setEligibilityNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields (ZERO client-supplied order ID!)
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [recommended, setRecommended] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [revRes, sumRes] = await Promise.all([
        getProductReviews(productId, 0, 50),
        getProductRatingSummary(productId),
      ]);
      setReviews(revRes.content || []);
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

  const handleOpenReviewModal = async () => {
    setError(null);
    setEligibilityNotice(null);

    if (!user) {
      setEligibilityNotice("Please sign in to your Odessi account to write a verified review.");
      return;
    }

    try {
      setEligibilityLoading(true);
      const eligibility: ReviewEligibilityResponse = await checkReviewEligibility(productId);

      if (eligibility.eligible) {
        setModalOpen(true);
      } else {
        setEligibilityNotice(
          eligibility.reason ||
            "Only verified purchasers of this product can submit a review."
        );
      }
    } catch (err: any) {
      // If server error or unauthenticated
      setEligibilityNotice(err?.message || "Unable to verify purchase status. Please try again.");
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write your review details.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Server resolves qualifying order automatically using authenticated user context
      await submitProductReview(productId, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        recommended,
      });

      setModalOpen(false);
      setSuccessMessage(
        "Thank you. Your verified review was submitted successfully and is pending moderation."
      );
      setTitle("");
      setComment("");
      setRating(5);
      setRecommended(true);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to submit review. Please ensure you own an eligible purchase.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (score: number, size = "w-4 h-4") => {
    return (
      <div className="flex items-center space-x-1 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= score ? "fill-amber-500 text-amber-500" : "text-stone-300"}`}
          />
        ))}
      </div>
    );
  };

  const resolvedThumb = getMediaUrl(productImage);

  // Rating distribution calculation
  const totalReviews = summary?.totalReviews ?? 0;
  const avgRating = summary?.averageRating ?? 0;
  const distribution = summary?.ratingDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div id="product-reviews" className="py-16 lg:py-24 border-t border-[var(--color-odessi-smoke)]">
      {/* Editorial Section Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--color-odessi-stone)] mb-2">
            Verified Customer Feedback
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[var(--color-odessi-black)] tracking-tight">
            CUSTOMER REVIEWS
          </h2>
        </div>

        <div>
          <button
            onClick={handleOpenReviewModal}
            disabled={eligibilityLoading}
            className="inline-flex items-center justify-center px-7 py-3.5 bg-[var(--color-odessi-black)] hover:bg-[var(--color-odessi-stone)] text-white text-[11px] font-semibold uppercase tracking-[0.2em] rounded-xs transition-colors duration-200 disabled:opacity-50"
          >
            {eligibilityLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
            ) : null}
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {eligibilityNotice && (
        <div className="p-4 mb-8 bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs rounded-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <p className="font-medium">{eligibilityNotice}</p>
          </div>
          <button
            onClick={() => setEligibilityNotice(null)}
            className="text-amber-700 hover:text-amber-900 font-bold ml-4"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 mb-8 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-amber-600 mb-3" />
          <p className="text-xs uppercase tracking-widest font-mono">Loading Reviews...</p>
        </div>
      ) : totalReviews === 0 ? (
        /* Luxury Empty State */
        <div className="py-16 px-6 text-center bg-[#FAF9F6] border border-stone-200/70 rounded-xs max-w-2xl mx-auto">
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <Star size={18} strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-lg text-stone-900 mb-2">
            BE THE FIRST TO SHARE YOUR EXPERIENCE
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed mb-6">
            Have you purchased this piece? Verified customers who complete an order are invited to review fit, fabric quality, and silhouette.
          </p>
          <button
            onClick={handleOpenReviewModal}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-[11px] uppercase tracking-widest font-semibold rounded-xs transition"
          >
            Write a Review
          </button>
        </div>
      ) : (
        /* Real Reviews & Authoritative Rating Distribution Breakdown */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Authoritative Rating Aggregate (Requirement 8 & 10) */}
          <div className="lg:col-span-4 bg-[#FAF9F6] border border-stone-200/80 p-6 sm:p-8 rounded-xs space-y-6">
            <div className="text-center pb-6 border-b border-stone-200">
              <div className="font-serif text-5xl sm:text-6xl text-stone-900 tracking-tight">
                {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
              </div>
              <div className="flex justify-center mt-3">
                {renderStars(Math.round(avgRating), "w-5 h-5")}
              </div>
              <p className="text-xs text-stone-500 font-mono mt-2 tracking-wide uppercase">
                Based on {totalReviews} verified {totalReviews === 1 ? "review" : "reviews"}
              </p>
              {summary?.recommendedPercentage !== undefined && (
                <p className="text-[11px] font-semibold text-emerald-800 mt-2 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                  {summary.recommendedPercentage}% of customers recommend this item
                </p>
              )}
            </div>

            {/* 5-Star Distribution Bars */}
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center text-xs text-stone-600 gap-3">
                    <span className="w-8 font-mono font-medium shrink-0 flex items-center gap-1">
                      {star} <Star size={11} className="fill-amber-500 text-amber-500" />
                    </span>
                    <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[11px] text-stone-400 shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Customer Reviews List */}
          <div className="lg:col-span-8 space-y-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 sm:p-8 bg-white border border-stone-200/80 rounded-xs space-y-4 hover:border-stone-300 transition-colors"
              >
                {/* Header: Rating & Verified Purchase */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    {renderStars(rev.rating)}
                    {rev.verifiedPurchase && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400 font-mono">
                    {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Review Headline & Body */}
                {rev.title && (
                  <h4 className="font-serif font-bold text-base text-stone-900 tracking-tight">
                    &ldquo;{rev.title}&rdquo;
                  </h4>
                )}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
                  {rev.comment}
                </p>

                {/* Footer: Recommends & Reviewer Name */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500">
                  <span className="font-medium text-stone-800">
                    — {rev.userName}
                  </span>
                  {rev.recommended !== false && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                      <ThumbsUp size={12} /> Recommends this product
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Customer Review Modal (Requirement 6) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden text-stone-900 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
                  Verified Customer Feedback
                </p>
                <h3 className="font-serif text-lg tracking-wide">WRITE A REVIEW</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Product Snapshot Header in Form (Requirement 6) */}
            <div className="px-6 py-4 bg-[#F7F5F0] border-b border-stone-200 flex items-center gap-4">
              <div className="relative w-12 h-14 bg-stone-200 overflow-hidden rounded-xs shrink-0">
                <Image
                  src={resolvedThumb}
                  alt={productName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-mono">
                  Reviewing
                </p>
                <h4 className="text-sm font-serif font-bold text-stone-900 line-clamp-1">
                  {productName}
                </h4>
              </div>
            </div>

            {/* Review Form */}
            <form onSubmit={handleSubmitReview} className="p-6 space-y-5 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Star Rating Selector */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Your Rating <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeStar = hoverRating > 0 ? hoverRating : rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform focus:outline-hidden"
                      >
                        <Star
                          className={`w-7 h-7 ${star <= activeStar ? "fill-amber-500 text-amber-500" : "text-stone-300"}`}
                        />
                      </button>
                    );
                  })}
                  <span className="font-mono text-xs font-bold text-stone-800 ml-2">
                    {rating} / 5
                  </span>
                </div>
              </div>

              {/* Review Headline */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Excellent fit and finish"
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xs text-xs focus:outline-hidden focus:border-stone-900 transition"
                />
              </div>

              {/* Review Comment Body */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Your Review <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with fit, fabric quality, and finish..."
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xs text-xs leading-relaxed focus:outline-hidden focus:border-stone-900 transition resize-none"
                />
              </div>

              {/* Recommendation Option */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Would you recommend this product?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecommended(true)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 border rounded-xs font-semibold text-xs transition ${
                      recommended
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <ThumbsUp size={13} />
                    <span>Yes, I recommend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecommended(false)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 border rounded-xs font-semibold text-xs transition ${
                      !recommended
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <ThumbsDown size={13} />
                    <span>No</span>
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-300 text-stone-700 rounded-xs font-semibold hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xs font-semibold inline-flex items-center gap-2 transition disabled:opacity-50"
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
