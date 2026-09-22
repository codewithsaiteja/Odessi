"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types";
import { getProducts } from "@/lib/api/products";

interface RecentlyViewedProps {
  currentProductId?: string;
  className?: string;
}

export function RecentlyViewed({ currentProductId, className = "" }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track current product in recently viewed
    if (currentProductId) {
      try {
        const stored = localStorage.getItem("odessi_recently_viewed");
        const list: string[] = stored ? JSON.parse(stored) : [];
        const updated = [currentProductId, ...list.filter((id) => id !== currentProductId)].slice(0, 8);
        localStorage.setItem("odessi_recently_viewed", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to update recently viewed:", err);
      }
    }

    // Fetch details of stored recently viewed (excluding current product)
    async function loadRecent() {
      try {
        const stored = localStorage.getItem("odessi_recently_viewed");
        if (!stored) {
          setLoading(false);
          return;
        }
        const ids: string[] = JSON.parse(stored).filter((id: string) => id !== currentProductId);
        if (ids.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch products catalog
        const res = await getProducts({ pageSize: 20 });
        const matched = (res.data || []).filter((p) => ids.includes(p.id));
        setRecentProducts(matched.slice(0, 4));
      } catch (err) {
        console.error("Failed to load recently viewed items:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRecent();
  }, [currentProductId]);

  if (loading || recentProducts.length === 0) return null;

  return (
    <section className={`py-12 border-t border-[var(--color-odessi-smoke)] ${className}`}>
      <div className="container-odessi">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[11px] font-mono tracking-[0.2em] text-[#D4AF37] uppercase font-semibold block mb-1">
              DISCOVERED BY YOU
            </span>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-[var(--color-odessi-black)] uppercase tracking-tight">
              RECENTLY VIEWED
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {recentProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
