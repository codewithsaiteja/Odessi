"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { WishlistItem, Product } from "@/types";
import * as wishlistLib from "./wishlist";

interface WishlistContextType {
  wishlist: WishlistItem[];
  itemCount: number;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => boolean;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Initialize wishlist from localStorage
  useEffect(() => {
    const storedWishlist = wishlistLib.getWishlist();
    setWishlist(storedWishlist);
  }, []);

  // Listen for wishlist updates from other tabs/windows
  useEffect(() => {
    const handleWishlistUpdate = () => {
      const updatedWishlist = wishlistLib.getWishlist();
      setWishlist(updatedWishlist);
    };

    window.addEventListener("wishlist-updated", handleWishlistUpdate);
    window.addEventListener("storage", handleWishlistUpdate);

    return () => {
      window.removeEventListener("wishlist-updated", handleWishlistUpdate);
      window.removeEventListener("storage", handleWishlistUpdate);
    };
  }, []);

  const addToWishlist = (product: Product) => {
    const updatedWishlist = wishlistLib.addToWishlist(product);
    setWishlist(updatedWishlist);
  };

  const removeFromWishlist = (productId: string) => {
    const updatedWishlist = wishlistLib.removeFromWishlist(productId);
    setWishlist(updatedWishlist);
  };

  const toggleWishlist = (product: Product): boolean => {
    const { added, wishlist: updatedWishlist } = wishlistLib.toggleWishlist(product);
    setWishlist(updatedWishlist);
    return added;
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistLib.isInWishlist(productId);
  };

  const clearWishlist = () => {
    wishlistLib.clearWishlist();
    setWishlist([]);
  };

  const itemCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        itemCount,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    // Return default values during SSR/build time
    if (typeof window === "undefined") {
      return {
        wishlist: [],
        itemCount: 0,
        addToWishlist: () => {},
        removeFromWishlist: () => {},
        toggleWishlist: () => false,
        isInWishlist: () => false,
        clearWishlist: () => {},
      };
    }
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}