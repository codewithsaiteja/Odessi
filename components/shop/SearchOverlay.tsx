"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, TrendingUp } from "lucide-react";
import { searchProducts } from "@/lib/product-utils";
import { getProducts } from "@/lib/api/products";
import { formatPrice } from "@/lib/cart";
import type { Product } from "@/types";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("odessi_recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    }
  }, []);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Perform live search with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      setIsSearching(true);
      let isCancelled = false;

      const timer = setTimeout(async () => {
        try {
          const res = await getProducts({ search: trimmed, pageSize: 8 });
          if (!isCancelled) {
            if (res && res.data && res.data.length > 0) {
              setResults(res.data.slice(0, 8));
            } else {
              const localResults = searchProducts({ q: trimmed });
              setResults(localResults.slice(0, 8));
            }
          }
        } catch {
          if (!isCancelled) {
            const localResults = searchProducts({ q: trimmed });
            setResults(localResults.slice(0, 8));
          }
        } finally {
          if (!isCancelled) {
            setIsSearching(false);
          }
        }
      }, 250);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      // Save to recent searches
      const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
      setRecentSearches(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("odessi_recent_searches", JSON.stringify(updated));
      }

      // Navigate to shop with search query
      router.push(`/shop?search=${encodeURIComponent(trimmed)}`);
      onClose();
    }
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("odessi_recent_searches");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[var(--color-odessi-smoke)]">
        <div className="container-odessi py-4">
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-[var(--color-odessi-smoke)] rounded-sm">
              <Search size={20} strokeWidth={1.5} className="text-[var(--color-odessi-stone)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(query);
                }}
                placeholder="Search for products..."
                className="flex-1 bg-transparent outline-none text-[var(--color-odessi-black)] placeholder:text-[var(--color-odessi-stone)]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 hover:opacity-60 transition-opacity"
                  aria-label="Clear search"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:opacity-60 transition-opacity"
              aria-label="Close search"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container-odessi py-8">
          {query.trim().length === 0 ? (
            /* No Query - Show Recent Searches */
            <div>
              {recentSearches.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="type-caption font-semibold text-[var(--color-odessi-black)] flex items-center gap-2">
                      <TrendingUp size={16} strokeWidth={1.5} />
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="px-3 py-2 text-sm border border-[var(--color-odessi-smoke)] rounded-full hover:border-[var(--color-odessi-black)] hover:bg-[var(--color-odessi-smoke)] transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <h3 className="type-caption font-semibold text-[var(--color-odessi-black)] mb-4">
                  Popular Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["Tees", "Hoodies", "Dark Verse", "New Drops", "Custom"].map((term) => (
                    <button
                      key={term}
                      onClick={() => handleRecentSearchClick(term)}
                      className="px-3 py-2 text-sm bg-[var(--color-odessi-smoke)] rounded-full hover:bg-[var(--color-odessi-black)] hover:text-white transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : isSearching ? (
            /* Loading State */
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-odessi-black)] mx-auto mb-4"></div>
              <p className="text-[var(--color-odessi-stone)]">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            /* Search Results */
            <div>
              <h3 className="type-caption font-semibold text-[var(--color-odessi-black)] mb-4">
                {results.length} {results.length === 1 ? "Result" : "Results"} for "{query}"
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="group block"
                  >
                    <div className="relative aspect-[3/4] bg-[var(--color-odessi-smoke)] rounded-sm overflow-hidden mb-3">
                      <Image
                        src={product.thumbnail || product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                    <h4 className="type-body font-semibold text-[var(--color-odessi-black)] group-hover:text-[var(--color-odessi-stone)] transition-colors mb-1 line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-sm text-[var(--color-odessi-stone)] mb-1 uppercase tracking-wide">
                      {product.category.replace("-", " ")}
                    </p>
                    <p className="type-body font-semibold text-[var(--color-odessi-black)]">
                      {formatPrice(product.price)}
                    </p>
                  </Link>
                ))}
              </div>

              {/* View All Results */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => handleSearch(query)}
                  className="inline-block px-8 py-3 border-2 border-[var(--color-odessi-black)] text-[var(--color-odessi-black)] type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-black)] hover:text-white transition-colors"
                >
                  VIEW ALL RESULTS
                </button>
              </div>
            </div>
          ) : (
            /* No Results */
            <div className="text-center py-12">
              <Search size={48} strokeWidth={1} className="mx-auto mb-4 text-[var(--color-odessi-stone)]" />
              <h3 className="type-h3 text-[var(--color-odessi-black)] mb-2">
                No results for "{query}"
              </h3>
              <p className="type-body text-[var(--color-odessi-stone)] mb-6">
                Try different keywords or browse our collections
              </p>
              <Link
                href="/shop"
                onClick={onClose}
                className="inline-block px-8 py-3 bg-[var(--color-odessi-black)] text-white type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
              >
                BROWSE ALL PRODUCTS
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}