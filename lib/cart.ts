/**
 * ODESSI.TFI — Cart utilities and state management
 * 
 * Local cart persistence using localStorage
 * Designed to be replaced with API calls when backend is ready
 */

import type { CartItem, Product } from "@/types";

// Guest cart localStorage functions have been removed to enforce authentication.

/* ── Cart Calculations ── */

export function getCartItemCount(cart: CartItem[]): number {
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((total, item) => total + (item?.quantity || 0), 0);
}

export function getCartSubtotal(cart: CartItem[]): number {
  if (!Array.isArray(cart)) return 0;
  return cart.reduce(
    (total, item) => total + ((item?.product?.price ?? 0) * (item?.quantity ?? 1)),
    0
  );
}

export function getCartTotal(cart: CartItem[], shippingCost: number = 0): number {
  return getCartSubtotal(cart) + shippingCost;
}

export function calculateShipping(subtotal: number): number {
  // Free shipping above ₹999
  const freeShippingThreshold = 999;
  const baseShippingCost = 99;

  return subtotal >= freeShippingThreshold ? 0 : baseShippingCost;
}

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/* ── Cart Validation ── */

export function isProductInCart(
  cart: CartItem[],
  productId: string,
  size?: string,
  colorName?: string
): boolean {
  if (!Array.isArray(cart)) return false;
  return cart.some((item) => {
    const matchesProduct = item?.product?.id === productId;
    const matchesSize = !size || item?.selectedSize === size;
    const matchesColor = !colorName || item?.selectedColor?.name === colorName;
    return matchesProduct && matchesSize && matchesColor;
  });
}

export function getCartItem(
  cart: CartItem[],
  productId: string,
  size: string,
  colorName: string
): CartItem | undefined {
  if (!Array.isArray(cart)) return undefined;
  return cart.find(
    (item) =>
      item?.product?.id === productId &&
      item?.selectedSize === size &&
      item?.selectedColor?.name === colorName
  );
}

export function getVariantId(
  product: Product,
  size: string,
  colorName: string
): string | undefined {
  if (!product.variants || product.variants.length === 0) return undefined;
  
  const normSize = (size || "").trim().toUpperCase();
  const normColor = (colorName || "").trim().toLowerCase();

  const variant = product.variants.find(
    (v) =>
      v.size.trim().toUpperCase() === normSize &&
      v.color.name.trim().toLowerCase() === normColor
  );

  if (variant) return variant.id;

  // Fallback: match by size if color string differs slightly
  const fallbackVariant = product.variants.find(
    (v) => v.size.trim().toUpperCase() === normSize
  );

  return fallbackVariant?.id || product.variants[0]?.id;
}