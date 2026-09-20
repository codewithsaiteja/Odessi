"use client";

import type { Product, ProductFilters, ProductSort } from "@/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  filters?: ProductFilters;
  sort?: ProductSort;
  onWishlistToggle?: (productId: string) => void;
  onQuickAdd?: (product: Product) => void;
  wishlistedProducts?: string[];
  className?: string;
  emptyStateMessage?: string;
}

export default function ProductGrid({
  products,
  filters = {},
  sort = { field: "featured" },
  onWishlistToggle,
  onQuickAdd,
  wishlistedProducts = [],
  className = "",
  emptyStateMessage = "No products found matching your criteria.",
}: ProductGridProps) {
  // Backend returned products are already server-side filtered and sorted from PostgreSQL database.
  // Direct rendering avoids stripping valid product summaries due to incomplete client-side DTO fields.
  const processedProducts = products;

  if (processedProducts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="type-body text-[var(--color-odessi-stone)] mb-4">
          {emptyStateMessage}
        </p>
        <p className="text-sm text-[var(--color-odessi-stone)]">
          Try adjusting your filters or browse all products.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-[var(--color-odessi-stone)]">
          {processedProducts.length} product{processedProducts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Product Grid */}
      <div className="
        grid gap-x-4 gap-y-8
        grid-cols-2 
        sm:grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-4
        auto-rows-fr
      ">
        {processedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onWishlistToggle={onWishlistToggle}
            onQuickAdd={onQuickAdd}
            isWishlisted={wishlistedProducts.includes(product.id)}
          />
        ))}
      </div>
    </div>
  );
}