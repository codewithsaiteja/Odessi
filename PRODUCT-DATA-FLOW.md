# Odessi.tfi — Product Data Flow Specification

## Architectural Overview

PostgreSQL and the Spring Boot REST API (`odessi-api`) serve as the **Single Source of Truth** for all catalog data across both the Admin Control Center and the Customer Storefront.

```
ADMIN CONTROL CENTER                    CUSTOMER STOREFRONT
[ Admin UI ]                           [ Customer UI ]
     │                                      │
     ▼                                      ▼
POST /api/admin/products                GET /api/products
PUT /api/admin/products/{id}            GET /api/products/{slug}
POST /api/admin/products/{id}/images    GET /api/categories/{slug}
     │                                      │
     └───────────────────┬──────────────────┘
                         ▼
               [ Spring Boot REST API ]
                         │
                         ▼
               [ PostgreSQL Database ]
               - products
               - product_variants
               - product_images
               - categories
               - collections
```

---

## Media Resolution Pipeline

1. **Upload / Storage**:
   - Admin uploads media file via `POST /api/admin/products/{id}/images`.
   - `LocalStorageServiceImpl` saves image to `uploads/products/prod-{timestamp}-{uuid}.jpg`.
   - `ProductImage` entity record created in PostgreSQL with `image_url = "/uploads/products/prod-...jpg"`.

2. **Backend Response Contract**:
   - `ProductResponse` contains `images: List<ProductImageResponse>` where each image contains `{ id, productId, imageUrl, altText, sortOrder, isPrimary }`.
   - `ProductSummaryResponse` contains `primaryImageUrl` and `images: List<String>`.

3. **Frontend Resolution (`getMediaUrl`)**:
   - Relative upload paths (`/uploads/...`) are prefixed with `NEXT_PUBLIC_API_URL` (`http://localhost:8080`).
   - Absolute URLs (`https://images.unsplash.com/...` or `blob:...`) are returned unchanged.
   - Legacy placeholder string IDs (`p1`, `p2`) resolve to a clean fallback asset.

---

## Storefront Synchronization & Active Status

- **Active State Rule**: Products where `active = true` are queryable via public customer endpoints (`GET /api/products`, `GET /api/products/{slug}`). Products where `active = false` (archived/draft) are strictly accessible to Admin users via `/api/admin/products`.
- **Freshness & Cache**: Next.js route components request live data from Spring Boot endpoints. Updates made by Admin in PostgreSQL become immediately visible on subsequent storefront requests.
