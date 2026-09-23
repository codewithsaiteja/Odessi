"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User, Heart, ShoppingBag, Menu, X, ShieldCheck, LogOut } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import CartDrawer from "@/components/cart/CartDrawer";
import SearchOverlay from "@/components/shop/SearchOverlay";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<"shop" | "collections" | null>(null);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNavMouseEnter = (label: string) => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    const lower = label.toLowerCase();
    if (lower === "shop" || lower === "collections") {
      setActiveMegaMenu(lower as "shop" | "collections");
    } else {
      setActiveMegaMenu(null);
    }
  };

  const handleNavMouseLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 250);
  };
  
  const navRef = useRef<HTMLElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll(); // run once on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close account dropdown on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Lock body scroll when mobile menu is open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /* ── Close mobile menu & popovers on Escape ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const navLinks = siteConfig.nav.primary;

  return (
    <>
      <header
        ref={navRef}
        role="banner"
        className={`
          fixed top-[var(--announcement-height)] left-0 right-0 z-40
          transition-all duration-400 ease-out
          ${scrolled
            ? "bg-[var(--color-odessi-warmwhite)]/97 backdrop-blur-sm border-b border-[var(--color-odessi-smoke)]"
            : "bg-transparent"
          }
        `}
        style={{ height: "var(--navbar-height)" }}
      >
        <div className="container-odessi h-full flex items-center justify-between gap-4">

          {/* ── Mobile: Hamburger ── */}
          <button
            className="lg:hidden p-2 -ml-2 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <Menu
              size={22}
              strokeWidth={1.5}
              className={scrolled ? "text-[var(--color-odessi-black)]" : "text-white"}
            />
          </button>

          {/* ── Logo ── */}
          <Link
            href="/"
            aria-label="Odessi.tfi — Home"
            className="flex-shrink-0 lg:mr-auto focus-visible:outline-2 focus-visible:outline-offset-4 rounded-sm flex items-center"
          >
            <Image
              src={scrolled ? "/logo-dark.png" : "/logo-light.png"}
              alt="Odessi.tfi — WEAR YOUR STORY"
              width={220}
              height={40}
              priority
              className="h-10 sm:h-11 w-auto object-contain transition-opacity duration-300"
            />
          </Link>

          {/* ── Desktop center nav ── */}
          <nav
            aria-label="Primary navigation"
            onMouseLeave={handleNavMouseLeave}
            className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2"
          >
            {navLinks.map((link) => {
              const lower = link.label.toLowerCase();
              const isMegaTarget = lower === "shop" || lower === "collections";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => (isMegaTarget ? handleNavMouseEnter(link.label) : setActiveMegaMenu(null))}
                  className={`
                    type-nav link-underline transition-all duration-200 py-2 relative
                    ${scrolled
                      ? "text-[var(--color-odessi-black)] hover:opacity-60"
                      : "text-white hover:opacity-70"
                    }
                    ${activeMegaMenu === lower ? "opacity-100 font-bold text-[#D4AF37]" : ""}
                  `}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right action icons: Search | Account | Wishlist | Bag ── */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 ml-auto lg:ml-0">
            {/* 1. Search */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className={`p-2 transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm ${
                scrolled ? "text-[var(--color-odessi-black)]" : "text-white"
              }`}
            >
              <Search size={19} strokeWidth={1.5} />
            </button>

            {/* 2. Account Popover Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    aria-label="Account menu"
                    aria-expanded={accountMenuOpen}
                    className={`p-2 transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm flex items-center gap-1 ${
                      scrolled ? "text-[var(--color-odessi-black)]" : "text-white"
                    }`}
                  >
                    <User size={19} strokeWidth={1.5} />
                    {user.role === "ADMIN" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Admin user" />
                    )}
                  </button>

                  {/* Editorial Account Dropdown */}
                  {accountMenuOpen && (
                    <div
                      className={`
                        absolute right-0 mt-2 w-52 py-2 rounded-sm shadow-xl border z-50
                        ${scrolled
                          ? "bg-[var(--color-odessi-warmwhite)] border-[var(--color-odessi-smoke)] text-[var(--color-odessi-black)]"
                          : "bg-[#111111]/95 backdrop-blur-md border-white/10 text-white"
                        }
                      `}
                    >
                      {/* User Summary Header */}
                      <div className="px-4 py-2 border-b border-stone-500/20">
                        <p className="text-[10px] uppercase tracking-widest text-[var(--color-odessi-stone)] font-medium">
                          Signed in as
                        </p>
                        <p className="text-xs font-semibold truncate mt-0.5">
                          {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email}
                        </p>
                      </div>

                      {/* Dropdown Navigation */}
                      <div className="py-1">
                        {user.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium tracking-wide hover:bg-stone-500/10 transition-colors text-amber-500"
                          >
                            <ShieldCheck size={14} />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}

                        <Link
                          href="/account"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium tracking-wide hover:bg-stone-500/10 transition-colors"
                        >
                          <User size={14} strokeWidth={1.5} />
                          <span>My Account</span>
                        </Link>

                        <Link
                          href="/account?tab=orders"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium tracking-wide hover:bg-stone-500/10 transition-colors"
                        >
                          <ShoppingBag size={14} strokeWidth={1.5} />
                          <span>Orders</span>
                        </Link>

                        <Link
                          href="/wishlist"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium tracking-wide hover:bg-stone-500/10 transition-colors"
                        >
                          <Heart size={14} strokeWidth={1.5} />
                          <span>Wishlist</span>
                        </Link>
                      </div>

                      {/* Logout Button */}
                      <div className="pt-1 border-t border-stone-500/20">
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium tracking-wide text-red-500 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut size={14} strokeWidth={1.5} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  aria-label="Account Login"
                  className={`p-2 transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm ${
                    scrolled ? "text-[var(--color-odessi-black)]" : "text-white"
                  }`}
                >
                  <User size={19} strokeWidth={1.5} />
                </Link>
              )}
            </div>

            {/* 3. Wishlist */}
            <Link
              href="/wishlist"
              aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
              className={`p-2 relative transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm ${
                scrolled ? "text-[var(--color-odessi-black)]" : "text-white"
              }`}
            >
              <Heart size={19} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-odessi-black)] text-white text-[9px] font-semibold flex items-center justify-center leading-none"
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* 4. Bag / Cart */}
            <button
              onClick={() => {
                if (!user) {
                  router.push("/login?redirect=/cart");
                } else {
                  setCartDrawerOpen(true);
                }
              }}
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              className={`relative p-2 transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm ${
                scrolled ? "text-[var(--color-odessi-black)]" : "text-white"
              }`}
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {!authLoading && user && cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-odessi-black)] text-white text-[9px] font-semibold flex items-center justify-center leading-none"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Desktop Mega Menu Flyout ── */}
        {activeMegaMenu && (
          <div
            onMouseEnter={() => {
              if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
            }}
            onMouseLeave={handleNavMouseLeave}
            className={`
              hidden lg:block absolute top-full left-0 right-0 border-b shadow-2xl py-8 px-12 animate-in fade-in slide-in-from-top-2 duration-200
              ${scrolled
                ? "bg-[var(--color-odessi-warmwhite)]/98 border-[var(--color-odessi-smoke)] text-[var(--color-odessi-black)]"
                : "bg-[#0A0A0A]/98 backdrop-blur-md border-neutral-800 text-white"
              }
            `}
          >
            <div className="max-w-7xl mx-auto grid grid-cols-3 gap-12">
              {activeMegaMenu === "shop" ? (
                <>
                  <div>
                    <span className="text-[10px] font-mono tracking-[0.2em] text-[#D4AF37] uppercase font-semibold block mb-4">
                      GARMENT CATEGORIES
                    </span>
                    <ul className="space-y-3 text-xs uppercase tracking-wider font-medium">
                      <li>
                        <Link
                          href="/shop?category=tees"
                          onClick={() => setActiveMegaMenu(null)}
                          className="hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all opacity-85 hover:opacity-100"
                        >
                          Heavyweight Tees (240–280 GSM)
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?category=hoodies"
                          onClick={() => setActiveMegaMenu(null)}
                          className="hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all opacity-85 hover:opacity-100"
                        >
                          French Terry Hoodies (380 GSM)
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?category=sweatshirts"
                          onClick={() => setActiveMegaMenu(null)}
                          className="hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all opacity-85 hover:opacity-100"
                        >
                          Oversized Sweatshirts
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?newArrival=true"
                          onClick={() => setActiveMegaMenu(null)}
                          className="text-[#D4AF37] hover:translate-x-1 inline-block transition-all font-bold"
                        >
                          ⚡ Limited Drops & Launches
                        </Link>
                      </li>
                      <li className="pt-2 border-t border-neutral-500/20">
                        <Link
                          href="/shop"
                          onClick={() => setActiveMegaMenu(null)}
                          className="text-xs font-semibold underline underline-offset-4 hover:text-[#D4AF37] transition-colors"
                        >
                          Browse Full Catalog →
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono tracking-[0.2em] text-[#B89A5A] uppercase font-semibold block mb-4">
                      SILHOUETTE & CRAFT
                    </span>
                    <ul className="space-y-3 text-xs tracking-wide opacity-85">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        <span>Drop Shoulder Signature Oversized Fit</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        <span>100% Combed Compact Cotton</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        <span>High-Density HD Screen Printing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        <span>Preshrunk & Bio-Washed Finish</span>
                      </li>
                    </ul>
                  </div>

                  <div className={`rounded-xl p-5 flex flex-col justify-between border ${
                    scrolled ? "bg-white/80 border-neutral-200" : "bg-neutral-900/80 border-neutral-800"
                  }`}>
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold block mb-1">
                        EDITORIAL SPOTLIGHT
                      </span>
                      <h4 className="text-base font-serif font-bold uppercase tracking-tight mb-2">
                        THE DARK VERSE ATELIER
                      </h4>
                      <p className="text-xs opacity-75 leading-relaxed mb-4">
                        Cinematic silhouettes crafted with heavyweight textures and understated dark embroidery.
                      </p>
                    </div>
                    <Link
                      href="/shop?collection=dark-verse"
                      onClick={() => setActiveMegaMenu(null)}
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:underline"
                    >
                      EXPLORE COLLECTION →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] font-mono tracking-[0.2em] text-[#D4AF37] uppercase font-semibold block mb-4">
                      CURATED SERIES
                    </span>
                    <ul className="space-y-3 text-xs uppercase tracking-wider font-medium">
                      <li>
                        <Link
                          href="/collections/dark-verse"
                          onClick={() => setActiveMegaMenu(null)}
                          className="hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all opacity-85 hover:opacity-100"
                        >
                          Dark Verse Collection
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/collections/cinema-origins"
                          onClick={() => setActiveMegaMenu(null)}
                          className="hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all opacity-85 hover:opacity-100"
                        >
                          Cinema Origins
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/collections/the-protagonist"
                          onClick={() => setActiveMegaMenu(null)}
                          className="hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all opacity-85 hover:opacity-100"
                        >
                          The Protagonist Series
                        </Link>
                      </li>
                      <li className="pt-2 border-t border-neutral-500/20">
                        <Link
                          href="/collections"
                          onClick={() => setActiveMegaMenu(null)}
                          className="text-xs font-semibold underline underline-offset-4 hover:text-[#D4AF37] transition-colors"
                        >
                          View All Collections →
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono tracking-[0.2em] text-[#B89A5A] uppercase font-semibold block mb-4">
                      BESPOKE & COLLABS
                    </span>
                    <ul className="space-y-3 text-xs uppercase tracking-wider font-medium">
                      <li>
                        <Link
                          href="/custom"
                          onClick={() => setActiveMegaMenu(null)}
                          className="hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all opacity-85 hover:opacity-100"
                        >
                          Custom Atelier & Bulk Orders
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/partner"
                          onClick={() => setActiveMegaMenu(null)}
                          className="hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all opacity-85 hover:opacity-100"
                        >
                          Creators & Brand Collaborations
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className={`rounded-xl p-5 flex flex-col justify-between border ${
                    scrolled ? "bg-white/80 border-neutral-200" : "bg-neutral-900/80 border-neutral-800"
                  }`}>
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold block mb-1">
                        BRAND PHILOSOPHY
                      </span>
                      <h4 className="text-base font-serif font-bold uppercase tracking-tight mb-2">
                        WEAR YOUR STORY
                      </h4>
                      <p className="text-xs opacity-75 leading-relaxed mb-4">
                        Clothing inspired by the heroes of Indian cinema, engineered for those who carry their own legend.
                      </p>
                    </div>
                    <Link
                      href="/about"
                      onClick={() => setActiveMegaMenu(null)}
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:underline"
                    >
                      READ OUR STORY →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Mobile menu overlay ── */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        className={`
          fixed inset-0 z-50 lg:hidden
          transition-opacity duration-300
          ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          className={`
            absolute top-0 left-0 bottom-0 w-[min(320px,90vw)]
            bg-[var(--color-odessi-warmwhite)] flex flex-col
            transition-transform duration-350 ease-out
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-odessi-smoke)]">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Image
                src="/logo-dark.png"
                alt="Odessi.tfi — WEAR YOUR STORY"
                width={200}
                height={36}
                className="h-9.5 w-auto object-contain"
              />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="p-2 -mr-2 text-[var(--color-odessi-black)] hover:opacity-60 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Nav links */}
          <nav
            aria-label="Mobile navigation"
            className="flex-1 flex flex-col px-6 pt-8 pb-6 gap-1 overflow-y-auto"
          >
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`
                  type-h3 py-4 border-b border-[var(--color-odessi-smoke)]
                  text-[var(--color-odessi-black)] hover:text-[var(--color-odessi-stone)]
                  transition-colors duration-200
                  ${mobileOpen ? "animate-slide-right" : ""}
                `}
              >
                {link.label}
              </Link>
            ))}

            {/* Secondary links */}
            <div className="mt-8 flex flex-col gap-4">
              {user ? (
                <>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="type-caption text-amber-600 font-semibold hover:text-amber-700 transition-colors flex items-center gap-3"
                    >
                      <ShieldCheck size={15} />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="type-caption text-[var(--color-odessi-black)] hover:text-[var(--color-odessi-stone)] font-medium transition-colors flex items-center gap-3"
                  >
                    <User size={15} strokeWidth={1.5} />
                    My Account
                  </Link>
                  <Link
                    href="/account?tab=orders"
                    onClick={() => setMobileOpen(false)}
                    className="type-caption text-[var(--color-odessi-black)] hover:text-[var(--color-odessi-stone)] font-medium transition-colors flex items-center gap-3"
                  >
                    <ShoppingBag size={15} strokeWidth={1.5} />
                    Orders
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="type-caption text-[var(--color-odessi-black)] hover:text-[var(--color-odessi-stone)] font-medium transition-colors flex items-center gap-3"
                  >
                    <Heart size={15} strokeWidth={1.5} />
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-[var(--color-odessi-black)] text-white rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="type-caption text-left text-red-600 hover:text-red-700 font-medium transition-colors flex items-center gap-3 pt-2 border-t border-[var(--color-odessi-smoke)]"
                  >
                    <LogOut size={15} strokeWidth={1.5} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="type-caption text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] transition-colors flex items-center gap-3"
                  >
                    <User size={15} strokeWidth={1.5} />
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="type-caption text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] transition-colors flex items-center gap-3"
                  >
                    Create Account
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="type-caption text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] transition-colors flex items-center gap-3"
                  >
                    <Heart size={15} strokeWidth={1.5} />
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-[var(--color-odessi-black)] text-white rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-[var(--color-odessi-smoke)]">
            <p className="type-caption text-[var(--color-odessi-stone)]">
              {siteConfig.instagramHandle}
            </p>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
