# Odessi.tfi — Large-Scale Performance & Production Readiness Audit

## Overview

This audit document evaluates the Odessi.tfi codebase for large-scale production readiness under high traffic, catalog scale (1,000+ products, 100,000+ variants), and production deployment requirements.

Findings are categorized by severity:
- **P0**: Launch Blocker (data loss risk, security flaw, severe bottleneck under load)
- **P1**: Important (performance degradation, unoptimized bundle sizes, excessive re-renders)
- **P2**: Improvement (code quality, minor optimization, documentation)

---

## Audit Findings Matrix

### Finding 1: Ephemeral Filesystem Storage vs Production Object Storage (P0)
- **Exact File**: `backend/odessi-api/src/main/java/com/odessi/api/service/impl/LocalStorageServiceImpl.java`
- **Root Cause**: Product media is uploaded directly to container/host local directory (`uploads/products/`). In containerized deployments (Docker/K8s/AWS ECS/Render), container restarts wipe local files.
- **Impact**: Loss of uploaded product photography on production restarts or horizontal scaling.
- **Proposed Fix**: Retain `LocalStorageServiceImpl` for local development, and introduce a durable `S3StorageServiceImpl` / `CloudinaryStorageServiceImpl` implementing `MediaStorageService` for production profile. Document in `MEDIA-STORAGE-ARCHITECTURE.md`.
- **Risk**: Low (isolated behind interface abstraction).
- **Verification Method**: Re-upload image under prod profile settings and verify URL resolution to object storage/CDN.

---

### Finding 2: Production Environment Secrets & Configuration Separation (P0)
- **Exact File**: `backend/odessi-api/src/main/resources/application.yml` & `.env.production.example`
- **Root Cause**: Default JWT secrets and fallback credentials exist in fallback configuration files.
- **Impact**: Potential security vulnerability if deployed without strict environment variable overrides.
- **Proposed Fix**: Audit environment variable validation on boot; enforce mandatory `JWT_SECRET`, `DB_PASSWORD`, `RAZORPAY_KEY_SECRET` presence in production profile.
- **Risk**: Low.
- **Verification Method**: Attempt application start in `prod` profile without secrets; ensure startup aborts cleanly.

---

### Finding 3: Dynamic 3D WebGL Bundle Chunking (P1)
- **Exact File**: `components/sections/Hero.tsx`, `components/product/ProductGallery.tsx`, `components/3d/Hero3DCanvas.tsx`
- **Root Cause**: Three.js and `@react-three/fiber` components can bloat initial JS if rendered statically on initial page load.
- **Impact**: Increases LCP and TTFB if dynamic loading is removed or rendered server-side.
- **Proposed Fix**: Enforce `dynamic(() => import(...), { ssr: false })` across all WebGL components with static CSS/image fallback posters during loading.
- **Risk**: Low.
- **Verification Method**: Run `npm run build` and inspect chunk sizes for `Hero3DCanvas` and `Product3DViewer`.

---

### Finding 4: Database Connection Pool Sizing for High Concurrency (P1)
- **Exact File**: `backend/odessi-api/src/main/resources/application.yml`
- **Root Cause**: HikariCP connection pool is configured to `maximum-pool-size: 10` and `minimum-idle: 2`.
- **Impact**: Under high concurrent request spikes (>500 req/sec), connection acquisition timeouts (20,000ms) could occur if query latency increases.
- **Proposed Fix**: Keep pool size tuned to CPU core ratio (e.g. 15-20) with optimal `minimum-idle` and statement caching; ensure indexes prevent long table scans.
- **Risk**: Low.
- **Verification Method**: Run backend load test script with concurrent requests and monitor connection wait times.

---

### Finding 5: Image Sizing & Priority Loading on Card Grids (P1)
- **Exact File**: `components/product/ProductCard.tsx`, `components/sections/LimitedDropSection.tsx`
- **Root Cause**: Oversized product imagery without explicit `sizes` attribute fetches full-res imagery inside card grids.
- **Impact**: Increased transferred bytes on mobile networks.
- **Proposed Fix**: Pass responsive `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"` and set `loading="lazy"` on product card thumbnails.
- **Risk**: Low.
- **Verification Method**: Audit network tab byte transfers on `/shop` grid.

---

### Finding 6: PostgreSQL Database Indexing Coverage (P2)
- **Exact File**: `backend/odessi-api/src/main/resources/db/migration/V2__create_products.sql`, `V12__create_product_images.sql`
- **Root Cause**: Foreign keys and status flags (`active = true`, `featured`, `bestseller`, `new_arrival`) are indexed with partial indexes.
- **Impact**: Excellent index coverage already exists; needs continuous monitoring under high row counts (100k+ rows).
- **Proposed Fix**: Verify query execution plans using `EXPLAIN ANALYZE` for multi-filter search queries.
- **Risk**: Low.
- **Verification Method**: Run EXPLAIN ANALYZE on catalog filter queries.
