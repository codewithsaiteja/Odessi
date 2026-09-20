"use client";

import React from "react";
import { UserReviewResponse } from "@/lib/api/user";
import { Star, ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";

interface AccountReviewsProps {
  reviews: UserReviewResponse[];
}

export default function AccountReviews({ reviews }: AccountReviewsProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
            <Star size={22} className="text-emerald-400" /> Product Reviews
          </h2>
          <p className="text-neutral-400 text-xs mt-1">
            Your verified purchase reviews and feedback.
          </p>
        </div>
        <span className="text-xs font-mono text-neutral-400 bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800">
          {reviews.length} Total
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <Star size={48} className="mx-auto text-neutral-700" />
          <p className="text-neutral-400 text-sm">You haven&apos;t submitted any product reviews yet.</p>
          <p className="text-neutral-500 text-xs max-w-md mx-auto">
            Reviews can be submitted from your order history once a purchase is completed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-neutral-850">
                <div>
                  <h3 className="font-bold text-white text-sm">{rev.productName}</h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    Order Ref: {rev.orderNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {rev.verifiedPurchase && (
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={10} /> Verified Purchase
                    </span>
                  )}

                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded flex items-center gap-1 ${
                      rev.status === "APPROVED"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : rev.status === "REJECTED"
                        ? "bg-red-950 text-red-400 border border-red-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {rev.status === "APPROVED" && <CheckCircle2 size={10} />}
                    {rev.status === "REJECTED" && <XCircle size={10} />}
                    {rev.status === "PENDING" && <Clock size={10} />}
                    {rev.status}
                  </span>
                </div>
              </div>

              {/* Rating Stars & Title */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={
                        s <= rev.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-neutral-800 text-neutral-800"
                      }
                    />
                  ))}
                  <span className="text-xs font-bold text-white ml-2">{rev.title}</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed pt-1">{rev.comment}</p>
              </div>

              <div className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-850">
                Submitted on{" "}
                {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
