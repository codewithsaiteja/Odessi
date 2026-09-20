-- ══════════════════════════════════════════════════════════════
-- V11 — Shipping Methods, Coupons, Coupon Usages, Product Reviews
-- ══════════════════════════════════════════════════════════════

-- ── Shipping Methods ──────────────────────────────────────────
CREATE TABLE shipping_methods (
    id                      BIGSERIAL      PRIMARY KEY,
    name                    VARCHAR(100)   NOT NULL,
    code                    VARCHAR(50)    NOT NULL UNIQUE,
    charge                  NUMERIC(10,2)  NOT NULL DEFAULT 0.00,
    free_shipping_threshold NUMERIC(10,2),
    estimated_days          VARCHAR(50),
    active                  BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Seed initial shipping methods
INSERT INTO shipping_methods (name, code, charge, free_shipping_threshold, estimated_days, active)
VALUES
  ('Standard Delivery', 'STANDARD', 150.00, 1999.00, '3-5 Business Days', true),
  ('Express Delivery', 'EXPRESS', 300.00, NULL, '1-2 Business Days', true);

-- ── Coupons ───────────────────────────────────────────────────
CREATE TABLE coupons (
    id                  BIGSERIAL      PRIMARY KEY,
    code                VARCHAR(50)    NOT NULL UNIQUE,
    discount_type       VARCHAR(20)    NOT NULL,
    discount_value      NUMERIC(10,2)  NOT NULL,
    min_order_amount    NUMERIC(10,2)  NOT NULL DEFAULT 0.00,
    max_discount_amount NUMERIC(10,2),
    start_date          TIMESTAMPTZ,
    expiry_date         TIMESTAMPTZ,
    total_usage_limit   INT,
    per_customer_limit  INT            NOT NULL DEFAULT 1,
    times_used          INT            NOT NULL DEFAULT 0,
    active              BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_coupons_discount_type CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT'))
);

-- Seed initial coupon for testing
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, total_usage_limit, per_customer_limit, active)
VALUES
  ('WELCOME10', 'PERCENTAGE', 10.00, 500.00, 500.00, 1000, 1, true),
  ('FLAT200', 'FIXED_AMOUNT', 200.00, 1000.00, NULL, 500, 1, true);

-- ── Coupon Usages ─────────────────────────────────────────────
CREATE TABLE coupon_usages (
    id          BIGSERIAL   PRIMARY KEY,
    coupon_id   BIGINT      NOT NULL,
    user_id     BIGINT      NOT NULL,
    order_id    BIGINT      NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,

    CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    CONSTRAINT fk_coupon_usages_user   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_coupon_usages_order  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT uq_coupon_usages_order  UNIQUE (coupon_id, order_id),
    CONSTRAINT chk_coupon_usages_status CHECK (status IN ('RESERVED', 'CONSUMED', 'RELEASED'))
);

CREATE INDEX idx_coupon_usages_user_status ON coupon_usages(coupon_id, user_id, status);
CREATE INDEX idx_coupon_usages_order ON coupon_usages(order_id);

-- ── Product Reviews ───────────────────────────────────────────
CREATE TABLE product_reviews (
    id                BIGSERIAL   PRIMARY KEY,
    product_id        BIGINT      NOT NULL,
    user_id           BIGINT      NOT NULL,
    order_id          BIGINT      NOT NULL,
    rating            INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title             VARCHAR(200),
    comment           TEXT        NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_purchase BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_product_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_reviews_user    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_reviews_order   FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT uq_product_reviews_unique  UNIQUE (user_id, product_id, order_id),
    CONSTRAINT chk_product_reviews_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_product_reviews_product_status ON product_reviews(product_id, status);

-- ── Orders Table Enhancements ──────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_code VARCHAR(50);
