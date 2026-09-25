"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { formatPrice, getMediaUrl } from "@/lib/product-utils";
import type { Product } from "@/types";

interface MobileStickyBarProps {
  product: Product;
  selectedSize: string;
  isOutOfStock: boolean;
  onAddToCart: () => void;
  onNotifyMe: () => void;
  addedToCart: boolean;
  onOpenTryOn?: () => void;
}

export function MobileStickyBar({
  product,
  selectedSize,
  isOutOfStock,
  onAddToCart,
  onNotifyMe,
  addedToCart,
  onOpenTryOn,
}: MobileStickyBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling down 500px
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  const rawImage = typeof product.images?.[0] === "string" ? product.images[0] : product.thumbnail;
  const imageSrc = getMediaUrl(rawImage);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[var(--color-odessi-smoke)] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3">
        {/* Product thumb & name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 shrink-0 bg-[#F3F0E8] rounded-sm overflow-hidden border border-neutral-200">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              sizes="44px"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--color-odessi-black)] truncate">
              {product.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--color-odessi-black)]">
                {formatPrice(product.price)}
              </span>
              {selectedSize && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">
                  {selectedSize}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenTryOn && (
            <button
              type="button"
              onClick={onOpenTryOn}
              className="p-2.5 bg-neutral-900 border border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-sm transition-colors flex items-center justify-center shadow-sm"
              title="Virtual Try-On with Camera"
              aria-label="Virtual Try-On with Camera"
            >
              <Camera size={16} />
            </button>
          )}

          {isOutOfStock ? (
            <button
              onClick={onNotifyMe}
              className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm"
            >
              NOTIFY ME
            </button>
          ) : (
            <button
              onClick={onAddToCart}
              className={`
                px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all shadow-sm
                ${addedToCart
                  ? "bg-green-600 text-white"
                  : "bg-[var(--color-odessi-black)] text-white hover:bg-[var(--color-odessi-stone)]"
                }
              `}
            >
              {addedToCart ? "✓ ADDED" : "ADD TO BAG"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
