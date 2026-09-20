-- ══════════════════════════════════════════════════════════════
-- V8 — Inventory Reservations and Webhook Audit
-- ══════════════════════════════════════════════════════════════

-- ── 1. Update CHECK Constraints ──────────────────────────────
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_status;
ALTER TABLE orders ADD CONSTRAINT chk_orders_status 
    CHECK (status IN ('PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAYMENT_FAILED'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_pay_status;
ALTER TABLE orders ADD CONSTRAINT chk_orders_pay_status 
    CHECK (payment_status IN ('PENDING', 'AUTHORIZED', 'CAPTURED', 'PAID', 'FAILED', 'REFUNDED'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS chk_payments_status;
ALTER TABLE payments ADD CONSTRAINT chk_payments_status 
    CHECK (status IN ('PENDING', 'AUTHORIZED', 'CAPTURED', 'PAID', 'FAILED', 'REFUNDED'));

-- ── 2. Inventory Reservations Table ──────────────────────────
CREATE TABLE inventory_reservations (
    id                BIGSERIAL    PRIMARY KEY,
    order_id          BIGINT       NOT NULL,
    variant_id        BIGINT       NOT NULL,
    quantity          INT          NOT NULL,
    status            VARCHAR(30)  NOT NULL DEFAULT 'RESERVED',
    expires_at        TIMESTAMPTZ  NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_inv_res_status CHECK (status IN ('RESERVED', 'SOLD', 'RELEASED')),
    CONSTRAINT fk_inv_res_order   FOREIGN KEY (order_id)   REFERENCES orders(id)           ON DELETE CASCADE,
    CONSTRAINT fk_inv_res_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
);

CREATE INDEX idx_inv_res_order      ON inventory_reservations (order_id);
CREATE INDEX idx_inv_res_variant    ON inventory_reservations (variant_id);
CREATE INDEX idx_inv_res_status_exp ON inventory_reservations (status, expires_at);

-- ── 3. Payment Webhook Events Table (Idempotency) ────────────
CREATE TABLE payment_webhook_events (
    id                BIGSERIAL    PRIMARY KEY,
    razorpay_event_id VARCHAR(150) NOT NULL,
    event_type        VARCHAR(100) NOT NULL,
    payload           TEXT         NOT NULL,
    processed_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    status            VARCHAR(30)  NOT NULL DEFAULT 'PROCESSED',

    CONSTRAINT uq_webhook_razorpay_event_id UNIQUE (razorpay_event_id)
);

CREATE INDEX idx_webhook_events_event_id ON payment_webhook_events (razorpay_event_id);
