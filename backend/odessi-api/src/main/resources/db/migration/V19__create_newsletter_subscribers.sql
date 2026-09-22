-- ══════════════════════════════════════════════════════════════
-- V19 — Newsletter Subscribers & Shipping Threshold Standardization
-- ══════════════════════════════════════════════════════════════

-- ── 1. Newsletter Subscribers Table ───────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    source          VARCHAR(100) NOT NULL DEFAULT 'STOREFRONT_FOOTER',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);

-- ── 2. Standardize Free Shipping Threshold to ₹999 ───────────
UPDATE shipping_methods
SET charge = 99.00, free_shipping_threshold = 999.00
WHERE code = 'STANDARD';
