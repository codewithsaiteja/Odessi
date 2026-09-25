/**
 * Odessi Global Navigation Helper
 * Provides intelligent, history-aware back navigation with safe fallbacks.
 */

/**
 * Determine if a safe, same-origin history predecessor exists in the current session.
 * In Next.js App Router:
 * - `window.history.state?.idx > 0` indicates prior in-app transitions in the current browser tab.
 * - `document.referrer` starting with `window.location.origin` confirms arrival from another page on this domain.
 */
export function hasSameSiteHistory(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // 1. Check Next.js App Router internal navigation index on history.state
    const historyState = window.history.state;
    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      return true;
    }

    // 2. Check same-origin referrer
    if (typeof document !== "undefined" && document.referrer) {
      const origin = window.location.origin;
      if (document.referrer.startsWith(origin) && document.referrer !== window.location.href) {
        return true;
      }
    }

    // 3. Fallback check for session navigation count
    if (window.history.length > 2 && document.referrer && document.referrer.startsWith(window.location.origin)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Navigate to the previous page if a legitimate same-origin history exists,
 * or safely route to the designated fallback URL.
 */
export function goBackOrFallback(
  router: { back: () => void; push: (url: string) => void },
  fallback: string = "/shop"
): void {
  if (hasSameSiteHistory()) {
    router.back();
  } else {
    router.push(fallback);
  }
}
