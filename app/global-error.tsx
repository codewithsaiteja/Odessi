"use client";

/**
 * Global Error Boundary — Root Level
 *
 * Next.js App Router requires a `global-error.tsx` in the app/ directory to
 * catch errors that occur in the root `layout.tsx` (where `error.tsx` cannot
 * reach). This component replaces the root layout on error, so it must include
 * <html> and <body> tags.
 *
 * Sentry wraps this component to ensure client-side error events are captured
 * and associated with the correct Sentry session and user context.
 *
 * This does NOT affect authentication, the Spring Boot backend, or any API.
 */
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Report the error to Sentry before rendering the fallback UI
  Sentry.captureException(error);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#999", margin: 0, maxWidth: 400 }}>
          We&apos;ve been notified and are looking into it. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.5rem",
            background: "#fff",
            color: "#0a0a0a",
            border: "none",
            borderRadius: "0.375rem",
            fontWeight: 500,
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>

        {/* Next.js error component renders HTTP status if available */}
        <div style={{ display: "none" }}>
          <NextError statusCode={0} />
        </div>
      </body>
    </html>
  );
}
