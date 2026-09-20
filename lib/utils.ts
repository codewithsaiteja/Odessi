/**
 * Utility helpers
 */

/** Merge class names (lightweight clsx alternative — no extra dependency) */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
