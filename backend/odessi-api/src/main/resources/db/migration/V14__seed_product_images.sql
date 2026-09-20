-- ══════════════════════════════════════════════════════════════
-- V14 — Seed Product Images
-- Populates primary product images for initial seed catalog products
-- ══════════════════════════════════════════════════════════════

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT id, 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&q=85', 'Shadow Striker Tee Front', 0, TRUE, 'IMAGE'
FROM products WHERE slug = 'shadow-striker-tee'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = products.id);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT id, 'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800&q=85', 'Shadow Striker Tee Back', 1, FALSE, 'IMAGE'
FROM products WHERE slug = 'shadow-striker-tee'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = products.id AND image_url LIKE '%1574180566232%');

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT id, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=85', 'Mythic Hoodie Front', 0, TRUE, 'IMAGE'
FROM products WHERE slug = 'mythic-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = products.id);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT id, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=85', 'Cinematic Oversized Tee Front', 0, TRUE, 'IMAGE'
FROM products WHERE slug = 'cinematic-oversized-tee'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = products.id);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT id, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=85', 'Rogue Arc Heavyweight Tee Front', 0, TRUE, 'IMAGE'
FROM products WHERE slug = 'rogue-arc-heavyweight-tee'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = products.id);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT id, 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&q=85', 'Dark Verse Hoodie Front', 0, TRUE, 'IMAGE'
FROM products WHERE slug = 'dark-verse-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = products.id);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT id, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=85', 'Karma Tee Vol. II Front', 0, TRUE, 'IMAGE'
FROM products WHERE slug = 'karma-tee-vol-2'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = products.id);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT id, 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=85', 'Custom Hero Tee Front', 0, TRUE, 'IMAGE'
FROM products WHERE slug = 'custom-hero-tee'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = products.id);
