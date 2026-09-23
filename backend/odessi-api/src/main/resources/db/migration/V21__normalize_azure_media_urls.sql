-- ══════════════════════════════════════════════════════════════
-- V21 — Normalize Azure Blob Storage URLs to Canonical Media Gateway Paths
-- ══════════════════════════════════════════════════════════════
-- Rewrites full private Azure Blob URLs (with potential %2F slash encodings)
-- to canonical Spring Boot media gateway paths: /api/media/{category}/{filename}
-- Ensures Azure Storage account remains 100% private with no anonymous public access.

-- 1. Product Images
UPDATE product_images
SET image_url = REPLACE(REPLACE(image_url, 'https://odessimedia2026.blob.core.windows.net/media/', '/api/media/'), '%2F', '/')
WHERE image_url LIKE '%blob.core.windows.net/media/%';

UPDATE product_images
SET video_url = REPLACE(REPLACE(video_url, 'https://odessimedia2026.blob.core.windows.net/media/', '/api/media/'), '%2F', '/')
WHERE video_url IS NOT NULL AND video_url LIKE '%blob.core.windows.net/media/%';

UPDATE product_images
SET poster_url = REPLACE(REPLACE(poster_url, 'https://odessimedia2026.blob.core.windows.net/media/', '/api/media/'), '%2F', '/')
WHERE poster_url IS NOT NULL AND poster_url LIKE '%blob.core.windows.net/media/%';

-- 2. Social Posts
UPDATE social_posts
SET media_url = REPLACE(REPLACE(media_url, 'https://odessimedia2026.blob.core.windows.net/media/', '/api/media/'), '%2F', '/')
WHERE media_url LIKE '%blob.core.windows.net/media/%';
