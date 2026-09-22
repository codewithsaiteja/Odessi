"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { WishlistItem, Product } from "@/types";
import * as wishlistLib from "./wishlist";
import { useAuth } from "./auth/AuthContext";
import { fetchUserWishlist, addWishlistItem, removeWishlistItem } from "./api/wishlist";

interface WishlistContextType {
  wishlist: WishlistItem[];
  itemCount: number;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => boolean;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const { user } = useAuth();

  const syncWithBackend = useCallback(async () => {
    if (!user) {
      setWishlist(wishlistLib.getWishlist());
      return;
    }

    try {
      // Check for any offline local items that need to be merged to backend
      const localItems = wishlistLib.getWishlist();
      if (localItems.length > 0) {
        for (const item of localItems) {
          const numId = Number(item.product.id);
          if (!isNaN(numId)) {
            try {
              await addWishlistItem(numId);
            } catch {
              // Ignore if already in backend wishlist
            }
          }
        }
        wishlistLib.clearWishlist();
      }

      // Fetch authoritative backend wishlist
      const backendItems = await fetchUserWishlist();
      setWishlist(backendItems);
    } catch (err) {
      console.warn("Backend wishlist sync fallback to local storage:", err);
      setWishlist(wishlistLib.getWishlist());
    }
  }, [user]);

  // Sync on mount and when auth status changes
  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Listen for storage events across tabs
  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (!user) {
        setWishlist(wishlistLib.getWishlist());
      }
    };

    window.addEventListener("wishlist-updated", handleWishlistUpdate);
    window.addEventListener("storage", handleWishlistUpdate);

    return () => {
      window.removeEventListener("wishlist-updated", handleWishlistUpdate);
      window.removeEventListener("storage", handleWishlistUpdate);
    };
  }, [user]);

  const addToWishlist = (product: Product) => {
    // Optimistic local update
    const updated = wishlistLib.addToWishlist(product);
    setWishlist(updated);

    if (user) {
      const numId = Number(product.id);
      if (!isNaN(numId)) {
        addWishlistItem(numId).catch((err) => {
          console.error("Failed to add to backend wishlist:", err);
        });
      }
    }
  };

  const removeFromWishlist = (productId: string) => {
    // Optimistic local update
    const updated = wishlistLib.removeFromWishlist(productId);
    setWishlist(updated);

    if (user) {
      const numId = Number(productId);
      if (!isNaN(numId)) {
        removeWishlistItem(numId).catch((err) => {
          console.error("Failed to remove from backend wishlist:", err);
        });
      }
    }
  };

  const toggleWishlist = (product: Product): boolean => {
    const exists = wishlist.some((item) => item.product.id === product.id);
    if (exists) {
      removeFromWishlist(product.id);
      return false;
    } else {
      addToWishlist(product);
      return true;
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((item) => item.product.id === productId);
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
        refreshWishlist: syncWithBackend,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    if (typeof window === "undefined") {
      return {
        wishlist: [],
        itemCount: 0,
        addToWishlist: () => {},
        removeFromWishlist: () => {},
        toggleWishlist: () => false,
        isInWishlist: () => false,
        clearWishlist: () => {},
        refreshWishlist: async () => {},
      };
    }
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}