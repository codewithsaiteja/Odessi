"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryNav from "@/components/shop/CategoryNav";
import Filters from "@/components/shop/Filters";
import Sort from "@/components/shop/Sort";
import ProductGrid from "@/components/product/ProductGrid";
import type { Product, ProductFilters, ProductSort, PaginatedResponse } from "@/types";
import { getProducts } from "@/lib/api/products";
import { filtersToUrlParams } from "@/lib/product-utils";

/* ── Skeleton Card Loader Component ── */
function ProductCardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="w-full aspect-[3/4] bg-[#EAE7DF] rounded-sm" />
      <div className="space-y-2">
        <div className="h-3 w-1/4 bg-[#EAE7DF] rounded-sm" />
        <div className="h-4 w-3/4 bg-[#EAE7DF] rounded-sm" />
        <div className="h-4 w-1/3 bg-[#EAE7DF] rounded-sm" />
      </div>
    </div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state inputs
  const categoryParam = searchParams.get("category") || undefined;
  const collectionParam = searchParams.get("collection") || undefined;
  const sizeParam = searchParams.get("size") || undefined;
  const colorParam = searchParams.get("color") || undefined;
  const minPriceParam = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPriceParam = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const availableParam = searchParams.get("available") === "true" ? true : undefined;
  const newArrivalParam = searchParams.get("newArrival") === "true" ? true : undefined;
  const sortParam = (searchParams.get("sort") as ProductSort["field"]) || "newest";
  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "0", 10);

  // Local state
  const [searchInput, setSearchInput] = useState(searchParam);
  const [productsData, setProductsData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistedProducts, setWishlistedProducts] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Stale request prevention token
  const lastRequestId = useRef(0);

  // Sync search input if URL changes independently
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Main Backend Product Fetcher
  const fetchProductsFromBackend = useCallback(async () => {
    const currentReqId = ++lastRequestId.current;
    setLoading(true);
    setError(null);

    try {
      const res = await getProducts({
        category: categoryParam,
        collection: collectionParam,
        sizeFilter: sizeParam,
        color: colorParam,
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
        available: availableParam,
        newArrival: newArrivalParam,
        search: searchParam || undefined,
        sort: sortParam,
        page: pageParam,
        pageSize: 16,
      });

      // Ignore if a newer request was dispatched while this request was pending
      if (currentReqId === lastRequestId.current) {
        setProductsData(res);
        setLoading(false);
      }
    } catch (err: any) {
      if (currentReqId === lastRequestId.current) {
        console.error("[Shop] Product catalog fetch failed:", err);
        setError("Something went wrong while loading the collection.");
        setLoading(false);
      }
    }
  }, [
    categoryParam,
    collectionParam,
    sizeParam,
    colorParam,
    minPriceParam,
    maxPriceParam,
    availableParam,
    newArrivalParam,
    searchParam,
    sortParam,
    pageParam,
  ]);

  useEffect(() => {
    fetchProductsFromBackend();
  }, [fetchProductsFromBackend]);

  // Debounced search input handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchParam) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput.trim()) {
          params.set("search", searchInput.trim());
        } else {
          params.delete("search");
        }
        params.set("page", "0"); // reset page on search change
        router.push(`/shop?${params.toString()}`, { scroll: false });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, searchParam, searchParams, router]);

  // Handle Page Navigation
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/shop?${params.toString()}`, { scroll: true });
  };

  // Clear All Filters Helper
  const handleClearFilters = () => {
    setSearchInput("");
    router.push("/shop", { scroll: true });
  };

  const activeFilterCount = [
    categoryParam,
    collectionParam,
    sizeParam,
    colorParam,
    minPriceParam !== undefined,
    maxPriceParam !== undefined,
    availableParam,
    searchParam,
  ].filter(Boolean).length;

  const handleWishlistToggle = (productId: string) => {
    setWishlistedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleQuickAdd = (_product: Product) => {
    // Quick-add integration handled by Add to Cart on product detail page
  };

  const productsList = productsData?.data || [];
  const totalElements = productsData?.total ?? 0;
  const totalPages = productsData?.totalPages ?? 1;
  const currentPage = productsData?.page ?? 0;

  return (
    <>
      {/* ── Fixed Top Announcement Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>

      {/* ── Navigation ── */}
      <Navbar />

      {/* ── Main Content Container ── */}
      <main className="pt-[calc(var(--announcement-height)+var(--navbar-height))] bg-[#FAF9F6] min-h-screen text-[#080808]">
        <div className="container-odessi">
          {/* Breadcrumb */}
          <nav className="py-4 text-xs font-mono uppercase tracking-wider text-[#737373]" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-black transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-black font-semibold">Shop</li>
              {categoryParam && (
                <>
                  <li>/</li>
                  <li className="text-black capitalize">{categoryParam.replace("-", " ")}</li>
                </>
              )}
            </ol>
          </nav>

          {/* ── Editorial Header ── */}
          <header className="py-8 border-b border-[#EAE7DF]">
            <div className="max-w-2xl">
              <span className="text-xs font-mono tracking-[0.2em] text-[#D4AF37] uppercase font-semibold block mb-2">
                COLLECTION CATALOG
              </span>
              <h1 className="type-h1 text-[#080808] mb-3 uppercase font-serif tracking-tight">
                SHOP
              </h1>
              <p className="type-body text-[#525252] leading-relaxed text-sm md:text-base">
                Explore the collection. Hero-inspired apparel designed for those who carry their own story.
              </p>
            </div>
          </header>

          {/* ── Category Navigation Bar ── */}
          <div className="py-5 border-b border-[#EAE7DF]">
            <CategoryNav />
          </div>

          {/* ── Filter / Search / Sort Controls Bar ── */}
          <div className="py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#EAE7DF]">
            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by product name, story or character..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#EAE7DF] rounded-sm text-sm text-[#080808] placeholder-[#A3A3A3] focus:outline-none focus:border-[#080808] transition-colors"
                aria-label="Search product catalog"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#080808]"
                  aria-label="Clear search input"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Controls Right Section */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              {/* Active Results Summary */}
              <span className="text-xs font-mono text-[#737373] hidden sm:inline-block">
                {loading ? "SEARCHING..." : `${totalElements} PIECE${totalElements !== 1 ? "S" : ""}`}
              </span>

              {/* Mobile Filter Sheet Button */}
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-[#EAE7DF] rounded-sm text-xs font-semibold text-[#080808]"
                aria-label="Toggle filters"
              >
                <SlidersHorizontal size={14} />
                FILTERS
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#080808] text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <Sort />
            </div>
          </div>

          {/* ── Main Catalog Workspace ── */}
          <div className="py-8">
            <div className="flex flex-col lg:flex-row gap-10">

              {/* Desktop Filters Sidebar */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-[calc(var(--announcement-height)+var(--navbar-height)+2rem)]">
                  <Filters />
                </div>
              </aside>

              {/* Mobile Filters Drawer Modal */}
              {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-white">
                  <div className="p-4 border-b border-[#EAE7DF] flex items-center justify-between bg-[#FAF9F6]">
                    <h2 className="type-caption font-semibold text-black uppercase tracking-wider">
                      FILTERS ({activeFilterCount})
                    </h2>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-2 text-black hover:text-[#737373]"
                      aria-label="Close filters"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <Filters />
                  </div>
                  <div className="p-4 border-t border-[#EAE7DF] bg-white">
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full py-3 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-sm"
                    >
                      VIEW RESULTS ({totalElements})
                    </button>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">

                {/* 13. LOADING STATE */}
                {loading ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#737373] animate-pulse">
                        Loading products from catalog database...
                      </span>
                    </div>
                    <div className="grid gap-x-4 gap-y-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <ProductCardSkeleton key={idx} />
                      ))}
                    </div>
                  </div>
                ) : error ? (

                  /* 15. API ERROR STATE */
                  <div className="py-20 text-center bg-white border border-red-200 rounded-sm p-8 max-w-lg mx-auto shadow-sm">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={24} />
                    </div>
                    <h2 className="type-h3 text-black mb-2">PRODUCTS COULDN'T LOAD</h2>
                    <p className="type-body text-[#737373] text-sm mb-6">
                      {error} Please check your connection or retry fetching from backend storage.
                    </p>
                    <button
                      onClick={fetchProductsFromBackend}
                      className="px-6 py-3 bg-black text-white text-xs font-semibold tracking-wider uppercase rounded-sm hover:bg-[#2A2A2A] transition-colors"
                    >
                      TRY AGAIN
                    </button>
                  </div>
                ) : productsList.length === 0 ? (

                  /* 14. EMPTY STATE */
                  <div className="py-24 text-center bg-white border border-[#EAE7DF] rounded-sm p-8 max-w-lg mx-auto">
                    <div className="w-12 h-12 bg-[#FAF9F6] text-[#737373] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EAE7DF]">
                      <Search size={20} />
                    </div>
                    <h2 className="type-h3 text-[#080808] mb-2 font-serif uppercase tracking-tight">
                      NO PRODUCTS FOUND
                    </h2>
                    <p className="type-body text-[#737373] text-sm mb-6 leading-relaxed">
                      We couldn't find any items matching your active filter criteria. Try removing a filter or exploring another collection.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={handleClearFilters}
                        className="w-full sm:w-auto px-6 py-3 bg-[#080808] text-white text-xs font-semibold tracking-wider uppercase rounded-sm hover:bg-[#2A2A2A] transition-colors"
                      >
                        CLEAR FILTERS
                      </button>
                      <Link
                        href="/shop"
                        className="w-full sm:w-auto px-6 py-3 border border-[#EAE7DF] text-[#080808] text-xs font-semibold tracking-wider uppercase rounded-sm hover:border-black transition-colors"
                      >
                        VIEW ALL PRODUCTS
                      </Link>
                    </div>
                  </div>
                ) : (

                  /* 5. PRODUCT GRID (Desktop 4 cols, Tablet 3 cols, Mobile 2 cols) */
                  <div>
                    <ProductGrid
                      products={productsList}
                      onWishlistToggle={handleWishlistToggle}
                      onQuickAdd={handleQuickAdd}
                      wishlistedProducts={wishlistedProducts}
                    />

                    {/* 11. PAGINATION */}
                    {totalPages > 1 && (
                      <div className="mt-16 pt-8 border-t border-[#EAE7DF] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-xs font-mono text-[#737373]">
                          Page {currentPage + 1} of {totalPages} ({totalElements} total products)
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="flex items-center gap-1 px-4 py-2 border border-[#EAE7DF] bg-white rounded-sm text-xs font-semibold text-[#080808] disabled:opacity-40 disabled:cursor-not-allowed hover:border-black transition-colors"
                            aria-label="Previous Page"
                          >
                            <ChevronLeft size={14} />
                            PREV
                          </button>

                          {/* Page Indicators */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => handlePageChange(idx)}
                                className={`w-8 h-8 text-xs font-mono rounded-sm transition-colors ${
                                  currentPage === idx
                                    ? "bg-[#080808] text-white font-bold"
                                    : "bg-white border border-[#EAE7DF] text-[#737373] hover:text-black hover:border-black"
                                }`}
                              >
                                {idx + 1}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                            className="flex items-center gap-1 px-4 py-2 border border-[#EAE7DF] bg-white rounded-sm text-xs font-semibold text-[#080808] disabled:opacity-40 disabled:cursor-not-allowed hover:border-black transition-colors"
                            aria-label="Next Page"
                          >
                            NEXT
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4" />
            <p className="text-xs font-mono text-[#737373] tracking-widest uppercase">
              Loading ODESSI Shop Catalog...
            </p>
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}