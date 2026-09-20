"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Order, getOrderByNumber } from "@/lib/api";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      getOrderByNumber(orderNumber)
        .then(setOrder)
        .catch((err) => console.error("Could not fetch order details", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-28 pb-16 px-4 md:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-10 text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-6 ring-8 ring-emerald-500/10">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">Order Confirmed!</h1>
        <p className="text-neutral-400 text-sm mb-6">
          Thank you for your purchase. We have received your payment and are preparing your order.
        </p>

        {orderNumber && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-8 inline-block">
            <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Order Number</span>
            <span className="text-amber-400 font-mono font-bold text-lg">{orderNumber}</span>
          </div>
        )}

        {loading ? (
          <div className="text-neutral-400 text-sm py-8">Loading order summary...</div>
        ) : order ? (
          <div className="text-left bg-neutral-950 border border-neutral-800 rounded-xl p-6 mb-8 text-sm">
            <h2 className="font-semibold text-white mb-4 border-b border-neutral-800 pb-2">Order Details</h2>
            <div className="space-y-3 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <span className="text-neutral-300">
                    {item.productNameSnapshot} ({item.colorSnapshot} / {item.sizeSnapshot}) &times; {item.quantity}
                  </span>
                  <span className="font-semibold text-amber-400">
                    ₹{item.totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-800 pt-3 flex justify-between font-bold text-sm">
              <span>Total Paid</span>
              <span className="text-amber-400">₹{order.totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/orders"
            className="bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            View My Orders
          </Link>
          <Link
            href="/shop"
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
