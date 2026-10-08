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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-white/10 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3">
        {/* Product thumb & name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 shrink-0 bg-[#121212] rounded-none overflow-hidden border border-white/10">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              sizes="44px"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#f3f0e8] truncate">
              {product.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[#b89a5a]">
                {formatPrice(product.price)}
              </span>
              {selectedSize && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-[#171717] border border-white/10 rounded-none text-[#f3f0e8]">
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
              className="p-2.5 bg-[#171717] border border-[#b89a5a]/40 text-[#b89a5a] hover:bg-[#b89a5a] hover:text-[#080808] rounded-none transition-colors flex items-center justify-center shadow-sm"
              title="Virtual Try-On with Camera"
              aria-label="Virtual Try-On with Camera"
            >
              <Camera size={15} />
            </button>
          )}

          {isOutOfStock ? (
            <button
              onClick={onNotifyMe}
              className="px-4 py-2.5 bg-[#171717] hover:bg-[#222222] text-[#f3f0e8] text-[10px] font-mono uppercase tracking-[0.15em] border border-white/10 rounded-none shadow-sm"
            >
              NOTIFY ME
            </button>
          ) : (
            <button
              onClick={onAddToCart}
              className={`
                px-5 py-2.5 text-[11px] font-mono font-semibold uppercase tracking-[0.15em] rounded-none transition-all duration-300 shadow-sm
                ${addedToCart
                  ? "bg-[#171717] text-[#b89a5a] border border-[#b89a5a]/50"
                  : "bg-[#f3f0e8] text-[#080808] hover:bg-[#b89a5a] hover:text-[#080808]"
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
