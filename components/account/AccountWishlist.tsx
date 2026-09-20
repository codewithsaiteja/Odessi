"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { WishlistItem } from "@/types";
import { removeWishlistItem } from "@/lib/api/wishlist";
import { Heart, Trash2, ShoppingBag, ExternalLink } from "lucide-react";

interface AccountWishlistProps {
  wishlistItems: WishlistItem[];
  onRefreshWishlist: () => Promise<void>;
}

export default function AccountWishlist({
  wishlistItems,
  onRefreshWishlist,
}: AccountWishlistProps) {
  const handleRemove = async (productId: number) => {
    try {
      await removeWishlistItem(productId);
      await onRefreshWishlist();
    } catch (err: unknown) {
      console.error("Failed to remove wishlist item:", err);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
            <Heart size={22} className="text-rose-400" /> My Wishlist
          </h2>
          <p className="text-neutral-400 text-xs mt-1">
            Keep track of your luxury favorites and curated pieces.
          </p>
        </div>
        <span className="text-xs font-mono text-neutral-400 bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800">
          {wishlistItems.length} Saved
        </span>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="py-12 text-center space-y-4">
          <Heart size={48} className="mx-auto text-neutral-700" />
          <p className="text-neutral-400 text-sm">Your wishlist is currently empty.</p>
          <Link
            href="/shop"
            className="inline-block bg-amber-400 text-neutral-950 font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-amber-300 transition-colors"
          >
            Explore Collections
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => {
            const prod = item.product;
            if (!prod) return null;

            return (
              <div
                key={item.product?.id || item.addedAt}
                className="bg-neutral-950/60 border border-neutral-800 rounded-xl overflow-hidden group hover:border-neutral-700 transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-square bg-neutral-900 overflow-hidden">
                  {prod.thumbnail || prod.images?.[0] ? (
                    <Image
                      src={prod.thumbnail || prod.images[0]}
                      alt={prod.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <ShoppingBag size={32} />
                    </div>
                  )}

                  <button
                    onClick={() => handleRemove(Number(prod.id))}
                    className="absolute top-3 right-3 bg-neutral-950/80 text-neutral-400 hover:text-red-400 p-2 rounded-full backdrop-blur-md transition-colors"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      ₹{(prod.price || 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/product/${prod.slug}`}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-750 text-white font-semibold py-2 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      View Piece <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
