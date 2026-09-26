/**
 * ODESSI.TFI — Wishlist utilities
 * 
 * Local wishlist persistence using localStorage
 * Designed to be replaced with API calls when backend is ready
 */

import type { WishlistItem, Product } from "@/types";

const WISHLIST_STORAGE_KEY = "odessi_wishlist";

/* ── Wishlist Operations ── */

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading wishlist from localStorage:", error);
    return [];
  }
}

export function saveWishlist(items: WishlistItem[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    // Dispatch custom event for wishlist updates
    window.dispatchEvent(new CustomEvent("wishlist-updated"));
  } catch (error) {
    console.error("Error saving wishlist to localStorage:", error);
  }
}

export function addToWishlist(product: Product): WishlistItem[] {
  const wishlist = getWishlist();
  
  // Check if product already exists in wishlist
  const exists = wishlist.some((item) => item?.product?.id === product.id);
  
  if (!exists) {
    wishlist.push({
      product,
      addedAt: new Date().toISOString(),
    });
    saveWishlist(wishlist);
  }
  
  return wishlist;
}

export function removeFromWishlist(productId: string): WishlistItem[] {
  const wishlist = getWishlist();
  const updatedWishlist = wishlist.filter((item) => item?.product?.id !== productId);
  saveWishlist(updatedWishlist);
  return updatedWishlist;
}

export function toggleWishlist(product: Product): { added: boolean; wishlist: WishlistItem[] } {
  const wishlist = getWishlist();
  const exists = wishlist.some((item) => item.product.id === product.id);
  
  if (exists) {
    const updated = removeFromWishlist(product.id);
    return { added: false, wishlist: updated };
  } else {
    const updated = addToWishlist(product);
    return { added: true, wishlist: updated };
  }
}

export function clearWishlist(): void {
  saveWishlist([]);
}

export function isInWishlist(productId: string): boolean {
  const wishlist = getWishlist();
  return wishlist.some((item) => item.product.id === productId);
}

export function getWishlistCount(): number {
  const wishlist = getWishlist();
  return wishlist.length;
}