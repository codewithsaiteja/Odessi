"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, calculateDiscount, getMediaUrl } from "@/lib/product-utils";

interface ProductCardProps {
  product: Product;
  onWishlistToggle?: (productId: string) => void;
  onQuickAdd?: (product: Product) => void;
  isWishlisted?: boolean;
  className?: string;
}

export default function ProductCard({
  product,
  onWishlistToggle,
  onQuickAdd,
  isWishlisted = false,
  className = "",
}: ProductCardProps) {
  const [showSecondImage, setShowSecondImage] = useState(false);

  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const hasSecondImage = product.images.length > 1;
  const isOutOfStock = !product.available || product.stockStatus === "out_of_stock";
  const isLowStock = product.stockStatus === "low_stock";
  const isComingSoon = product.stockStatus === "coming_soon";

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWishlistToggle?.(product.id);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock && !isComingSoon) {
      onQuickAdd?.(product);
    }
  };

  const rawFirst = typeof product.images?.[0] === "string" ? product.images[0] : (product.images as unknown as { imageUrl: string }[])?.[0]?.imageUrl || product.thumbnail;
  const rawSecond = typeof product.images?.[1] === "string" ? product.images[1] : (product.images as unknown as { imageUrl: string }[])?.[1]?.imageUrl;
  const firstImage = getMediaUrl(rawFirst);
  const secondImage = getMediaUrl(rawSecond || rawFirst);
  const categoryName = typeof product.category === "string" ? product.category.replace("-", " ") : (product.category as unknown as { name: string })?.name || "";

  return (
    <div className={`group relative ${className}`}>
      {/* Product Link */}
      <Link
        href={`/product/${product.slug}`}
        className="block"
        onMouseEnter={() => setShowSecondImage(true)}
        onMouseLeave={() => setShowSecondImage(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#F3F0E8] rounded-sm">
          {/* Primary Image */}
          <Image
            src={showSecondImage && hasSecondImage ? secondImage : firstImage}
            alt={product.name}
            fill
            className={`
              object-cover transition-all duration-500 ease-out
              ${showSecondImage && hasSecondImage ? "scale-105" : "scale-100"}
            `}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.newDrop && (
              <span className="px-2 py-1 text-[10px] font-semibold tracking-wide bg-[var(--color-odessi-black)] text-white rounded-full">
                NEW
              </span>
            )}
            {product.bestseller && !product.newDrop && (
              <span className="px-2 py-1 text-[10px] font-semibold tracking-wide bg-[var(--color-odessi-stone)] text-white rounded-full">
                BESTSELLER
              </span>
            )}
            {discount > 0 && (
              <span className="px-2 py-1 text-[10px] font-semibold tracking-wide bg-red-600 text-white rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Stock Status */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-3 py-1 text-xs font-semibold tracking-wide bg-white text-[var(--color-odessi-black)] rounded-full">
                OUT OF STOCK
              </span>
            </div>
          )}
          {isComingSoon && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-3 py-1 text-xs font-semibold tracking-wide bg-white text-[var(--color-odessi-black)] rounded-full">
                COMING SOON
              </span>
            </div>
          )}

          {/* Low Stock Warning */}
          {isLowStock && !isOutOfStock && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-1 text-[10px] font-semibold tracking-wide bg-orange-500 text-white rounded-full">
                LOW STOCK
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            className={`
              absolute top-3 right-3 p-2 rounded-full transition-all duration-200
              ${isWishlisted 
                ? "bg-[var(--color-odessi-black)] text-white" 
                : "bg-white/90 text-[var(--color-odessi-black)] hover:bg-white"
              }
              opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100
              transform translate-y-0 sm:translate-y-1 sm:group-hover:translate-y-0
            `}
            aria-label={`${isWishlisted ? "Remove from" : "Add to"} wishlist`}
          >
            <Heart
              size={14}
              strokeWidth={1.5}
              className={isWishlisted ? "fill-current" : ""}
            />
          </button>

          {/* Quick Add Button */}
          {!isOutOfStock && !isComingSoon && (
            <button
              onClick={handleQuickAdd}
              className="
                absolute bottom-3 right-3 p-2 rounded-full 
                bg-[var(--color-odessi-black)] text-white
                hover:bg-[var(--color-odessi-stone)] transition-all duration-200
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100
                transform translate-y-0 sm:translate-y-1 sm:group-hover:translate-y-0
              "
              aria-label="Quick add to cart"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="pt-4 space-y-2">
          {/* Category */}
          <p className="text-xs tracking-wide text-[var(--color-odessi-stone)] uppercase font-medium">
            {categoryName}
          </p>

          {/* Product Name */}
          <h3 className="type-body font-semibold text-[var(--color-odessi-black)] line-clamp-2 group-hover:text-[var(--color-odessi-stone)] transition-colors duration-200">
            {product.name}
          </h3>

          {/* Tagline */}
          {product.tagline && (
            <p className="text-sm text-[var(--color-odessi-stone)] line-clamp-1">
              {product.tagline}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="type-body font-semibold text-[var(--color-odessi-black)]">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-[var(--color-odessi-stone)] line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Available Colors */}
          {product.colors.length > 1 && (
            <div className="flex items-center gap-1 pt-1">
              {product.colors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-[var(--color-odessi-smoke)]"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-[var(--color-odessi-stone)] ml-1">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}