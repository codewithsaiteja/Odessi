-- ══════════════════════════════════════════════════════════════
-- V24 — Add OUT_FOR_DELIVERY Order Status & Idempotent Email Logs
-- ══════════════════════════════════════════════════════════════

-- ── 1. Update orders status check constraint ──────────────────
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_status;
ALTER TABLE orders ADD CONSTRAINT chk_orders_status 
    CHECK (status IN ('PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'PAYMENT_FAILED'));

-- ── 2. Order status email idempotency log table ───────────────
CREATE TABLE IF NOT EXISTS order_status_email_logs (
    id                BIGSERIAL    PRIMARY KEY,
    order_id          BIGINT       NOT NULL,
    order_status      VARCHAR(30)  NOT NULL,
    recipient_email   VARCHAR(255) NOT NULL,
    subject           VARCHAR(255) NOT NULL,
    message_id        VARCHAR(100),
    sent_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_order_status_email_logs_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT uq_order_status_email UNIQUE (order_id, order_status)
);

CREATE INDEX IF NOT EXISTS idx_order_status_email_logs_order ON order_status_email_logs (order_id);
