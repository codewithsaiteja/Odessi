-- ══════════════════════════════════════════════════════════════
-- V27 — Purge Invalid/Unrelated Stock Photos From SPIN_360
-- ══════════════════════════════════════════════════════════════

-- 1. Remove all fake/unrelated Unsplash stock images that were mistakenly inserted as SPIN_360
DELETE FROM product_images
WHERE media_type = 'SPIN_360'
  AND (
    image_url LIKE '%images.unsplash.com%'
    OR image_url LIKE '%plus.unsplash.com%'
  );

-- 2. If any legitimate primary product image was misclassified as SPIN_360, reset it to IMAGE
UPDATE product_images
SET media_type = 'IMAGE'
WHERE media_type = 'SPIN_360' AND is_primary = TRUE;

-- 3. Delete partial or broken SPIN_360 sets (< 4 frames) so no product has a fragmented 360 viewer
DELETE FROM product_images
WHERE id IN (
  SELECT pi.id
  FROM product_images pi
  JOIN (
    SELECT product_id, COUNT(*) AS frame_count
    FROM product_images
    WHERE media_type = 'SPIN_360'
    GROUP BY product_id
    HAVING COUNT(*) < 4
  ) sub ON pi.product_id = sub.product_id
  WHERE pi.media_type = 'SPIN_360'
);
