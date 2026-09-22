"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Order, cancelOrder } from "@/lib/api/orders";
import { useToast } from "@/components/ui/Toast";
import { ShoppingBag, Package, MapPin, Truck, ArrowLeft, XCircle, AlertCircle, Star } from "lucide-react";
import { OrderTrackingTimeline } from "./OrderTrackingTimeline";

interface AccountOrdersProps {
  orders: Order[];
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
  onRefreshOrders?: () => Promise<void>;
}

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

export default function AccountOrders({
  orders,
  selectedOrder,
  onSelectOrder,
  onRefreshOrders,
}: AccountOrdersProps) {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "CONFIRMED") return order.status === "CONFIRMED" || order.status === "DELIVERED";
    if (statusFilter === "PENDING") return order.status === "PENDING_PAYMENT" || order.status === "PENDING";
    if (statusFilter === "CANCELLED") return order.status === "CANCELLED" || order.status === "PAYMENT_FAILED";
    return true;
  });

  // Parse shipping address snapshot safely if available
  let parsedAddressSnapshot: Record<string, string> | null = null;
  if (selectedOrder?.shippingAddressSnapshot) {
    try {
      parsedAddressSnapshot = JSON.parse(selectedOrder.shippingAddressSnapshot);
    } catch {
      parsedAddressSnapshot = null;
    }
  }

  const isCancellable = selectedOrder && (
    selectedOrder.status === "PENDING" ||
    selectedOrder.status === "PENDING_PAYMENT" ||
    selectedOrder.status === "CONFIRMED"
  );

  const handleCancelOrderSubmit = async () => {
    if (!selectedOrder) return;
    try {
      setCancelling(true);
      const updatedOrder = await cancelOrder(selectedOrder.orderNumber);
      toast.success(`Order ${selectedOrder.orderNumber} cancelled successfully`);
      onSelectOrder(updatedOrder);
      if (onRefreshOrders) await onRefreshOrders();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Detail Modal View */}
      {selectedOrder ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-800">
            <button
              onClick={() => onSelectOrder(null)}
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} /> Back to All Orders
            </button>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs uppercase font-bold px-3 py-1 rounded-full ${
                  selectedOrder.status === "CONFIRMED" || selectedOrder.status === "DELIVERED"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : selectedOrder.status === "PAYMENT_FAILED" || selectedOrder.status === "CANCELLED"
                    ? "bg-red-950 text-red-400 border border-red-800"
                    : "bg-amber-950 text-amber-400 border border-amber-800"
                }`}
              >
                {formatOrderStatus(selectedOrder.status)}
              </span>

              {isCancellable && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-1 bg-rose-950/80 text-rose-400 border border-rose-800 hover:bg-rose-900 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle size={14} /> Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider block">Order Reference</span>
              <span className="font-mono font-bold text-amber-400 text-base">{selectedOrder.orderNumber}</span>
            </div>
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider block">Date Placed</span>
              <span className="text-sm font-semibold text-white">
                {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider block">Payment Status</span>
              <span className="text-sm font-semibold text-white uppercase">{selectedOrder.paymentStatus}</span>
            </div>
          </div>

          {/* Real-time Order Tracking Pipeline */}
          <OrderTrackingTimeline
            status={selectedOrder.status}
            createdAt={selectedOrder.createdAt}
            trackingNumber={selectedOrder.shipmentTrackingNumber}
            carrierName={selectedOrder.carrierName}
          />

          {/* Purchased Items List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold font-heading text-neutral-300 uppercase tracking-wider">
              Order Items ({selectedOrder.items?.length || 0})
            </h4>
            <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/40">
              {(selectedOrder.items || []).map((item) => (
                <div key={item.id} className="p-4 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.productNameSnapshot}</p>
                      <p className="text-xs text-neutral-400">
                        {item.colorSnapshot} &bull; Size {item.sizeSnapshot} &bull; Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <div>
                      <p className="text-sm font-bold text-white">₹{(item.totalPrice || 0).toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-neutral-500">₹{(item.unitPrice || 0).toLocaleString("en-IN")} each</p>
                    </div>
                    {item.productSlug && (selectedOrder.status === "CONFIRMED" || selectedOrder.status === "DELIVERED" || selectedOrder.status === "SHIPPED") && (
                      <Link
                        href={`/product/${item.productSlug}?review=true#product-reviews`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 rounded-sm text-[10px] font-semibold transition tracking-wide"
                      >
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span>Write a Review</span>
                      </Link>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Shipping Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Summary */}
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 space-y-2.5 text-sm">
              <h5 className="font-bold text-white pb-2 border-b border-neutral-800">Financial Summary</h5>
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span>₹{(selectedOrder.subtotal || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Shipping</span>
                <span>
                  {selectedOrder.shippingAmount === 0
                    ? "FREE"
                    : `₹${(selectedOrder.shippingAmount || 0).toLocaleString("en-IN")}`}
                </span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-₹{(selectedOrder.discountAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-neutral-800 font-bold text-base text-amber-400">
                <span>Total Amount</span>
                <span>₹{(selectedOrder.totalAmount || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Shipping Address & Shipment Tracking */}
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 space-y-4 text-sm">
              <div>
                <h5 className="font-bold text-white pb-2 border-b border-neutral-800 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-400" /> Shipping Address Snapshot
                </h5>
                {parsedAddressSnapshot ? (
                  <div className="mt-2 text-xs text-neutral-300 leading-relaxed">
                    <p className="font-bold text-white">{parsedAddressSnapshot.fullName}</p>
                    <p>{parsedAddressSnapshot.addressLine1}</p>
                    {parsedAddressSnapshot.addressLine2 && <p>{parsedAddressSnapshot.addressLine2}</p>}
                    <p>
                      {parsedAddressSnapshot.city}, {parsedAddressSnapshot.state} - {parsedAddressSnapshot.postalCode}
                    </p>
                    <p className="font-mono text-neutral-400 mt-1">Ph: {parsedAddressSnapshot.phone}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-neutral-500 italic">Address snapshot stored for order processing.</p>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <h5 className="font-bold text-white mb-1 flex items-center gap-2 text-xs">
                  <Truck size={14} className="text-amber-400" /> Shipment Tracking Status
                </h5>
                <p className="text-xs text-neutral-400 italic">
                  Tracking information will appear here once shipment dispatch is initiated by carrier.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Orders List View */
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
                <ShoppingBag size={22} className="text-amber-400" /> Order History
              </h2>
              <p className="text-neutral-400 text-xs mt-1">
                View and manage your current and past purchases.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2">
              {["ALL", "CONFIRMED", "PENDING", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-amber-400 text-neutral-950"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <ShoppingBag size={48} className="mx-auto text-neutral-700" />
              <p className="text-neutral-400 text-sm">No orders found matching status filter.</p>
              <Link
                href="/shop"
                className="inline-block bg-amber-400 text-neutral-950 font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-amber-300 transition-colors"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 cursor-pointer transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-neutral-850 gap-2">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Reference</span>
                      <span className="font-mono font-bold text-amber-400 text-base">{order.orderNumber}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs uppercase font-bold px-2.5 py-0.5 rounded ${
                          order.status === "CONFIRMED" || order.status === "DELIVERED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : order.status === "PAYMENT_FAILED" || order.status === "CANCELLED"
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {formatOrderStatus(order.status)}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400 text-xs">
                      {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? "s" : ""}
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-white text-base">₹{(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-amber-400 block font-semibold hover:underline">
                        View Details &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Cancellation Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 text-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>Confirm Order Cancellation</span>
            </h3>

            <p className="text-xs text-stone-300 leading-relaxed">
              Are you sure you want to cancel order <span className="font-mono font-bold text-amber-400">{selectedOrder.orderNumber}</span>?
              Inventory reservations for this order will be released automatically.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrderSubmit}
                disabled={cancelling}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-semibold rounded-xl text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
