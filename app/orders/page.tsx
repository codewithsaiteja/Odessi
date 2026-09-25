"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Order, getOrders } from "@/lib/api";
import { RefreshCw } from "lucide-react";
import BackButton from "@/components/navigation/BackButton";

function formatOrderStatus(status: string): string {
  switch (status) {
    case "PENDING_PAYMENT":
    case "PENDING":
      return "Payment Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "PROCESSING":
      return "Processing";
    case "SHIPPED":
      return "Shipped";
    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    case "PAYMENT_FAILED":
      return "Payment Failed";
    default:
      return status;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-950 text-emerald-400 border border-emerald-800";
    case "OUT_FOR_DELIVERY":
      return "bg-indigo-950 text-indigo-300 border border-indigo-800";
    case "SHIPPED":
      return "bg-sky-950 text-sky-300 border border-sky-800";
    case "PROCESSING":
      return "bg-amber-950 text-amber-400 border border-amber-800";
    case "CONFIRMED":
      return "bg-emerald-950/70 text-emerald-300 border border-emerald-800/80";
    case "CANCELLED":
    case "PAYMENT_FAILED":
      return "bg-red-950 text-red-400 border border-red-800";
    case "PENDING":
    case "PENDING_PAYMENT":
    default:
      return "bg-amber-950 text-amber-400 border border-amber-800";
  }
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrdersData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getOrders();
      const list = res?.data ?? res?.content ?? (Array.isArray(res) ? res : []);
      setOrders(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders");
      if (!silent) setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrdersData();
    }
  }, [isAuthenticated, fetchOrdersData]);

  // Window focus & tab visibility change revalidation
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleRevalidate = () => {
      if (document.visibilityState === "visible") {
        fetchOrdersData(true);
      }
    };

    window.addEventListener("focus", handleRevalidate);
    document.addEventListener("visibilitychange", handleRevalidate);

    return () => {
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleRevalidate);
    };
  }, [isAuthenticated, fetchOrdersData]);

  // Lightweight synchronization for active in-flight orders
  useEffect(() => {
    if (!isAuthenticated) return;

    const hasInFlightOrders = orders.some(
      (o) =>
        o.status === "PENDING" ||
        o.status === "PENDING_PAYMENT" ||
        o.status === "CONFIRMED" ||
        o.status === "PROCESSING" ||
        o.status === "SHIPPED" ||
        o.status === "OUT_FOR_DELIVERY"
    );

    if (!hasInFlightOrders) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrdersData(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, orders, fetchOrdersData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="animate-spin h-8 w-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white p-4">
        <div className="max-w-md text-center bg-neutral-900 border border-neutral-800 p-8 rounded-2xl">
          <h1 className="text-2xl font-bold font-heading mb-4">Account Required</h1>
          <p className="text-neutral-400 text-sm mb-6">Log in to view your order history.</p>
          <Link href="/login?redirect=/orders" className="inline-block bg-amber-400 text-neutral-950 font-bold py-3 px-6 rounded-xl">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const safeOrders = Array.isArray(orders) ? orders : [];

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-28 pb-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <BackButton fallback="/account" label="Back to Account" variant="light" className="mb-4" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">My Orders</h1>
            <p className="text-neutral-400 text-sm">Track your purchases and view order details.</p>
          </div>
          <button
            onClick={async () => {
              setRefreshing(true);
              try {
                await fetchOrdersData(true);
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync Status"}</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-950/60 border border-red-800 text-red-300 text-sm p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {safeOrders.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
            <p className="text-neutral-400 mb-6">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className="bg-amber-400 text-neutral-950 font-bold px-6 py-3 rounded-xl hover:bg-amber-500 transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {safeOrders.map((order) => (
              <div key={order.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-neutral-800 mb-4 gap-2">
                  <div>
                    <span className="text-xs text-neutral-400 uppercase tracking-wider block">Order Reference</span>
                    <span className="font-mono font-bold text-amber-400 text-base">{order.orderNumber}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs uppercase font-bold px-2.5 py-1 rounded ${getStatusBadgeClass(order.status)}`}>
                      {formatOrderStatus(order.status)}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium text-white">{item.productNameSnapshot}</span>
                        <span className="text-xs text-neutral-400 block">
                          {item.colorSnapshot} / {item.sizeSnapshot} &times; {item.quantity}
                        </span>
                      </div>
                      <span className="font-semibold text-neutral-300">
                        ₹{(item.totalPrice || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-neutral-800 text-sm font-bold">
                  <span className="text-neutral-400">Total Amount</span>
                  <span className="text-amber-400 text-base">₹{(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
