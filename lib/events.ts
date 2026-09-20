/**
 * ODESSI.TFI — Global Events
 * 
 * Central place to define and emit custom events to avoid circular dependencies
 * between contexts (like AuthContext and CartContext).
 */

export const EVENTS = {
  CART_MERGED: "cart-merged",
  AUTH_LOGOUT: "auth-logout",
  AUTH_SUCCESS: "auth-success",
} as const;

export function emitEvent(eventName: string, detail?: unknown) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }
}
