-- ══════════════════════════════════════════════════════════════
-- V15 — RESET LIVE CATALOG & SEED NEW GEN-Z ODESSI COLLECTION
--
-- 1. Archives existing products (active = false) to protect historical orders.
-- 2. Inserts 'ODESSI NEW GEN-Z ARCHIVE' collection.
-- 3. Inserts 10 real Gen-Z ODESSI products with variants and uploaded images.
-- ══════════════════════════════════════════════════════════════

-- Step 1: Soft-archive all existing old products
UPDATE products SET active = false WHERE active = true;

-- Step 2: Ensure collection 'ODESSI NEW GEN-Z ARCHIVE' exists
INSERT INTO collections (name, slug, description, hero_image, active, featured)
VALUES (
  'ODESSI NEW GEN-Z ARCHIVE',
  'odessi-new-genz-archive',
  'The new Gen-Z archive. Oversized silhouettes, heavyweight fabrics, cinematic energy, and signature ODESSI statement typography.',
  'https://images.unsplash.com/photo-1536922246289-88c42f957773?w=1200&q=85',
  TRUE,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET active = TRUE, featured = TRUE;

-- Step 3: Insert 10 New Gen-Z Products
-- Product 1: ODESSI CORE — OVERSIZED TEE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI CORE - OVERSIZED TEE', 'odessi-core-oversized-tee',
  'An oversized everyday essential built around the ODESSI identity. The clean front emblem is balanced by a signature back graphic carrying the brand''s "WEAR YOUR STORY." ethos. Cut in a boxy, modern Gen-Z fit with drop shoulders.',
  'Oversized identity tee with front emblem and back statement graphic.',
  899.00, 1199.00, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  'Heavyweight Cotton', 'Oversized Boxy',
  'Machine wash cold inside out; Tumble dry low; Do not iron print',
  TRUE, FALSE, TRUE, TRUE
);

-- Product 2: ODESSI ARCHIVE — GRAPHIC TEE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI ARCHIVE - GRAPHIC TEE', 'odessi-archive-graphic-tee',
  'Editorial archive-inspired graphic tee featuring bold typographic branding "ODESSI.TFI ARCHIVE / 001". Designed for a heavy streetwear drape and effortless layering.',
  'Editorial archive graphic tee with bold typographic layout.',
  999.00, 1299.00, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  'Heavyweight Cotton', 'Drop Shoulder Oversized',
  'Machine wash cold inside out; Line dry in shade',
  FALSE, TRUE, TRUE, TRUE
);

-- Product 3: ODESSI SIGNATURE — OVERSIZED TEE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI SIGNATURE - OVERSIZED TEE', 'odessi-signature-oversized-tee',
  'A minimalist statement piece featuring the prominent ODESSI wordmark alongside the signature emblem. Cut in an extended oversized silhouette for daily streetwear styling.',
  'Extended oversized tee featuring the signature ODESSI wordmark.',
  1099.00, 1399.00, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  'Heavyweight Cotton', 'Extended Oversized',
  'Machine wash cold; Do not bleach; Cool iron on reverse',
  TRUE, FALSE, FALSE, TRUE
);

-- Product 4: ODESSI HERO — OVERSIZED TEE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI HERO - OVERSIZED TEE', 'odessi-hero-oversized-tee',
  'Hero-inspired typography tee carrying the central brand statement "BECOME YOUR OWN HERO." across the upper back. High-impact monochrome graphic styling.',
  'Statement tee featuring "BECOME YOUR OWN HERO." back typography.',
  1099.00, 1499.00, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  'Heavyweight Cotton', 'Boxy Oversized',
  'Machine wash cold; Tumble dry low; Do not dry clean',
  FALSE, TRUE, FALSE, TRUE
);

-- Product 5: ODESSI EMBLEM — HEAVYWEIGHT TEE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI EMBLEM - HEAVYWEIGHT TEE', 'odessi-emblem-heavyweight-tee',
  'Heavyweight streetwear identity tee with a refined chest emblem and "EST. / STORY IN MOTION" back graphic. Structured silhouette engineered to maintain shape over time.',
  'Heavyweight identity tee with chest emblem and EST. back graphic.',
  1199.00, 1599.00, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  'Heavyweight Structured Cotton', 'Relaxed Boxy',
  'Machine wash cold inside out; Flat dry',
  FALSE, FALSE, TRUE, TRUE
);

-- Product 6: ODESSI CORE — OVERSIZED HOODIE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI CORE - OVERSIZED HOODIE', 'odessi-core-oversized-hoodie',
  'Minimal premium streetwear hoodie with double-layered hood, deep kangaroo pocket, and ribbed trim. Features front chest emblem and stacked "WEAR YOUR STORY." back artwork.',
  'Premium oversized hoodie with double hood and stacked statement print.',
  1699.00, 2199.00, 'INR',
  (SELECT id FROM categories WHERE slug='hoodies'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  'French Terry Cotton Fleece', 'Oversized Streetwear',
  'Machine wash cold with like colors; Tumble dry low',
  TRUE, TRUE, FALSE, TRUE
);

-- Product 7: ODESSI ARCHIVE — HEAVYWEIGHT HOODIE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI ARCHIVE - HEAVYWEIGHT HOODIE', 'odessi-archive-heavyweight-hoodie',
  'Cinematic archive hoodie displaying the hallmark "ODESSI.TFI ARCHIVE 001" typographic grid. Relaxed drop-shoulder cut with thick structured hood.',
  'Cinematic archive hoodie with drop shoulders and typographic grid.',
  1899.00, 2499.00, 'INR',
  (SELECT id FROM categories WHERE slug='hoodies'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  'French Terry Cotton Fleece', 'Drop-Shoulder Oversized',
  'Machine wash cold inside out; Do not iron decoration',
  TRUE, FALSE, TRUE, TRUE
);

-- Product 8: ODESSI HERO — STATEMENT HOODIE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI HERO - STATEMENT HOODIE', 'odessi-hero-statement-hoodie',
  'Bold statement hoodie carrying the signature hero narrative "BECOME YOUR OWN HERO." Reworked in a heavyweight silhouette with monochrome screen print.',
  'Bold statement hoodie carrying the signature "BECOME YOUR OWN HERO." text.',
  1999.00, 2599.00, 'INR',
  (SELECT id FROM categories WHERE slug='hoodies'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  'Heavyweight French Terry', 'Relaxed Oversized',
  'Machine wash cold; Line dry; Cool iron inside out',
  FALSE, TRUE, FALSE, TRUE
);

-- Product 9: ODESSI / 001 — SIGNATURE HOODIE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI / 001 - SIGNATURE HOODIE', 'odessi-001-signature-hoodie',
  'Limited numbered archive piece "001" embodying the core ODESSI design philosophy. Clean front chest logo with signature brand print.',
  'Numbered collection hoodie with clean front branding and signature back print.',
  1799.00, 2399.00, 'INR',
  (SELECT id FROM categories WHERE slug='hoodies'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  'Heavyweight French Terry', 'Streetwear Boxy',
  'Machine wash cold inside out; Do not bleach',
  FALSE, FALSE, TRUE, TRUE
);

-- Product 10: ODESSI DAILY — ESSENTIAL TEE
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency, category_id, collection_id, material, fit, care_instructions, featured, bestseller, new_arrival, active)
VALUES (
  'ODESSI DAILY - ESSENTIAL TEE', 'odessi-daily-essential-tee',
  'Everyday minimal essential tee. Features a subtle front emblem and clean back wordmark. Built for versatile daily rotation.',
  'Minimal essential tee with chest emblem and back wordmark.',
  799.00, 999.00, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='odessi-new-genz-archive'),
  '100% Cotton', 'Regular Fit',
  'Machine wash cold; Tumble dry low',
  FALSE, FALSE, FALSE, TRUE
);


-- ── Step 4: Insert Product Variants (S, M, L, XL, XXL per color) ──────

-- Product 1: ODESSI CORE — OVERSIZED TEE (Black & White)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-BLK-S',   'S',   'Black', '#121212', 899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-BLK-M',   'M',   'Black', '#121212', 899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-BLK-L',   'L',   'Black', '#121212', 899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-BLK-XL',  'XL',  'Black', '#121212', 899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-BLK-XXL', 'XXL', 'Black', '#121212', 899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-WHT-S',   'S',   'White', '#FFFFFF', 899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-WHT-M',   'M',   'White', '#FFFFFF', 899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-WHT-L',   'L',   'White', '#FFFFFF', 899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-WHT-XL',  'XL',  'White', '#FFFFFF', 899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'), 'OCT-WHT-XXL', 'XXL', 'White', '#FFFFFF', 899.00, 50, TRUE);

-- Product 2: ODESSI ARCHIVE — GRAPHIC TEE (Black & Off White)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-BLK-S',   'S',   'Black',     '#121212', 999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-BLK-M',   'M',   'Black',     '#121212', 999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-BLK-L',   'L',   'Black',     '#121212', 999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-BLK-XL',  'XL',  'Black',     '#121212', 999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-BLK-XXL', 'XXL', 'Black',     '#121212', 999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-OWH-S',   'S',   'Off White', '#F0EDE6', 999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-OWH-M',   'M',   'Off White', '#F0EDE6', 999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-OWH-L',   'L',   'Off White', '#F0EDE6', 999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-OWH-XL',  'XL',  'Off White', '#F0EDE6', 999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'), 'OAT-OWH-XXL', 'XXL', 'Off White', '#F0EDE6', 999.00, 50, TRUE);

-- Product 3: ODESSI SIGNATURE — OVERSIZED TEE (Black & Stone)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-BLK-S',   'S',   'Black', '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-BLK-M',   'M',   'Black', '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-BLK-L',   'L',   'Black', '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-BLK-XL',  'XL',  'Black', '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-BLK-XXL', 'XXL', 'Black', '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-STN-S',   'S',   'Stone', '#888177', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-STN-M',   'M',   'Stone', '#888177', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-STN-L',   'L',   'Stone', '#888177', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-STN-XL',  'XL',  'Stone', '#888177', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'), 'OST-STN-XXL', 'XXL', 'Stone', '#888177', 1099.00, 50, TRUE);

-- Product 4: ODESSI HERO — OVERSIZED TEE (Black & Charcoal)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-BLK-S',   'S',   'Black',    '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-BLK-M',   'M',   'Black',    '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-BLK-L',   'L',   'Black',    '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-BLK-XL',  'XL',  'Black',    '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-BLK-XXL', 'XXL', 'Black',    '#121212', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-CHR-S',   'S',   'Charcoal', '#2C2C2C', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-CHR-M',   'M',   'Charcoal', '#2C2C2C', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-CHR-L',   'L',   'Charcoal', '#2C2C2C', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-CHR-XL',  'XL',  'Charcoal', '#2C2C2C', 1099.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'), 'OHT-CHR-XXL', 'XXL', 'Charcoal', '#2C2C2C', 1099.00, 50, TRUE);

-- Product 5: ODESSI EMBLEM — HEAVYWEIGHT TEE (Black & Washed Grey)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-BLK-S',   'S',   'Black',       '#121212', 1199.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-BLK-M',   'M',   'Black',       '#121212', 1199.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-BLK-L',   'L',   'Black',       '#121212', 1199.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-BLK-XL',  'XL',  'Black',       '#121212', 1199.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-BLK-XXL', 'XXL', 'Black',       '#121212', 1199.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-WGR-S',   'S',   'Washed Grey', '#505050', 1199.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-WGR-M',   'M',   'Washed Grey', '#505050', 1199.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-WGR-L',   'L',   'Washed Grey', '#505050', 1199.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-WGR-XL',  'XL',  'Washed Grey', '#505050', 1199.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'), 'OET-WGR-XXL', 'XXL', 'Washed Grey', '#505050', 1199.00, 50, TRUE);

-- Product 6: ODESSI CORE — OVERSIZED HOODIE (Black, Charcoal, Cream)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-BLK-S',   'S',   'Black',    '#121212', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-BLK-M',   'M',   'Black',    '#121212', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-BLK-L',   'L',   'Black',    '#121212', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-BLK-XL',  'XL',  'Black',    '#121212', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-BLK-XXL', 'XXL', 'Black',    '#121212', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-CHR-S',   'S',   'Charcoal', '#2C2C2C', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-CHR-M',   'M',   'Charcoal', '#2C2C2C', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-CHR-L',   'L',   'Charcoal', '#2C2C2C', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-CRM-S',   'S',   'Cream',    '#EFE8DC', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-CRM-M',   'M',   'Cream',    '#EFE8DC', 1699.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'), 'OCH-CRM-L',   'L',   'Cream',    '#EFE8DC', 1699.00, 50, TRUE);

-- Product 7: ODESSI ARCHIVE — HEAVYWEIGHT HOODIE (Black & Washed Grey)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-BLK-S',   'S',   'Black',       '#121212', 1899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-BLK-M',   'M',   'Black',       '#121212', 1899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-BLK-L',   'L',   'Black',       '#121212', 1899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-BLK-XL',  'XL',  'Black',       '#121212', 1899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-BLK-XXL', 'XXL', 'Black',       '#121212', 1899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-WGR-S',   'S',   'Washed Grey', '#505050', 1899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-WGR-M',   'M',   'Washed Grey', '#505050', 1899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-WGR-L',   'L',   'Washed Grey', '#505050', 1899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-WGR-XL',  'XL',  'Washed Grey', '#505050', 1899.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), 'OAH-WGR-XXL', 'XXL', 'Washed Grey', '#505050', 1899.00, 50, TRUE);

-- Product 8: ODESSI HERO — STATEMENT HOODIE (Black & Cream)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-BLK-S',   'S',   'Black', '#121212', 1999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-BLK-M',   'M',   'Black', '#121212', 1999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-BLK-L',   'L',   'Black', '#121212', 1999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-BLK-XL',  'XL',  'Black', '#121212', 1999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-BLK-XXL', 'XXL', 'Black', '#121212', 1999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-CRM-S',   'S',   'Cream', '#EFE8DC', 1999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-CRM-M',   'M',   'Cream', '#EFE8DC', 1999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-CRM-L',   'L',   'Cream', '#EFE8DC', 1999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-CRM-XL',  'XL',  'Cream', '#EFE8DC', 1999.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'), 'OHH-CRM-XXL', 'XXL', 'Cream', '#EFE8DC', 1999.00, 50, TRUE);

-- Product 9: ODESSI / 001 — SIGNATURE HOODIE (Black & Stone)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-BLK-S',   'S',   'Black', '#121212', 1799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-BLK-M',   'M',   'Black', '#121212', 1799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-BLK-L',   'L',   'Black', '#121212', 1799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-BLK-XL',  'XL',  'Black', '#121212', 1799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-BLK-XXL', 'XXL', 'Black', '#121212', 1799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-STN-S',   'S',   'Stone', '#888177', 1799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-STN-M',   'M',   'Stone', '#888177', 1799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-STN-L',   'L',   'Stone', '#888177', 1799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-STN-XL',  'XL',  'Stone', '#888177', 1799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'), 'OSH-STN-XXL', 'XXL', 'Stone', '#888177', 1799.00, 50, TRUE);

-- Product 10: ODESSI DAILY — ESSENTIAL TEE (Black, White, Cream)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'), 'ODT-BLK-S',   'S',   'Black', '#121212', 799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'), 'ODT-BLK-M',   'M',   'Black', '#121212', 799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'), 'ODT-BLK-L',   'L',   'Black', '#121212', 799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'), 'ODT-WHT-S',   'S',   'White', '#FFFFFF', 799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'), 'ODT-WHT-M',   'M',   'White', '#FFFFFF', 799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'), 'ODT-WHT-L',   'L',   'White', '#FFFFFF', 799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'), 'ODT-CRM-S',   'S',   'Cream', '#EFE8DC', 799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'), 'ODT-CRM-M',   'M',   'Cream', '#EFE8DC', 799.00, 50, TRUE),
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'), 'ODT-CRM-L',   'L',   'Cream', '#EFE8DC', 799.00, 50, TRUE);


-- ── Step 5: Insert Product Images (Front & Back per product) ─────────

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type) VALUES
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'),       '/uploads/products/genz-prod-1-front.jpeg',  'ODESSI CORE — OVERSIZED TEE Front',  0, TRUE,  'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-core-oversized-tee'),       '/uploads/products/genz-prod-1-back.jpeg',   'ODESSI CORE — OVERSIZED TEE Back',   1, FALSE, 'IMAGE'),

((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'),      '/uploads/products/genz-prod-2-front.jpeg',  'ODESSI ARCHIVE — GRAPHIC TEE Front', 0, TRUE,  'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-archive-graphic-tee'),      '/uploads/products/genz-prod-2-back.jpeg',   'ODESSI ARCHIVE — GRAPHIC TEE Back',  1, FALSE, 'IMAGE'),

((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'),  '/uploads/products/genz-prod-3-front.jpeg',  'ODESSI SIGNATURE — OVERSIZED TEE Front', 0, TRUE, 'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-signature-oversized-tee'),  '/uploads/products/genz-prod-3-back.jpeg',   'ODESSI SIGNATURE — OVERSIZED TEE Back',  1, FALSE, 'IMAGE'),

((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'),       '/uploads/products/genz-prod-4-front.jpeg',  'ODESSI HERO — OVERSIZED TEE Front', 0, TRUE,  'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-hero-oversized-tee'),       '/uploads/products/genz-prod-4-back.jpeg',   'ODESSI HERO — OVERSIZED TEE Back',  1, FALSE, 'IMAGE'),

((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'),   '/uploads/products/genz-prod-5-front.jpeg',  'ODESSI EMBLEM — HEAVYWEIGHT TEE Front', 0, TRUE, 'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-emblem-heavyweight-tee'),   '/uploads/products/genz-prod-5-back.jpeg',   'ODESSI EMBLEM — HEAVYWEIGHT TEE Back',  1, FALSE, 'IMAGE'),

((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'),    '/uploads/products/genz-prod-6-front.jpeg',  'ODESSI CORE — OVERSIZED HOODIE Front', 0, TRUE, 'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-core-oversized-hoodie'),    '/uploads/products/genz-prod-6-back.jpeg',   'ODESSI CORE — OVERSIZED HOODIE Back',  1, FALSE, 'IMAGE'),

((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), '/uploads/products/genz-prod-7-front.jpeg', 'ODESSI ARCHIVE — HEAVYWEIGHT HOODIE Front', 0, TRUE, 'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-archive-heavyweight-hoodie'), '/uploads/products/genz-prod-7-back.jpeg',  'ODESSI ARCHIVE — HEAVYWEIGHT HOODIE Back',  1, FALSE, 'IMAGE'),

((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'),    '/uploads/products/genz-prod-8-front.jpeg',  'ODESSI HERO — STATEMENT HOODIE Front', 0, TRUE, 'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-hero-statement-hoodie'),    '/uploads/products/genz-prod-8-back.jpeg',   'ODESSI HERO — STATEMENT HOODIE Back',  1, FALSE, 'IMAGE'),

((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'),     '/uploads/products/genz-prod-9-front.jpeg',  'ODESSI / 001 — SIGNATURE HOODIE Front', 0, TRUE, 'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-001-signature-hoodie'),     '/uploads/products/genz-prod-9-back.jpeg',   'ODESSI / 001 — SIGNATURE HOODIE Back',  1, FALSE, 'IMAGE'),

((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'),      '/uploads/products/genz-prod-10-front.jpeg', 'ODESSI DAILY — ESSENTIAL TEE Front', 0, TRUE, 'IMAGE'),
((SELECT id FROM products WHERE slug='odessi-daily-essential-tee'),      '/uploads/products/genz-prod-10-back.jpeg',  'ODESSI DAILY — ESSENTIAL TEE Back',  1, FALSE, 'IMAGE');
