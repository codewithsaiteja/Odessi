import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    dangerouslyAllowSVG: true,
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      // Product images served from Unsplash (confirmed in use)
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
      // Local Spring Boot backend uploaded media
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
      // Production Spring Boot backend uploaded media (Render)
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
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90],
  },

  /**
   * Security headers — Phase 8 Production Hardening.
   *
   * Applied to all routes via the `source: "/(.*)"` matcher.
   * These headers complement the backend Spring Security headers for the
   * Next.js-served pages (HTML, static assets, API routes if any).
   *
   * Note: Content-Security-Policy (CSP) for Next.js pages is best configured
   * server-side in the Spring Boot API response for API calls. For Next.js HTML
   * pages, it is set here via next.config headers (applies to SSR/SSG pages).
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
          // Prevent clickjacking — deny all frame embedding of Next.js pages
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Referrer policy: send origin on same-site, no referrer on cross-origin
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
          // level (e.g., Nginx, Vercel) for production. Setting it here would
          // break local HTTP development.
        ],
      },
    ];
  },
};

export default nextConfig;
