/**
 * Sentry — Server & Edge runtime initialization.
 *
 * Next.js App Router calls `register()` once on startup for each runtime:
 *   - Node.js server  (standard SSR, API routes, Server Actions)
 *   - Edge runtime    (Middleware, Edge API routes)
 *
 * `onRequestError` is called for every unhandled server-side error so Sentry
 * can capture it even if the error occurs before it reaches an error boundary.
 *
 * IMPORTANT: This file must export both `register` and `onRequestError` to
 * satisfy the Next.js Instrumentation API contract.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // ── Node.js server runtime ──────────────────────────────────────────────
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,

      // Capture 100% of server-side errors
      sampleRate: 1.0,

      // 10% of server-side traces (API calls, SSR, Server Actions)
      tracesSampleRate: 0.1,

      // Only active in production
      enabled: process.env.NODE_ENV === "production",

      // Do not include raw user data in error reports
      sendDefaultPii: false,

      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // ── Edge runtime ────────────────────────────────────────────────────────
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === "production",
      sendDefaultPii: false,
      debug: false,
    });
  }
}

/**
 * Called by Next.js for every unhandled server-side request error.
 * Ensures Sentry captures errors that do not propagate through error.tsx
 * (e.g. errors in layout.tsx, middleware, or Server Actions).
 */
export const onRequestError = Sentry.captureRequestError;
