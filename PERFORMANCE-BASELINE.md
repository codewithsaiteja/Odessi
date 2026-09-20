# Odessi.tfi — Performance Baseline Measurement Report

**Date**: 2026-09-17  
**Environment**: Windows / Local Development & Production Build Simulation  
**Stack**: Next.js 16 (Turbopack) + Spring Boot 3 + PostgreSQL  

---

## 1. Initial Measurement Baseline

### Frontend Performance Baseline
- **Build Output**: 36 routes compiled (Static & Dynamic SSR).
- **Compilation Time**: 1.89s (Turbopack).
- **TypeScript Verification**: ~7.5s.
- **Client Bundle Footprint**:
  - Three.js / React Three Fiber embedded in components: ~650 KB gzipped.
  - Heavy Lucide Icon imports: ~140 KB gzipped.
  - Unused Client Component directives ("use client") across static sections: ~12 components.

### Initial Page Route Metrics
| Route | Type | Render Strategy | Key Dynamic Dependency | TTFB (Est.) | LCP (Target) |
|-------|------|-----------------|------------------------|-------------|--------------|
| `/` (Homepage) | Static/Hybrid | Client-side `useEffect` | Multiple parallel `useEffect` fetches | ~45ms | < 1.2s |
| `/shop` | Static | Client-side API fetch | Paginated Product List | ~50ms | < 1.4s |
| `/product/[slug]` | Dynamic (SSR) | Eager Variant & Media fetch | `getProductBySlugWithVariants` | ~65ms | < 1.5s |
| `/cart` | Static | Client Context | Auth Cart State | ~35ms | < 0.8s |
| `/checkout` | Static | Client Form | Checkout validation facade | ~40ms | < 1.0s |
| `/admin/products` | Static | Admin API | Admin products specification | ~55ms | < 1.2s |

### Backend / Database Baseline
- **Database Engine**: PostgreSQL 14+ / Spring Data JPA + HikariCP
- **Hikari Connection Pool**: `maximum-pool-size: 10`, `minimum-idle: 2`
- **Query Performance**:
  - `findBySlugWithVariants`: Eager LEFT JOIN FETCH (`0.002s`)
  - `findAllByActiveTrue`: Indexed query (`0.001s`)
- **Unit & Integration Suite**: 137 tests run, 137 passed in `25.09s`.

---

## 2. Identified Optimization Targets

1. **Homepage Parallel Client Fetches**:
   - `BestSellers.tsx`, `LimitedDropSection.tsx`, etc., each trigger separate `useEffect` calls upon client render.
   - **Fix**: Streamline and optimize data loading patterns, reducing cumulative client render cycles.

2. **Heavy 3D Canvas Bundle Splitting**:
   - `Hero3DCanvas.tsx` and `Product3DViewer.tsx` load `@react-three/fiber` and `@react-three/drei`.
   - **Fix**: Verify lazy dynamic imports with ssr disabled (`dynamic(() => import(...), { ssr: false })`) to prevent Three.js from blocking initial critical CSS/HTML paint.

3. **Product Media & Image Size Strategy**:
   - Ensure `next/image` attributes (`sizes`, `quality`, `loading`) serve responsive WebP/AVIF variants appropriate for card grids (25vw/33vw) vs full product gallery detail (100vw).

4. **Spring Boot Logging Overhead**:
   - Adjust `com.odessi.api: DEBUG` logging to `INFO` in application configuration for high-throughput production execution.

---

## 3. Next Steps

- Implement bundle optimization and lazy loading.
- Verify image delivery strategies across customer storefront.
- Re-run full automated test suites and production build measurements.
