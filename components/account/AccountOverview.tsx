"use client";

import React from "react";
import Link from "next/link";
import { User } from "@/lib/auth/AuthContext";
import { Order } from "@/lib/api/orders";
import { Address } from "@/lib/api/addresses";
import { WishlistItem } from "@/types";
import { UserReviewResponse } from "@/lib/api/user";
import {
  ShoppingBag,
  MapPin,
  Heart,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";

interface AccountOverviewProps {
  user: User;
  orders: Order[];
  addresses: Address[];
  wishlistItems: WishlistItem[];
  reviews: UserReviewResponse[];
  onNavigateTab: (tab: string) => void;
  onSelectOrder: (order: Order) => void;
}

export default function AccountOverview({
  user,
  orders,
  addresses,
  wishlistItems,
  reviews,
  onNavigateTab,
  onSelectOrder,
}: AccountOverviewProps) {
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Member";

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
  const recentOrders = orders.slice(0, 3);

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

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          {user.emailVerified ? (
            <span className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle2 size={14} /> Verified Account
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-amber-950/80 text-amber-400 border border-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full">
              <AlertCircle size={14} /> Unverified Email
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <button
          onClick={() => onNavigateTab("reviews")}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-amber-400/50 hover:bg-neutral-850 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-400/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Star size={20} />
            </div>
            <ArrowRight size={16} className="text-neutral-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold font-heading text-white">{reviews.length}</p>
          <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mt-1">Submitted Reviews</p>
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        order.status === "CONFIRMED" || order.status === "DELIVERED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : order.status === "PAYMENT_FAILED" || order.status === "CANCELLED"
                          ? "bg-red-950 text-red-400 border border-red-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {order.status}
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

          {/* Quick Account Security */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-400" />
              Account Security
            </h3>
            <p className="text-neutral-400 text-xs">
              Manage your password and active security sessions.
            </p>
            <button
              onClick={() => onNavigateTab("security")}
              className="w-full bg-neutral-800 hover:bg-neutral-750 text-white font-medium py-2.5 rounded-xl text-xs transition-colors text-center block"
            >
              Update Password & Security Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
