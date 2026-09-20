-- ══════════════════════════════════════════════════════════════
-- V6 — Development seed data
--
-- ⚠️  DEVELOPMENT ONLY — This is placeholder data for local development.
-- These are NOT confirmed real Odessi.tfi products.
-- Replace product details, images, and pricing with actual
-- Odessi.tfi product information before production deployment.
-- ══════════════════════════════════════════════════════════════

-- ── Categories ────────────────────────────────────────────────
INSERT INTO categories (name, slug, description, image, active) VALUES
('Tees',       'tees',      'Premium heavyweight tees. Graphic, typographic and minimal — all built on quality cotton that holds its shape.',
 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&q=85', TRUE),
('Hoodies',    'hoodies',   'French Terry and fleece hoodies. Structured silhouettes, heavy weight, cinematic energy.',
 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&q=85', TRUE),
('New Drops',  'new-drops', 'Latest releases. Limited quantities. Move fast.',
 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=900&q=85', TRUE),
('Custom',     'custom',    'Your hero. Your story. Fully personalized print on our premium base pieces.',
 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=900&q=85', TRUE);

-- ── Collections ───────────────────────────────────────────────
INSERT INTO collections (name, slug, description, hero_image, active, featured) VALUES
('Dark Verse',      'dark-verse',      'Our defining collection. Dark Verse draws from the mythology of anti-heroes — characters who carry the weight of consequence. Heavyweight pieces in deep monochromes.',
 'https://images.unsplash.com/photo-1536922246289-88c42f957773?w=1200&q=85', TRUE, TRUE),
('Monochrome Edit', 'monochrome-edit', 'Clean. Restrained. Precise. The Monochrome Edit strips everything back to form and print. Pure cotton canvases for bold typographic and graphic work.',
 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85', TRUE, TRUE),
('Rogue Arc',       'rogue-arc',       'Illustration-led pieces tracing the hero''s journey through Indian cinema and mythology. Each piece tells a chapter.',
 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85', TRUE, TRUE),
('Custom Studio',   'custom-studio',   'Fully personalized pieces. Bring your hero, your story, your vision. We bring the premium build and print quality.',
 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=85', TRUE, FALSE);

-- ── Products ──────────────────────────────────────────────────
-- Note: category_id and collection_id reference the rows just inserted above (1-4 / 1-4)

INSERT INTO products (name, slug, description, short_description, price, compare_at_price, currency,
                      category_id, collection_id, material, fit,
                      care_instructions, featured, bestseller, new_arrival, active)
VALUES
(
  'Shadow Striker Tee', 'shadow-striker-tee',
  'Heavyweight 240 GSM pure cotton tee. Oversized silhouette with a bold chest graphic inspired by the anti-hero archetype. Washed charcoal with off-white detail print.',
  'Heavyweight 240 GSM pure cotton tee with bold chest graphic.',
  899.00, 1299.00, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='dark-verse'),
  '100% Premium Cotton', 'Oversized',
  'Machine wash cold; Tumble dry low; Do not bleach',
  TRUE, TRUE, FALSE, TRUE
),
(
  'The Mythic Hoodie', 'mythic-hoodie',
  '450 GSM French Terry premium hoodie. Kangaroo pocket, ribbed cuffs and hem. Large back print — a cinematic landscape in monochrome.',
  '450 GSM French Terry premium hoodie with large back print.',
  1799.00, 2499.00, 'INR',
  (SELECT id FROM categories WHERE slug='hoodies'),
  (SELECT id FROM collections WHERE slug='dark-verse'),
  '100% French Terry Cotton', 'Regular',
  'Machine wash cold; Tumble dry low; Do not iron print',
  TRUE, TRUE, FALSE, TRUE
),
(
  'Cinematic Oversized Tee', 'cinematic-oversized-tee',
  'Boxy-fit 220 GSM tee with minimal typographic print. The Odessi wordmark across the chest in weathered block lettering.',
  'Boxy-fit 220 GSM tee with minimal typographic print.',
  799.00, NULL, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='monochrome-edit'),
  '100% Cotton', 'Boxy',
  'Machine wash cold; Tumble dry low; Do not bleach',
  FALSE, TRUE, FALSE, TRUE
),
(
  'Rogue Arc Heavyweight Tee', 'rogue-arc-heavyweight-tee',
  'Premium 260 GSM drop-shoulder tee. Illustration-based front graphic referencing the hero''s journey — rendered in a dark editorial palette.',
  'Premium 260 GSM drop-shoulder tee with illustration graphic.',
  999.00, 1399.00, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='dark-verse'),
  '100% Premium Cotton', 'Drop-shoulder',
  'Machine wash cold; Tumble dry low; Do not iron print',
  FALSE, TRUE, FALSE, TRUE
),
(
  'The Dark Verse Hoodie', 'dark-verse-hoodie',
  'The centrepiece of our Dark Verse drop. Double-layered hood, raglan sleeves, contrast stitch detail. Inspired by the anti-hero archetype across Indian cinema.',
  'Double-layered hood with raglan sleeves and contrast stitching.',
  2099.00, NULL, 'INR',
  (SELECT id FROM categories WHERE slug='hoodies'),
  (SELECT id FROM collections WHERE slug='dark-verse'),
  '100% French Terry Cotton', 'Regular',
  'Machine wash cold; Tumble dry low; Do not iron print',
  TRUE, FALSE, TRUE, TRUE
),
(
  'Karma Tee Vol. II', 'karma-tee-vol-2',
  'Second edition of our bestselling Karma Tee. Updated artwork, same heavyweight 240 GSM build. Front and back print.',
  'Second edition with updated artwork, front and back print.',
  949.00, 1199.00, 'INR',
  (SELECT id FROM categories WHERE slug='tees'),
  (SELECT id FROM collections WHERE slug='monochrome-edit'),
  '100% Premium Cotton', 'Regular',
  'Machine wash cold; Tumble dry low; Do not bleach',
  FALSE, FALSE, TRUE, TRUE
),
(
  'Custom Hero Tee', 'custom-hero-tee',
  'Design your own Odessi piece. Choose your hero, pick your palette, select your fit. Each custom tee is printed on demand on our premium 240 GSM base.',
  'Design your own Odessi piece with custom print.',
  1299.00, NULL, 'INR',
  (SELECT id FROM categories WHERE slug='custom'),
  NULL,
  '100% Premium Cotton', 'Regular',
  'Machine wash cold; Tumble dry low; Do not bleach',
  FALSE, FALSE, FALSE, TRUE
);

-- ── Product Variants ──────────────────────────────────────────
-- Shadow Striker Tee — Washed Black
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-WB-XS',  'XS',  'Washed Black', '#1a1a1a', 899.00, 10, TRUE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-WB-S',   'S',   'Washed Black', '#1a1a1a', 899.00, 15, TRUE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-WB-M',   'M',   'Washed Black', '#1a1a1a', 899.00, 20, TRUE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-WB-L',   'L',   'Washed Black', '#1a1a1a', 899.00, 18, TRUE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-WB-XL',  'XL',  'Washed Black', '#1a1a1a', 899.00, 12, TRUE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-WB-XXL', 'XXL', 'Washed Black', '#1a1a1a', 899.00, 0,  FALSE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-GR-XS',  'XS',  'Graphite',     '#3a3a3a', 899.00, 8,  TRUE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-GR-S',   'S',   'Graphite',     '#3a3a3a', 899.00, 12, TRUE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-GR-M',   'M',   'Graphite',     '#3a3a3a', 899.00, 16, TRUE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-GR-L',   'L',   'Graphite',     '#3a3a3a', 899.00, 14, TRUE),
((SELECT id FROM products WHERE slug='shadow-striker-tee'), 'SST-GR-XL',  'XL',  'Graphite',     '#3a3a3a', 899.00, 10, TRUE);

-- The Mythic Hoodie — Onyx
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-ON-S',   'S',   'Onyx',      '#0d0d0d', 1799.00, 8,  TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-ON-M',   'M',   'Onyx',      '#0d0d0d', 1799.00, 12, TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-ON-L',   'L',   'Onyx',      '#0d0d0d', 1799.00, 10, TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-ON-XL',  'XL',  'Onyx',      '#0d0d0d', 1799.00, 8,  TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-ON-XXL', 'XXL', 'Onyx',      '#0d0d0d', 1799.00, 6,  TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-CH-S',   'S',   'Charcoal',  '#2c2c2c', 1799.00, 8,  TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-CH-M',   'M',   'Charcoal',  '#2c2c2c', 1799.00, 10, TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-CH-L',   'L',   'Charcoal',  '#2c2c2c', 1799.00, 9,  TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-OW-S',   'S',   'Off-White', '#f5f3f0', 1799.00, 6,  TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-OW-M',   'M',   'Off-White', '#f5f3f0', 1799.00, 8,  TRUE),
((SELECT id FROM products WHERE slug='mythic-hoodie'), 'MH-OW-L',   'L',   'Off-White', '#f5f3f0', 1799.00, 7,  TRUE);

-- Cinematic Oversized Tee
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='cinematic-oversized-tee'), 'COT-CW-S',   'S',   'Chalk White',   '#f0ede8', 799.00, 15, TRUE),
((SELECT id FROM products WHERE slug='cinematic-oversized-tee'), 'COT-CW-M',   'M',   'Chalk White',   '#f0ede8', 799.00, 20, TRUE),
((SELECT id FROM products WHERE slug='cinematic-oversized-tee'), 'COT-CW-L',   'L',   'Chalk White',   '#f0ede8', 799.00, 18, TRUE),
((SELECT id FROM products WHERE slug='cinematic-oversized-tee'), 'COT-CW-XL',  'XL',  'Chalk White',   '#f0ede8', 799.00, 12, TRUE),
((SELECT id FROM products WHERE slug='cinematic-oversized-tee'), 'COT-CW-XXL', 'XXL', 'Chalk White',   '#f0ede8', 799.00, 10, TRUE),
((SELECT id FROM products WHERE slug='cinematic-oversized-tee'), 'COT-VB-S',   'S',   'Vintage Black', '#161616', 799.00, 12, TRUE),
((SELECT id FROM products WHERE slug='cinematic-oversized-tee'), 'COT-VB-M',   'M',   'Vintage Black', '#161616', 799.00, 18, TRUE),
((SELECT id FROM products WHERE slug='cinematic-oversized-tee'), 'COT-VB-L',   'L',   'Vintage Black', '#161616', 799.00, 15, TRUE),
((SELECT id FROM products WHERE slug='cinematic-oversized-tee'), 'COT-VB-XL',  'XL',  'Vintage Black', '#161616', 799.00, 10, TRUE);

-- Rogue Arc Heavyweight Tee
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='rogue-arc-heavyweight-tee'), 'RAT-SG-S',  'S', 'Storm Grey', '#4a4a4a', 999.00, 8,  TRUE),
((SELECT id FROM products WHERE slug='rogue-arc-heavyweight-tee'), 'RAT-SG-M',  'M', 'Storm Grey', '#4a4a4a', 999.00, 12, TRUE),
((SELECT id FROM products WHERE slug='rogue-arc-heavyweight-tee'), 'RAT-SG-L',  'L', 'Storm Grey', '#4a4a4a', 999.00, 5,  TRUE),
((SELECT id FROM products WHERE slug='rogue-arc-heavyweight-tee'), 'RAT-MN-S',  'S', 'Midnight',   '#0f0f0f', 999.00, 6,  TRUE),
((SELECT id FROM products WHERE slug='rogue-arc-heavyweight-tee'), 'RAT-MN-M',  'M', 'Midnight',   '#0f0f0f', 999.00, 10, TRUE),
((SELECT id FROM products WHERE slug='rogue-arc-heavyweight-tee'), 'RAT-MN-L',  'L', 'Midnight',   '#0f0f0f', 999.00, 3,  TRUE);

-- Dark Verse Hoodie
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='dark-verse-hoodie'), 'DVH-EB-S',   'S',   'Eclipse Black', '#080808', 2099.00, 10, TRUE),
((SELECT id FROM products WHERE slug='dark-verse-hoodie'), 'DVH-EB-M',   'M',   'Eclipse Black', '#080808', 2099.00, 14, TRUE),
((SELECT id FROM products WHERE slug='dark-verse-hoodie'), 'DVH-EB-L',   'L',   'Eclipse Black', '#080808', 2099.00, 12, TRUE),
((SELECT id FROM products WHERE slug='dark-verse-hoodie'), 'DVH-EB-XL',  'XL',  'Eclipse Black', '#080808', 2099.00, 10, TRUE),
((SELECT id FROM products WHERE slug='dark-verse-hoodie'), 'DVH-EB-XXL', 'XXL', 'Eclipse Black', '#080808', 2099.00, 8,  TRUE),
((SELECT id FROM products WHERE slug='dark-verse-hoodie'), 'DVH-GM-S',   'S',   'Gunmetal',      '#2a2a2a', 2099.00, 8,  TRUE),
((SELECT id FROM products WHERE slug='dark-verse-hoodie'), 'DVH-GM-M',   'M',   'Gunmetal',      '#2a2a2a', 2099.00, 10, TRUE),
((SELECT id FROM products WHERE slug='dark-verse-hoodie'), 'DVH-GM-L',   'L',   'Gunmetal',      '#2a2a2a', 2099.00, 9,  TRUE);

-- Karma Tee Vol. II
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-WE-XS', 'XS', 'Washed Ecru',     '#e8e0d5', 949.00, 12, TRUE),
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-WE-S',  'S',  'Washed Ecru',     '#e8e0d5', 949.00, 16, TRUE),
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-WE-M',  'M',  'Washed Ecru',     '#e8e0d5', 949.00, 20, TRUE),
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-WE-L',  'L',  'Washed Ecru',     '#e8e0d5', 949.00, 18, TRUE),
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-WE-XL', 'XL', 'Washed Ecru',     '#e8e0d5', 949.00, 14, TRUE),
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-CB-XS', 'XS', 'Charcoal Black',  '#1c1c1c', 949.00, 10, TRUE),
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-CB-S',  'S',  'Charcoal Black',  '#1c1c1c', 949.00, 15, TRUE),
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-CB-M',  'M',  'Charcoal Black',  '#1c1c1c', 949.00, 18, TRUE),
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-CB-L',  'L',  'Charcoal Black',  '#1c1c1c', 949.00, 16, TRUE),
((SELECT id FROM products WHERE slug='karma-tee-vol-2'), 'KTV2-CB-XL', 'XL', 'Charcoal Black',  '#1c1c1c', 949.00, 12, TRUE);

-- Custom Hero Tee
INSERT INTO product_variants (product_id, sku, size, color, color_hex, price, stock_quantity, active) VALUES
((SELECT id FROM products WHERE slug='custom-hero-tee'), 'CHT-CUS-XS',  'XS',  'Custom', '#ffffff', 1299.00, 999, TRUE),
((SELECT id FROM products WHERE slug='custom-hero-tee'), 'CHT-CUS-S',   'S',   'Custom', '#ffffff', 1299.00, 999, TRUE),
((SELECT id FROM products WHERE slug='custom-hero-tee'), 'CHT-CUS-M',   'M',   'Custom', '#ffffff', 1299.00, 999, TRUE),
((SELECT id FROM products WHERE slug='custom-hero-tee'), 'CHT-CUS-L',   'L',   'Custom', '#ffffff', 1299.00, 999, TRUE),
((SELECT id FROM products WHERE slug='custom-hero-tee'), 'CHT-CUS-XL',  'XL',  'Custom', '#ffffff', 1299.00, 999, TRUE),
((SELECT id FROM products WHERE slug='custom-hero-tee'), 'CHT-CUS-XXL', 'XXL', 'Custom', '#ffffff', 1299.00, 999, TRUE);

-- ── Development admin user ────────────────────────────────────
-- Password: Admin@Odessi123 (BCrypt hash — change before any real deployment)
-- This user is for LOCAL DEVELOPMENT TESTING ONLY.
INSERT INTO users (first_name, last_name, email, password_hash, role, enabled)
VALUES ('Odessi', 'Admin', 'admin@odessi.tfi',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCKzSqGnEXHkz6FKXJT5GXK',
        'ADMIN', TRUE);
