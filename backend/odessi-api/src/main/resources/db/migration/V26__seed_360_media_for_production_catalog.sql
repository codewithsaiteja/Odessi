-- ══════════════════════════════════════════════════════════════
-- V26 — Seed 360° Worn Media For Production Catalog Products
-- ══════════════════════════════════════════════════════════════

-- 1. Mahesh Babu A Man Beyond Stardom Oversized Hoodie (8 sequential 360-degree worn frames)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, '/api/media/products/prod-1790187970542-ff867172.png', 'Mahesh Babu Oversized Hoodie 360 Frame 1 (Front 0°)', 0, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'mahesh-babu-a-man-beyond-stardom-oversized-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 0);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000&q=85', 'Mahesh Babu Oversized Hoodie 360 Frame 2 (Angle 45°)', 1, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'mahesh-babu-a-man-beyond-stardom-oversized-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 1);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=85', 'Mahesh Babu Oversized Hoodie 360 Frame 3 (Side 90°)', 2, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'mahesh-babu-a-man-beyond-stardom-oversized-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 2);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1000&q=85', 'Mahesh Babu Oversized Hoodie 360 Frame 4 (Angle 135°)', 3, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'mahesh-babu-a-man-beyond-stardom-oversized-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 3);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1000&q=85', 'Mahesh Babu Oversized Hoodie 360 Frame 5 (Back 180°)', 4, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'mahesh-babu-a-man-beyond-stardom-oversized-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 4);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&q=85', 'Mahesh Babu Oversized Hoodie 360 Frame 6 (Side 240°)', 5, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'mahesh-babu-a-man-beyond-stardom-oversized-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 5);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=1000&q=85', 'Mahesh Babu Oversized Hoodie 360 Frame 7 (Angle 300°)', 6, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'mahesh-babu-a-man-beyond-stardom-oversized-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 6);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1000&q=85', 'Mahesh Babu Oversized Hoodie 360 Frame 8 (Cycle Close 360°)', 7, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'mahesh-babu-a-man-beyond-stardom-oversized-hoodie'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 7);

-- 2. Kaateramma Koduku Oversized Hoodie (slug: sai) (6 sequential 360-degree worn frames)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, '/api/media/products/prod-1790184092983-d7046db1.jpg', 'Kaateramma Koduku 360 Frame 1 (Front 0°)', 0, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'sai'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 0);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, '/api/media/products/prod-1790178923189-ea358c5f.jpg', 'Kaateramma Koduku 360 Frame 2 (Angle 60°)', 1, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'sai'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 1);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, '/api/media/products/prod-1790184096353-58a49afb.jpg', 'Kaateramma Koduku 360 Frame 3 (Side 120°)', 2, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'sai'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 2);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1000&q=85', 'Kaateramma Koduku 360 Frame 4 (Back 180°)', 3, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'sai'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 3);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&q=85', 'Kaateramma Koduku 360 Frame 5 (Side 240°)', 4, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'sai'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 4);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=1000&q=85', 'Kaateramma Koduku 360 Frame 6 (Angle 300°)', 5, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'sai'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 5);

-- 3. Paradise Graphic Oversized T-Shirt (slug: paradise-graphic-oversized-t-shirt) (6 sequential 360-degree worn frames)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, '/api/media/products/prod-1790342450983-0aaee529.jpg', 'Paradise Graphic Tee 360 Frame 1 (Front 0°)', 0, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'paradise-graphic-oversized-t-shirt'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 0);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=1000&q=85', 'Paradise Graphic Tee 360 Frame 2 (Angle 60°)', 1, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'paradise-graphic-oversized-t-shirt'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 1);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1000&q=85', 'Paradise Graphic Tee 360 Frame 3 (Side 120°)', 2, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'paradise-graphic-oversized-t-shirt'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 2);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1000&q=85', 'Paradise Graphic Tee 360 Frame 4 (Back 180°)', 3, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'paradise-graphic-oversized-t-shirt'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 3);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=1000&q=85', 'Paradise Graphic Tee 360 Frame 5 (Side 240°)', 4, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'paradise-graphic-oversized-t-shirt'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 4);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, media_type)
SELECT p.id, 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1000&q=85', 'Paradise Graphic Tee 360 Frame 6 (Cycle Close 360°)', 5, FALSE, 'SPIN_360'
FROM products p WHERE p.slug = 'paradise-graphic-oversized-t-shirt'
AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND media_type = 'SPIN_360' AND sort_order = 5);
