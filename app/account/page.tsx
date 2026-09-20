"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import AccountOverview from "@/components/account/AccountOverview";
import AccountOrders from "@/components/account/AccountOrders";
import AccountAddresses from "@/components/account/AccountAddresses";
import AccountWishlist from "@/components/account/AccountWishlist";
import AccountReviews from "@/components/account/AccountReviews";
import AccountProfile from "@/components/account/AccountProfile";
import AccountSecurity from "@/components/account/AccountSecurity";
import AccountReferrals from "@/components/account/AccountReferrals";
import AccountLoyalty from "@/components/account/AccountLoyalty";

import { getOrders, Order } from "@/lib/api/orders";
import { getAddresses, Address } from "@/lib/api/addresses";
import { getWishlist } from "@/lib/api/wishlist";
import { getUserReviews, UserReviewResponse } from "@/lib/api/user";
import { WishlistItem } from "@/types";

import {
  LayoutGrid,
  ShoppingBag,
  MapPin,
  Heart,
  Star,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronRight,
  Gift,
  Crown
} from "lucide-react";

export type AccountTab =
  | "overview"
  | "orders"
  | "addresses"
  | "wishlist"
  | "reviews"
  | "referral"
  | "loyalty"
  | "profile"
  | "security";

interface TabItem {
  id: AccountTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "referral", label: "Referral Program", icon: Gift },
  { id: "loyalty", label: "Odessi Club", icon: Crown },
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "security", label: "Security", icon: Shield },
];

function AccountContent() {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<AccountTab>("overview");

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [reviews, setReviews] = useState<UserReviewResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab") as AccountTab | null;
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Auth Guard
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login?redirect=/account");
    }
  }, [user, isAuthLoading, router]);

  // Data Fetching Handlers
  const fetchAddresses = useCallback(async () => {
    try {
      const data = await getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      setAddresses([]);
    }
  }, []);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await getWishlist();
      const items = res?.data?.items || [];
      setWishlistItems(items);
    } catch {
      setWishlistItems([]);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getOrders(0, 50);
      const items = res?.data || res?.content || [];
      setOrders(items);
    } catch {
      setOrders([]);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await getUserReviews(0, 50);
      const items = res?.data || res?.content || [];
      setReviews(items);
    } catch {
      setReviews([]);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setIsDataLoading(true);
    await Promise.all([
      fetchAddresses(),
      fetchWishlist(),
      fetchOrders(),
      fetchReviews(),
    ]);
    setIsDataLoading(false);
  }, [fetchAddresses, fetchWishlist, fetchOrders, fetchReviews]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  const handleTabChange = (tabId: AccountTab) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);
    router.replace(`/account?${params.toString()}`, { scroll: false });
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  if (isAuthLoading || (user && isDataLoading)) {
    return (
      <div className="min-h-[70vh] bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-stone-500 font-medium">
            Loading Account Details...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20 pt-8 sm:pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 border-b border-stone-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1">
              Customer Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight">
              My Account
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Welcome back, <span className="text-stone-800 font-medium">{user.firstName} {user.lastName}</span>
            </p>
          </div>

          <div className="text-xs text-stone-500 font-mono bg-white px-3.5 py-2 border border-stone-200 rounded-sm self-start md:self-auto">
            {user.email}
          </div>
        </div>

        {/* Navigation & Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-white border border-stone-200 rounded-sm p-3 shadow-xs sticky top-24">
            {/* Mobile Tab Bar */}
            <div className="flex lg:hidden overflow-x-auto gap-1 pb-2 border-b border-stone-100 scrollbar-none">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider shrink-0 transition-colors ${
                      isActive
                        ? "bg-stone-900 text-white"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Sidebar */}
            <nav className="hidden lg:block space-y-1">
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                Account Navigation
              </div>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-stone-900 text-white shadow-xs"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-stone-400"}`} />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-300" />}
                  </button>
                );
              })}

              <div className="pt-4 mt-4 border-t border-stone-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs uppercase tracking-wider font-semibold text-rose-700 hover:bg-rose-50 rounded-sm transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3 bg-white border border-stone-200 rounded-sm p-6 sm:p-8 min-h-[500px] shadow-xs">
            {activeTab === "overview" && (
              <AccountOverview
                user={user}
                orders={orders}
                addresses={addresses}
                wishlistItems={wishlistItems}
                reviews={reviews}
                onNavigateTab={(tab) => handleTabChange(tab as AccountTab)}
                onSelectOrder={(ord) => {
                  setSelectedOrder(ord);
                  handleTabChange("orders");
                }}
              />
            )}
            {activeTab === "orders" && (
              <AccountOrders
                orders={orders}
                selectedOrder={selectedOrder}
                onSelectOrder={(ord) => setSelectedOrder(ord)}
              />
            )}
            {activeTab === "addresses" && (
              <AccountAddresses
                addresses={addresses}
                onRefreshAddresses={fetchAddresses}
              />
            )}
            {activeTab === "wishlist" && (
              <AccountWishlist
                wishlistItems={wishlistItems}
                onRefreshWishlist={fetchWishlist}
              />
            )}
            {activeTab === "reviews" && (
              <AccountReviews reviews={reviews} />
            )}
            {activeTab === "referral" && <AccountReferrals />}
            {activeTab === "loyalty" && <AccountLoyalty />}
            {activeTab === "profile" && <AccountProfile />}
            {activeTab === "security" && <AccountSecurity />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] bg-stone-50 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
