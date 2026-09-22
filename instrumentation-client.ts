/**
 * Sentry — Client-side initialization (browser).
 *
 * This file is the Next.js App Router instrumentation entry point for the
 * browser runtime. It is automatically loaded by Next.js 15+ via the
 * instrumentation hook for the client runtime.
 *
 * DSN is safe to be public — it is scoped to error ingestion only.
 * No secrets belong here.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Odessi production environment
  environment: process.env.NODE_ENV,

  // ── Error capture ─────────────────────────────────────────────────────────
  // Capture 100% of errors in production. Adjust if event volume is high.
  sampleRate: 1.0,

  // ── Performance tracing ───────────────────────────────────────────────────
  // Capture 10% of page loads as performance traces to limit quota usage.
  // Increase to 1.0 during debugging, then reduce for steady-state production.
  tracesSampleRate: 0.1,

  // ── Session Replay ────────────────────────────────────────────────────────
  // Record 10% of normal sessions and 100% of sessions that encounter an error.
  // PII is masked by default (text, inputs, etc.).
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text content and block all media by default
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Only send events in production — silence during local development to avoid
  // noise. Remove this check if you also want to see local errors in Sentry.
  enabled: process.env.NODE_ENV === "production",

  // ── Privacy ───────────────────────────────────────────────────────────────
  // Do not send raw user IP addresses to Sentry.
  sendDefaultPii: false,

  // ── Debug ─────────────────────────────────────────────────────────────────
  debug: false,
});

/**
 * Required by @sentry/nextjs v10 for capturing client-side navigation traces.
 * Without this, page transitions (Link clicks, router.push) are not traced.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#instrumentation-client
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
