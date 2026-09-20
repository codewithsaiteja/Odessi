-- ══════════════════════════════════════════════════════════════
-- V5 — Payments
-- ══════════════════════════════════════════════════════════════

CREATE TABLE payments (
    id                  BIGSERIAL      PRIMARY KEY,
    order_id            BIGINT         NOT NULL,
    provider            VARCHAR(30)    NOT NULL DEFAULT 'RAZORPAY',
    provider_order_id   VARCHAR(200),
    provider_payment_id VARCHAR(200),
    amount              NUMERIC(10,2)  NOT NULL,
    currency            VARCHAR(3)     NOT NULL DEFAULT 'INR',
    status              VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_payments_order   UNIQUE (order_id),
    CONSTRAINT chk_payments_status CHECK (status IN ('PENDING','AUTHORIZED','PAID','FAILED','REFUNDED')),
    CONSTRAINT fk_payments_order   FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX idx_payments_order             ON payments (order_id);
CREATE INDEX idx_payments_provider_order_id ON payments (provider_order_id);
CREATE INDEX idx_payments_status            ON payments (status);

COMMENT ON TABLE  payments                       IS 'Payment records — Razorpay integration added in Phase 4';
COMMENT ON COLUMN payments.provider_order_id     IS 'ID assigned by payment gateway (e.g. Razorpay order ID)';
COMMENT ON COLUMN payments.provider_payment_id   IS 'ID returned after payment capture (e.g. Razorpay payment ID)';
