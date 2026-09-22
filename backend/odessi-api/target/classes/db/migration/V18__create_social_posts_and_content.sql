-- ══════════════════════════════════════════════════════════════
-- V18 — Social Posts & Homepage Structured Content Schema
-- ══════════════════════════════════════════════════════════════

-- ── 1. Social Posts Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts (
    id              BIGSERIAL PRIMARY KEY,
    media_url       VARCHAR(500) NOT NULL,
    instagram_url   VARCHAR(500),
    caption         TEXT,
    title           VARCHAR(150),
    product_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,
    collection_id   BIGINT REFERENCES collections(id) ON DELETE SET NULL,
    is_published    BOOLEAN NOT NULL DEFAULT TRUE,
    display_order   INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_published ON social_posts(is_published, display_order, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_product ON social_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_collection ON social_posts(collection_id);

-- ── 2. Product Reviews Recommendation Enhancement ───────────
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS recommended BOOLEAN DEFAULT TRUE;

-- ── 3. Homepage Structured Content Table ─────────────────────
CREATE TABLE IF NOT EXISTS homepage_content (
    id                  BIGSERIAL PRIMARY KEY,
    section_key         VARCHAR(50) NOT NULL UNIQUE,
    title               VARCHAR(200),
    eyebrow             VARCHAR(200),
    headline            TEXT,
    sub_headline        TEXT,
    body                TEXT,
    primary_cta_label   VARCHAR(100),
    primary_cta_url     VARCHAR(255),
    secondary_cta_label VARCHAR(100),
    secondary_cta_url   VARCHAR(255),
    media_url           VARCHAR(500),
    mobile_media_url    VARCHAR(500),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    custom_payload      TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_content_section ON homepage_content(section_key, is_active);

-- ── 4. Seed Initial Curated Social Posts ─────────────────────
-- Links to actual catalog products where available
INSERT INTO social_posts (media_url, instagram_url, caption, title, product_id, is_published, display_order)
VALUES
(
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=85',
    'https://www.instagram.com/p/DB123456789/',
    'Heavyweight drape crafted for everyday cinematic power. Wearing the ODESSI Core Oversized Tee.',
    'Core Monochromes',
    (SELECT id FROM products WHERE slug = 'odessi-core-oversized-tee' LIMIT 1),
    TRUE,
    1
),
(
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=85',
    'https://www.instagram.com/p/DB123456790/',
    'Deep midnight tones and dense French terry fabric. The iconic hoodie inspired by relentless hero ambition.',
    'Beyond Stardom Hoodie',
    (SELECT id FROM products WHERE slug = 'mahesh-babu-a-man-beyond-stardom-hoodie' OR slug = 'cinematic' LIMIT 1),
    TRUE,
    2
),
(
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=85',
    'https://www.instagram.com/p/DB123456791/',
    'Archive typography with high-density puff print detailing. Streetwear engineered for those who carry the story.',
    'Archive Typographic Tee',
    (SELECT id FROM products WHERE slug = 'odessi-archive-graphic-tee' LIMIT 1),
    TRUE,
    3
),
(
    'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&q=85',
    'https://www.instagram.com/p/DB123456792/',
    'Minimalist emblem on luxury combed cotton. Tailored with clean drop-shoulders and structured collar.',
    'Signature Oversized Tee',
    (SELECT id FROM products WHERE slug = 'odessi-signature-oversized-tee' LIMIT 1),
    TRUE,
    4
),
(
    'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&q=85',
    'https://www.instagram.com/p/DB123456793/',
    'Behind the lens. Exploring raw silhouettes in high contrast studio light. New drop dropping soon.',
    'Studio Lookbook 01',
    (SELECT id FROM products WHERE active = TRUE ORDER BY id ASC LIMIT 1),
    TRUE,
    5
),
(
    'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&q=85',
    'https://www.instagram.com/p/DB123456794/',
    'Wear your story. The community wearing ODESSI in Hyderabad, Mumbai, and Bangalore.',
    'Community Showcase',
    (SELECT id FROM products WHERE active = TRUE ORDER BY id DESC LIMIT 1),
    TRUE,
    6
)
ON CONFLICT DO NOTHING;

-- ── 5. Seed Homepage Structured Content ──────────────────────
INSERT INTO homepage_content (section_key, eyebrow, headline, sub_headline, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, media_url, is_active)
VALUES
(
    'HERO',
    'SS 2026 EDITORIAL',
    'WEAR YOUR
STORY.',
    'Hero-inspired pieces designed with heavyweight silhouettes for those who carry their own story.',
    'EXPLORE COLLECTION',
    '/shop',
    'OUR STORY',
    '/about',
    'https://images.unsplash.com/photo-1536922246289-88c42f957773?w=2400&q=90',
    TRUE
),
(
    'ANNOUNCEMENT',
    'PROMOTIONS',
    'FREE SHIPPING ON ORDERS ABOVE ₹999 | NEW DROP: DARK VERSE COLLECTION — SHOP NOW',
    NULL,
    'SHOP NOW',
    '/shop',
    NULL,
    NULL,
    NULL,
    TRUE
),
(
    'BRAND_STORY',
    'OUR STORY',
    'WEAR YOUR
STORY.',
    'Every piece is designed to carry a character. You bring the story.',
    'DISCOVER ODESSI',
    '/about',
    NULL,
    NULL,
    'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=1600&q=90',
    TRUE
)
ON CONFLICT (section_key) DO NOTHING;
