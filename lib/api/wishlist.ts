/**
 * ODESSI.TFI — Wishlist API
 *
 * Maps to: /api/wishlist/**
 * Full-stack synchronized with Spring Boot & PostgreSQL
 */

import type { WishlistItem, Product, ProductCategory } from "@/types";
import { apiDelete, apiGet, apiPost } from "./client";
import { mapBackendSummaryToFrontend, BackendProductSummaryResponse } from "./products";

export interface BackendWishlistItemResponse {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  product?: BackendProductSummaryResponse;
  addedAt: string;
}

export interface BackendWishlistResponse {
  id: number;
  userId: number;
  items: BackendWishlistItemResponse[];
  itemCount: number;
  updatedAt?: string;
}

export function mapBackendWishlistItemToFrontend(item: BackendWishlistItemResponse): WishlistItem {
  const fallbackProduct: Product = {
    id: String(item.productId),
    name: item.productName || "Luxury Garment",
    slug: item.productSlug || `product-${item.productId}`,
    description: item.productName || "Odessi Luxury Collection",
    price: 0,
    currency: "INR",
    images: ["/placeholder-product.svg"],
    thumbnail: "/placeholder-product.svg",
    category: "tees" as ProductCategory,
    sizes: [],
    colors: [],
    variants: [],
    available: true,
    stockStatus: "in_stock",
    createdAt: item.addedAt || new Date().toISOString(),
  };

  const product = item.product ? mapBackendSummaryToFrontend(item.product) : fallbackProduct;

  return {
    product,
    addedAt: item.addedAt || new Date().toISOString(),
  };
}

export async function fetchUserWishlist(): Promise<WishlistItem[]> {
  try {
    const res = await apiGet<BackendWishlistResponse>("/api/wishlist");
    if (!res || !Array.isArray(res.items)) {
      return [];
    }
    return res.items.map(mapBackendWishlistItemToFrontend);
  } catch (err) {
    console.error("Failed to fetch backend wishlist:", err);
    throw err;
  }
}

// Backward compatibility helper
export async function getWishlist(): Promise<{
  data: { items: WishlistItem[]; itemCount: number };
  items: WishlistItem[];
  itemCount: number;
}> {
  const items = await fetchUserWishlist();
  return {
    data: { items, itemCount: items.length },
    items,
    itemCount: items.length,
  };
}

export async function addWishlistItem(productId: number): Promise<void> {
  await apiPost<BackendWishlistResponse>("/api/wishlist/items", { productId });
}

export async function removeWishlistItem(productId: number): Promise<void> {
  await apiDelete<BackendWishlistResponse>(`/api/wishlist/items/${productId}`);
}
