/**
 * ODESSI.TFI — Cart API
 *
 * Maps to: /api/cart/**
 *
 * Phase 3: userId passed explicitly (will be replaced by JWT in Phase 4).
 * Phase 4: Remove userId param — extract from JWT on the frontend.
 */

import type { ApiResponse, Cart } from "@/types";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

/** Phase 3 dev helper — attach user ID header. Remove in Phase 4. */
function userHeaders(userId: number): Record<string, string> {
  return { "X-User-Id": String(userId) };
}

export async function getCart(userId: number): Promise<ApiResponse<Cart>> {
  return apiGet<ApiResponse<Cart>>("/api/cart", {
    headers: userHeaders(userId),
  });
}

export async function addCartItem(
  userId: number,
  variantId: number,
  quantity: number
): Promise<ApiResponse<Cart>> {
  return apiPost<ApiResponse<Cart>>(
    "/api/cart/items",
    { variantId, quantity },
    { headers: userHeaders(userId) }
  );
}

export async function updateCartItem(
  userId: number,
  itemId: number,
  quantity: number
): Promise<ApiResponse<Cart>> {
  return apiPatch<ApiResponse<Cart>>(
    `/api/cart/items/${itemId}`,
    { quantity },
    { headers: userHeaders(userId) }
  );
}

export async function removeCartItem(
  userId: number,
  itemId: number
): Promise<ApiResponse<Cart>> {
  return apiDelete<ApiResponse<Cart>>(`/api/cart/items/${itemId}`, {
    headers: userHeaders(userId),
  });
}
