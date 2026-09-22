"use client";

import React, { useState } from "react";
import type { CartItem } from "@/types";
import { Tag, Check, X, Loader2 } from "lucide-react";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingAmount: number;
  discountAmount?: number;
  appliedCouponCode?: string | null;
  totalAmount: number;
  onApplyCoupon?: (code: string) => Promise<void>;
  onRemoveCoupon?: () => void;
  onProceedToPayment: () => void;
  isProcessing: boolean;
  disabled: boolean;
}

export default function OrderSummary({
  items,
  subtotal,
  shippingAmount,
  discountAmount = 0,
  appliedCouponCode,
  totalAmount,
  onApplyCoupon,
  onRemoveCoupon,
  onProceedToPayment,
  isProcessing,
  disabled,
}: OrderSummaryProps) {
  const [couponInput, setCouponInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim() || !onApplyCoupon) return;
    try {
      setValidating(true);
      setCouponMessage(null);
      await onApplyCoupon(couponInput.trim());
      setCouponMessage({ text: "Coupon code applied!", isError: false });
      setCouponInput("");
    } catch (err: any) {
      setCouponMessage({ text: err?.message || "Invalid coupon code", isError: true });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-white sticky top-24">
      <h2 className="text-xl font-bold font-heading mb-6 border-b border-neutral-800 pb-4">
        Order Summary
      </h2>

      {/* Line items list */}
      <div className="space-y-4 max-h-80 overflow-y-auto pr-2 mb-6 border-b border-neutral-800 pb-6">
        {items.map((item, idx) => (
          <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}-${idx}`} className="flex justify-between items-start text-sm">
            <div>
              <p className="font-semibold text-white">{item.product.name}</p>
              <p className="text-xs text-neutral-400">
                {item.selectedColor.name} / {item.selectedSize} &times; {item.quantity}
              </p>
            </div>
            <p className="font-semibold text-amber-400">
              ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      {/* Coupon Code Section */}
      <div className="mb-6 border-b border-neutral-800 pb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center space-x-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-400" />
          <span>Promo Code</span>
        </label>

        {appliedCouponCode ? (
          <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-bold text-amber-400 tracking-wider uppercase">
                {appliedCouponCode}
              </span>
              <span className="text-neutral-400">(-₹{discountAmount.toLocaleString("en-IN")})</span>
            </div>
            {onRemoveCoupon && (
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="text-neutral-400 hover:text-white p-1 rounded"
                title="Remove promo code"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleApply} className="flex space-x-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="e.g. HERO20"
              className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono uppercase text-white focus:outline-hidden focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={validating || !couponInput.trim()}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50 inline-flex items-center space-x-1"
            >
              {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Apply</span>}
            </button>
          </form>
        )}

        {couponMessage && (
          <p className={`text-xs mt-2 ${couponMessage.isError ? "text-red-400" : "text-emerald-400"}`}>
            {couponMessage.text}
          </p>
        )}
      </div>

      {/* Pricing calculation */}
      <div className="space-y-3 text-sm mb-6 border-b border-neutral-800 pb-6">
        <div className="flex justify-between text-neutral-400">
          <span>Subtotal</span>
          <span className="text-white">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-400 font-medium">
            <span>Promo Discount</span>
            <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between text-neutral-400">
          <span>Shipping</span>
          <span className={shippingAmount === 0 ? "text-emerald-400 font-semibold" : "text-white"}>
            {shippingAmount === 0 ? "FREE" : `₹${shippingAmount.toLocaleString("en-IN")}`}
          </span>
        </div>
        {subtotal < 999 && (
          <p className="text-[11px] text-amber-400/80 italic">
            Add ₹{(999 - subtotal).toLocaleString("en-IN")} more for Free Shipping!
          </p>
        )}
      </div>

      <div className="flex justify-between items-center text-lg font-bold mb-6">
        <span>Total Payable</span>
        <span className="text-amber-400 text-xl font-heading">
          ₹{totalAmount.toLocaleString("en-IN")}
        </span>
      </div>

      <button
        type="button"
        onClick={onProceedToPayment}
        disabled={disabled || isProcessing}
        className="w-full bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold py-3.5 px-6 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2 shadow-lg shadow-amber-400/10"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5 text-neutral-950" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>PROCESSING PAYMENT...</span>
          </>
        ) : (
          <span>PAY SECURELY WITH RAZORPAY</span>
        )}
      </button>

      <p className="text-[11px] text-neutral-400 text-center mt-4">
        🔒 Secure Checkout with Razorpay
      </p>
    </div>
  );
}
