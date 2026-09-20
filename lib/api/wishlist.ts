/**
 * ODESSI.TFI — Wishlist API
 *
 * Maps to: /api/wishlist/**
 *
 * Phase 3: userId passed explicitly.
 * Phase 4: Replace with JWT extraction.
 */

import type { ApiResponse, WishlistItem } from "@/types";
import { apiDelete, apiGet, apiPost } from "./client";

export interface WishlistResponseData {
  id: number;
  userId: number;
  items: WishlistItem[];
  itemCount: number;
}

export async function getWishlist(
  userId?: number
): Promise<ApiResponse<WishlistResponseData>> {
  const headers = userId ? { "X-User-Id": String(userId) } : undefined;
  return apiGet<ApiResponse<WishlistResponseData>>("/api/wishlist", { headers });
}

export async function addWishlistItem(
  productId: number,
  userId?: number
): Promise<ApiResponse<WishlistResponseData>> {
  const headers = userId ? { "X-User-Id": String(userId) } : undefined;
  return apiPost<ApiResponse<WishlistResponseData>>(
    "/api/wishlist/items",
    { productId },
    { headers }
  );
}

export async function removeWishlistItem(
  productId: number,
  userId?: number
): Promise<ApiResponse<WishlistResponseData>> {
  const headers = userId ? { "X-User-Id": String(userId) } : undefined;
  return apiDelete<ApiResponse<WishlistResponseData>>(
    `/api/wishlist/items/${productId}`,
    { headers }
  );
}
