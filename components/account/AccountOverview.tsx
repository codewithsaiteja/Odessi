"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User } from "@/lib/auth/AuthContext";
import { Order } from "@/lib/api/orders";
import { Address } from "@/lib/api/addresses";
import { WishlistItem } from "@/types";
import { resendVerificationEmail } from "@/lib/api/user";
import { useToast } from "@/components/ui/Toast";
import {
  ShoppingBag,
  MapPin,
  Heart,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User as UserIcon,
  ShieldCheck,
  Send,
  Check,
  HelpCircle,
  Crown,
} from "lucide-react";

interface AccountOverviewProps {
  user: User;
  orders: Order[];
  addresses: Address[];
  wishlistItems: WishlistItem[];
  onNavigateTab: (tab: string) => void;
  onSelectOrder: (order: Order) => void;
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

export default function AccountOverview({
  user,
  orders,
  addresses,
  wishlistItems,
  onNavigateTab,
  onSelectOrder,
}: AccountOverviewProps) {
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const { showToast } = useToast();

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Member";

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
  const recentOrders = orders.slice(0, 3);

  const handleResendVerification = async () => {
    try {
      setResending(true);
      setResendStatus(null);
      const res = await resendVerificationEmail();
      setResendStatus({ type: "success", msg: res?.message || "Verification email dispatched to your inbox." });
    } catch (err: any) {
      setResendStatus({ type: "error", msg: err?.message || "Failed to resend verification email." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-850 border border-neutral-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 text-2xl font-bold font-heading">
            {user.firstName ? user.firstName[0].toUpperCase() : <UserIcon size={28} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-heading text-white">
                Welcome back, {user.firstName || "Customer"}
              </h2>
              {user.role === "ADMIN" && (
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs px-2 py-0.5 rounded font-mono uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-neutral-400 text-sm mt-1">
              {user.email} &bull; Member since {memberSince}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-stretch md:self-auto">
          {user.emailVerified ? (
            <span className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-semibold px-3.5 py-1.5 rounded-full">
              <CheckCircle2 size={14} /> Verified Account
            </span>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <span className="flex items-center gap-1.5 bg-amber-950/80 text-amber-400 border border-amber-800 text-xs font-semibold px-3.5 py-1.5 rounded-full">
                <AlertCircle size={14} /> Email Verification Required
              </span>
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-[11px] text-amber-400 hover:underline font-medium flex items-center gap-1 disabled:opacity-50"
              >
                <Send size={11} /> {resending ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>
          )}
        </div>
      </div>

      {resendStatus && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 ${
            resendStatus.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
              : "bg-rose-950/80 text-rose-300 border-rose-800"
          }`}
        >
          {resendStatus.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{resendStatus.msg}</span>
        </div>
      )}

      {/* Trusted Sellers Program Banner */}
      <div className="bg-gradient-to-r from-[#0E121A] via-[#141A26] to-[#0E121A] border border-[#2B3548] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#B89A5A]/20 border border-[#B89A5A]/40 flex items-center justify-center text-[#B89A5A] shrink-0">
            <Crown size={22} />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#B89A5A] font-semibold block">
              ODESSI REWARDS
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white font-serif mt-0.5">
              Trusted Sellers Program
            </h3>
            <p className="text-xs text-neutral-300 mt-1">
              Promote ODESSI products to unlock exclusive gifts, limited apparel, and brand ambassador privileges.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab("seller")}
          className="px-4 py-2 bg-[#B89A5A] hover:bg-[#A3864A] text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0 self-end sm:self-auto"
        >
          <span>View Seller Hub</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab("orders")}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-amber-400/50 hover:bg-neutral-850 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 group-hover:scale-110 transition-transform">
              <ShoppingBag size={20} />
            </div>
            <ArrowRight size={16} className="text-neutral-600 group-hover:text-amber-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold font-heading text-white">{orders.length}</p>
          <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mt-1">Total Orders</p>
        </button>

        <button
          onClick={() => onNavigateTab("addresses")}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-amber-400/50 hover:bg-neutral-850 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="p-2.5 rounded-xl bg-blue-400/10 text-blue-400 group-hover:scale-110 transition-transform">
              <MapPin size={20} />
            </div>
            <ArrowRight size={16} className="text-neutral-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold font-heading text-white">{addresses.length}</p>
          <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mt-1">Saved Addresses</p>
        </button>

        <button
          onClick={() => onNavigateTab("wishlist")}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-amber-400/50 hover:bg-neutral-850 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="p-2.5 rounded-xl bg-rose-400/10 text-rose-400 group-hover:scale-110 transition-transform">
              <Heart size={20} />
            </div>
            <ArrowRight size={16} className="text-neutral-600 group-hover:text-rose-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold font-heading text-white">{wishlistItems.length}</p>
          <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mt-1">Wishlist Items</p>
        </button>
      </div>

      {/* Main Grid: Recent Orders & Saved Address */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Card */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <ShoppingBag size={18} className="text-amber-400" />
              Recent Orders
            </h3>
            <button
              onClick={() => onNavigateTab("orders")}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-sm space-y-3">
              <p>You haven&apos;t placed any orders yet.</p>
              <Link
                href="/shop"
                className="inline-block bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-amber-300 transition-colors"
              >
                Explore Collection
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-mono text-sm font-bold text-amber-400 block">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      &bull; {order.items?.length || 0} items
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white block">
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusBadgeClass(order.status)}`}
                    >
                      {formatOrderStatus(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary Address & Account Quick Links */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preferred Address */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <MapPin size={18} className="text-blue-400" />
                Default Address
              </h3>
              <button
                onClick={() => onNavigateTab("addresses")}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                Manage
              </button>
            </div>

            {defaultAddress ? (
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-sm space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white">{defaultAddress.fullName}</span>
                  {defaultAddress.isDefault && (
                    <span className="text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-neutral-400 text-xs">{defaultAddress.addressLine1}</p>
                {defaultAddress.addressLine2 && (
                  <p className="text-neutral-400 text-xs">{defaultAddress.addressLine2}</p>
                )}
                <p className="text-neutral-400 text-xs">
                  {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.postalCode}
                </p>
                <p className="text-neutral-500 text-xs mt-2 font-mono">Ph: {defaultAddress.phone}</p>
              </div>
            ) : (
              <div className="py-6 text-center text-neutral-400 text-xs space-y-3">
                <p>No default address set.</p>
                <button
                  onClick={() => onNavigateTab("addresses")}
                  className="bg-neutral-800 hover:bg-neutral-750 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  Add Address
                </button>
              </div>
            )}
          </div>

          {/* Quick Account Security & Support */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-400" />
              Security & Assistance
            </h3>
            <p className="text-neutral-400 text-xs">
              Manage your credentials, active login sessions, or contact concierge support.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onNavigateTab("security")}
                className="bg-neutral-800 hover:bg-neutral-750 text-white font-medium py-2 rounded-xl text-xs transition-colors text-center"
              >
                Security Settings
              </button>
              <button
                onClick={() => onNavigateTab("support")}
                className="bg-neutral-800 hover:bg-neutral-750 text-white font-medium py-2 rounded-xl text-xs transition-colors text-center flex items-center justify-center gap-1"
              >
                <HelpCircle size={14} /> Help Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
