/**
 * Open Redirect Validator — Phase 8 Security Hardening
 *
 * Validates that a URL is a safe internal relative path before using it in redirects.
 * Prevents open redirect vulnerabilities where an attacker supplies an external URL
 * (e.g., `?redirect=https://evil.com`) that gets redirected to after login.
 *
 * @module lib/utils/redirect
 */

/**
 * Returns `true` if `url` is a safe internal relative path.
 *
 * Rules:
 * - Must start with `/` (relative path)
 * - Must NOT start with `//` (protocol-relative — treated as absolute by browsers)
 * - Must NOT contain `http://` or `https://` scheme
 * - Must NOT start with `javascript:`, `data:`, `vbscript:`, or any scheme containing `:`
 *   in the first path segment
 * - Must NOT contain backslashes (browser normalisation bypass: `\/evil.com`)
 * - Must NOT contain control characters or embedded newlines (header injection)
 * - Must NOT contain `@` in the first 10 characters (browser `user@host` bypass)
 */
export function isSafeRedirectPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;

  const trimmed = url.trim();

  // Must start with a single slash
  if (!trimmed.startsWith("/")) return false;

  // Reject protocol-relative URLs: //evil.com
  if (trimmed.startsWith("//")) return false;

  // Reject any scheme (absolute URLs sneak in via URL-encoding or case)
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("javascript:") ||
    lower.includes("data:") ||
    lower.includes("vbscript:") ||
    lower.includes("http:") ||
    lower.includes("https:")
  ) {
    return false;
  }

  // Reject backslash — browsers can interpret `\/evil.com` as `//evil.com`
  if (trimmed.includes("\\")) return false;

  // Reject control characters and embedded newlines (CRLF injection)
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return false;

  // Reject `@` in early position — e.g., `/@evil.com` parsed as `user@host`
  const afterSlash = trimmed.slice(1);
  if (afterSlash.startsWith("@")) return false;

  return true;
}

/**
 * Returns the URL if it is a safe internal redirect path, otherwise returns the fallback.
 *
 * @param url      The candidate redirect URL (e.g., from query string).
 * @param fallback A known-safe fallback path (defaults to `/`).
 */
export function safeRedirect(
  url: string | null | undefined,
  fallback: string = "/"
): string {
  return isSafeRedirectPath(url) ? (url as string) : fallback;
}
