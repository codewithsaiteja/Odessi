"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  FolderTree,
  Bookmark,
  ShieldCheck,
  Truck,
  Tag,
  Star,
  Share2,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Store,
  ChevronRight,
  Building2,
  Shirt,
  Timer,
  ChevronDown,
  User as UserIcon,
  Camera,
  LayoutTemplate,
} from "lucide-react";


interface NavSection {
  title: string;
  items: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "CATALOG",
    items: [
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "Categories", href: "/admin/categories", icon: FolderTree },
      { name: "Collections", href: "/admin/collections", icon: Bookmark },
      { name: "Inventory", href: "/admin/inventory", icon: Layers },
    ],
  },
  {
    title: "ORDERS",
    items: [
      { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    ],
  },
  {
    title: "CUSTOMERS",
    items: [
      { name: "Customers", href: "/admin/users", icon: Users },
    ],
  },
  {
    title: "MARKETING",
    items: [
      { name: "Coupons", href: "/admin/coupons", icon: Tag },
      { name: "Reviews", href: "/admin/reviews", icon: Star },
      { name: "Referrals", href: "/admin/referrals", icon: Share2 },
      { name: "Limited Drops", href: "/admin/drops", icon: Timer },
    ],
  },
  {
    title: "CONTENT & SOCIAL",
    items: [
      { name: "Instagram / Social", href: "/admin/social", icon: Camera },
      { name: "Storefront Content", href: "/admin/content", icon: LayoutTemplate },
    ],
  },

  {
    title: "BUSINESS",
    items: [
      { name: "Shipping", href: "/admin/shipping", icon: Truck },
      { name: "Partnerships", href: "/admin/partnerships", icon: Building2 },
      { name: "Custom Orders", href: "/admin/custom-orders", icon: Shirt },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Audit Logs", href: "/admin/audit", icon: ShieldCheck },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Store", href: "/" }, { label: "Admin", href: "/admin" }];

    if (parts.length > 1) {
      const section = parts[1];
      const name = section.charAt(0).toUpperCase() + section.slice(1);
      crumbs.push({ label: name, href: `/admin/${section}` });

      if (parts.length > 2) {
        const sub = parts[2];
        if (sub === "new") {
          crumbs.push({ label: "Create", href: pathname });
        } else {
          crumbs.push({ label: `Details (#${sub})`, href: pathname });
        }
      }
    }
    return crumbs;
  };

  const getPageTitle = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 1) return "Executive Commerce Dashboard";
    const section = parts[1];
    switch (section) {
      case "products":
        return parts[2] === "new" ? "Create Product" : parts[2] ? "Edit Product" : "Products & Catalog";
      case "inventory":
        return "Inventory & Stock Adjustment";
      case "orders":
        return parts[2] ? `Order #${parts[2]}` : "Order Management";
      case "users":
        return parts[2] ? `Customer Profile #${parts[2]}` : "Customer Accounts";
      case "shipping":
        return "Shipping Rates & Delivery Configuration";
      case "coupons":
        return "Promotions & Coupon Engine";
      case "reviews":
        return "Customer Reviews & Moderation";
      case "social":
        return "Instagram / Social Feed Management";
      case "content":
        return "Storefront Editorial & Homepage Content";
      case "referrals":
        return "Customer Referrals & Rewards Audit";
      case "categories":
        return "Category Hierarchy";
      case "collections":
        return "Collection Catalog";
      case "audit":
        return "System Audit Trail";
      case "partnerships":
        return "Partner Applications";
      case "custom-orders":
        return "Custom Order Requests";
      case "drops":
        return "Limited Drop Releases";
      default:
        return "Admin Control Center";
    }
  };

  const crumbs = getBreadcrumbs();
  const userInitial = user?.firstName?.charAt(0) || user?.email?.charAt(0) || "A";

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#111111] flex flex-col md:flex-row font-sans antialiased selection:bg-[#B89A5A] selection:text-black">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B0F17] border-b border-[#1E293B] text-white z-40">
        <div className="flex items-center space-x-2">
          <Image
            src="/logo-mark.png"
            alt="Odessi Emblem"
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
          <span className="font-serif tracking-widest text-lg font-bold text-[#F3F0E8]">
            ODESSI<span className="text-[#B89A5A]">.TFI</span>
          </span>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-[#B89A5A]/15 text-[#B89A5A] border border-[#B89A5A]/30 rounded uppercase">
            CONTROL
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B0F17] border-r border-[#1E293B] text-[#F3F0E8] flex flex-col transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1E293B] flex flex-col space-y-1 bg-[#070A10]">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5 font-serif text-xl tracking-widest font-bold text-white group">
              <Image
                src="/logo-mark.png"
                alt="Odessi Emblem"
                width={28}
                height={28}
                className="w-7 h-7 object-contain transition-transform group-hover:scale-105"
              />
              <span>
                ODESSI<span className="text-[#B89A5A]">.TFI</span>
              </span>
            </Link>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-[#B89A5A]/15 text-[#B89A5A] border border-[#B89A5A]/30 rounded">
              CONTROL
            </span>
          </div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-slate-400">
            BUSINESS OPERATIONS
          </p>
        </div>

        {/* Sectioned Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-500 mb-1.5">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded text-xs tracking-wider uppercase transition-all duration-150 ${
                      isActive
                        ? "bg-[#B89A5A] text-black font-semibold shadow-sm"
                        : "text-slate-300 hover:bg-[#1E293B]/80 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-black" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-black" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer — View Store & Profile */}
        <div className="p-4 border-t border-[#1E293B] bg-[#070A10] space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 bg-[#1E293B]/60 hover:bg-[#1E293B] border border-[#334155]/60 rounded text-xs text-slate-200 hover:text-white transition"
          >
            <div className="flex items-center space-x-2">
              <Store className="w-4 h-4 text-[#B89A5A]" />
              <span className="font-medium">View Storefront</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] text-xs">
            <div className="truncate pr-2">
              <p className="font-semibold text-slate-200 truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "System Admin"}
              </p>
              <p className="text-[10px] font-mono text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Logout of Admin"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#1E293B] rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F4F5F7]">
        {/* Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[#111111] tracking-tight font-serif">
              {getPageTitle()}
            </h1>
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5">
              {crumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href + idx}>
                  {idx > 0 && <span className="text-slate-300">/</span>}
                  {idx === crumbs.length - 1 ? (
                    <span className="font-medium text-slate-900">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-slate-900 transition">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
            >
              <Store className="w-3.5 h-3.5 text-slate-600" />
              <span>View Store</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <div className="h-5 w-px bg-slate-200"></div>

            {/* Profile Popover Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-slate-100 transition focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-[#0B0F17] text-[#B89A5A] font-bold text-xs flex items-center justify-center border border-[#1E293B] uppercase">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold text-slate-800 hidden lg:inline-block">
                  {user?.firstName || "Admin"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 py-2 bg-white rounded-sm shadow-xl border border-slate-200 z-50 text-xs text-slate-800">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-mono font-bold rounded">
                      ROLE_ADMIN
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/"
                      target="_blank"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition"
                    >
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Storefront</span>
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
