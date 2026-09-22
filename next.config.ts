import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      // ─── Unsplash (product/social/collection seed images) ─────────────────
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        pathname: "/**",
      },
      // ─── Azure Blob Storage (persistent production media) ─────────────────
      // All *.blob.core.windows.net hostnames are included to avoid hard-coding
      // the storage account name, which is an infrastructure detail.
      // Tighten to a specific account hostname once the account name is finalised.
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
        pathname: "/**",
      },
      // ─── Render production backend (/uploads/** served by Spring Boot) ─────
      {
        protocol: "https",
        hostname: "odessi-backend.onrender.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.onrender.com",
        pathname: "/**",
      },
      // ─── Local development backend ─────────────────────────────────────────
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90],
  },

  /**
   * API rewrites — proxies /api/* calls to the Spring Boot backend.
   *
   * In production on Vercel, NEXT_PUBLIC_API_URL is set to the Render backend URL.
   * The rewrite ensures that any server-side API calls made without the env var
   * (unlikely but defensive) still resolve correctly for local development.
   */
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  /**
   * Security headers — Production Hardening.
   *
   * Applied to all routes. These headers complement the Spring Security
   * headers set on API responses.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Referrer policy: origin on same-site, no referrer cross-origin
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Disable sensitive browser APIs not used by the application
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Note: Strict-Transport-Security (HSTS) is intentionally omitted here.
          // It must only be set over HTTPS and is configured at the CDN/reverse proxy
          // level (Vercel) for production. Setting it here would break local HTTP dev.
        ],
      },
    ];
  },
};

export default nextConfig;
