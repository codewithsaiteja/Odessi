# Odessi.tfi — Media Storage Architecture Document

## Overview

Odessi.tfi implements a clean media abstraction interface (`MediaStorageService`) within the Spring Boot backend (`odessi-api`). This abstraction separates the application logic from the underlying storage mechanism, allowing seamless transitioning between local filesystem storage during development and persistent cloud object storage or CDN delivery in production environments.

---

## Architecture Diagram

```
[ Admin UI / Browser ]
         │
         ▼ (Multipart File Upload)
[ AdminProductController ]
         │
         ▼
[ AdminServiceImpl ] ───> [ MediaStorageService Interface ]
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    [ Development Strategy ]                [ Production Strategy ]
    LocalStorageServiceImpl                 S3StorageServiceImpl / Cloudinary / CDN
    - Local disk: uploads/products/         - Durable Object Storage (AWS S3 / GCP)
    - URL path: /uploads/products/...       - Global CDN Edge caching (Cloudflare)
    - Static handler: WebMvcConfig          - Direct CDN URL stored in PostgreSQL
               │                                       │
               └───────────────────┬───────────────────┘
                                   ▼
                       [ PostgreSQL Database ]
                       Table: product_images
                       - image_url: VARCHAR(500)
```

---

## Storage Environments

### 1. Development Environment (Current)
- **Service Implementation**: `LocalStorageServiceImpl.java`
- **Physical Path**: Relative directory `uploads/products/` on the application host.
- **Served Via**: Spring Boot `WebMvcConfig` resource handler mapping `/uploads/**` to `file:///.../uploads/`.
- **Media URL Format**: Relative URL path `/uploads/products/prod-{timestamp}-{uuid}.jpg`.
- **Frontend Resolution**: Resolved via `getMediaUrl()` in `lib/product-utils.ts` to `http://localhost:8080/uploads/products/prod-...jpg`.

### 2. Production Environment (Architectural Target)
- **Service Implementation**: `S3StorageServiceImpl` / `CloudinaryMediaStorageServiceImpl` implementing `MediaStorageService`.
- **Physical Path**: Cloud Object Bucket (AWS S3, GCP Cloud Storage) or Cloudinary asset folder.
- **Served Via**: CloudFront / Cloudflare Edge CDN.
- **Media URL Format**: Absolute HTTPS CDN URL `https://cdn.odessi.shop/products/prod-{uuid}.webp`.
- **Persistence Guarantee**: Container restarts or ephemeral deployments do NOT lose uploaded product photography.

---

## Database Schema & Contract

- **Table**: `product_images`
  - `id`: BIGSERIAL PRIMARY KEY
  - `product_id`: BIGINT (FK -> products.id)
  - `image_url`: VARCHAR(500) NOT NULL
  - `alt_text`: VARCHAR(255)
  - `sort_order`: INT NOT NULL DEFAULT 0
  - `is_primary`: BOOLEAN NOT NULL DEFAULT FALSE
  - `media_type`: VARCHAR(20) DEFAULT 'IMAGE'

---

## Migration Path to Cloud Storage

To transition from development filesystem storage to cloud object storage:
1. Create a class implementing `MediaStorageService` (e.g. `S3StorageServiceImpl`).
2. Annotate with `@Service` and `@Profile("prod")` while retaining `@Profile("dev")` on `LocalStorageServiceImpl`.
3. No changes are required in `AdminServiceImpl`, `ProductMapper`, controllers, or frontend React components because `image_url` remains a standard URL string in the response contract.
