"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAdminOrderById, updateAdminOrderStatus } from "@/lib/api/admin";
import { ArrowLeft, MapPin, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  PENDING_PAYMENT: ["CONFIRMED", "PAYMENT_FAILED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  PAYMENT_FAILED: [],
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = Number(params?.id);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getAdminOrderById(id);
      setOrder(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);
      await updateAdminOrderStatus(id, newStatus);
      setSuccess(`Order status transitioned to ${newStatus}`);
      fetchOrder();
    } catch (err: any) {
      setError(err?.message || "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-slate-500">
        Loading Operational Order #{id}...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-xs text-red-600 font-semibold">
        Order not found or unavailable.
      </div>
    );
  }

  const allowedNextStates = ALLOWED_TRANSITIONS[order.status] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/orders"
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Order #{order.orderNumber}</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Operational Workflow Transition Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-500 font-mono font-semibold">
              Current Fulfillment Status
            </span>
            <div className="mt-1 flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-full border ${
                  order.status === "CONFIRMED" || order.status === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : order.status === "CANCELLED" || order.status === "PAYMENT_FAILED"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {order.status}
              </span>
              <span className="text-xs text-slate-600 font-mono">
                Payment Status: <strong className="text-slate-900">{order.paymentStatus}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons for Allowed Transitions */}
          {allowedNextStates.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-mono">Transition:</span>
              {allowedNextStates.map((nextState) => (
                <button
                  key={nextState}
                  disabled={updating}
                  onClick={() => handleStatusUpdate(nextState)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs uppercase tracking-wider font-mono font-semibold transition shadow-2xs"
                >
                  {nextState}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Summary & Address Snapshot Grid */}
      {(() => {
        let shippingAddress = order.shippingAddress;
        if (!shippingAddress && typeof order.shippingAddressSnapshot === 'string') {
          try {
            shippingAddress = JSON.parse(order.shippingAddressSnapshot);
          } catch {
            shippingAddress = null;
          }
        }
        const razorpayOrderId = order.razorpayOrderId || order.payments?.[0]?.providerOrderId || order.payments?.[0]?.razorpayOrderId || null;
        const razorpayPaymentId = order.razorpayPaymentId || order.payments?.[0]?.providerPaymentId || order.payments?.[0]?.razorpayPaymentId || null;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Address Snapshot */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-2xs">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <MapPin className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-mono uppercase tracking-wider">Shipping Address Snapshot</h3>
              </div>
              {shippingAddress ? (
                <div className="text-xs text-slate-700 space-y-1">
                  {shippingAddress.fullName && <p className="font-semibold text-slate-900">{shippingAddress.fullName}</p>}
                  {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                  {shippingAddress.addressLine1 && <p>{shippingAddress.addressLine1}</p>}
                  {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                  {([shippingAddress.city, shippingAddress.state].filter(Boolean).length > 0 || shippingAddress.postalCode) && (
                    <p>{[shippingAddress.city, shippingAddress.state].filter(Boolean).join(", ")}{shippingAddress.postalCode ? ` - ${shippingAddress.postalCode}` : ""}</p>
                  )}
                  {shippingAddress.country && <p className="text-slate-500">{shippingAddress.country}</p>}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No shipping address recorded</p>
              )}
            </div>

            {/* Payment & Order Metadata */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-2xs">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-mono uppercase tracking-wider">Payment & Customer Metadata</h3>
              </div>
              <div className="text-xs text-slate-700 space-y-1 font-mono">
                <p>Customer: <span className="font-semibold text-slate-900">{order.customerName || "Customer"}</span></p>
                <p>Email: <span className="font-semibold text-slate-900">{order.customerEmail || "N/A"}</span></p>
                <p>Razorpay Order ID: <span className="font-semibold text-slate-900">{razorpayOrderId || "N/A"}</span></p>
                {razorpayPaymentId && (
                  <p>Razorpay Payment ID: <span className="font-semibold text-slate-900">{razorpayPaymentId}</span></p>
                )}
                <p>Currency: <span className="font-semibold text-slate-900">{order.currency}</span></p>
                <p>Total Amount: <span className="text-emerald-700 font-bold text-sm">₹{order.totalAmount}</span></p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Immutable Order Line Items */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
        <h3 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
          Ordered Line Items (Immutable Historical Snapshot)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Item Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Color / Size</th>
                <th className="p-3">Unit Price</th>
                <th className="p-3">Quantity</th>
                <th className="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {order.items?.map((item: any) => {
                const name = item.productName || item.productNameSnapshot || "Item";
                const sku = item.sku || item.skuSnapshot || "—";
                const color = item.color || item.colorSnapshot;
                const size = item.size || item.sizeSnapshot;
                const variantStr = [color, size].filter(Boolean).join(" / ") || "Standard";
                const unitPrice = item.unitPrice != null ? `₹${item.unitPrice}` : "—";
                const totalPrice = item.totalPrice != null ? `₹${item.totalPrice}` : "—";

                return (
                  <tr key={item.id}>
                    <td className="p-3 font-semibold text-slate-900">{name}</td>
                    <td className="p-3 font-mono text-slate-500">{sku}</td>
                    <td className="p-3">{variantStr}</td>
                    <td className="p-3 font-mono">{unitPrice}</td>
                    <td className="p-3 font-mono font-bold">{item.quantity}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 text-right">{totalPrice}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
