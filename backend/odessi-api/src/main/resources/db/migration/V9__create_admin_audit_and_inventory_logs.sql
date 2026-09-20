-- ══════════════════════════════════════════════════════════════
-- V9 — Admin Audit Logs and Inventory Adjustment Audit
-- ══════════════════════════════════════════════════════════════

-- ── 1. Admin Audit Logs ───────────────────────────────────────
CREATE TABLE admin_audit_logs (
    id            BIGSERIAL    PRIMARY KEY,
    admin_id      BIGINT       NOT NULL,
    admin_email   VARCHAR(255) NOT NULL,
    action        VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(100) NOT NULL,
    entity_id     VARCHAR(100),
    details       TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_admin_audit_user FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_audit_admin_id  ON admin_audit_logs (admin_id);
CREATE INDEX idx_admin_audit_action    ON admin_audit_logs (action);
CREATE INDEX idx_admin_audit_created   ON admin_audit_logs (created_at DESC);

-- ── 2. Inventory Adjustment Audit Logs ────────────────────────
CREATE TABLE inventory_logs (
    id                 BIGSERIAL    PRIMARY KEY,
    variant_id         BIGINT       NOT NULL,
    quantity_change    INT          NOT NULL,
    previous_quantity  INT          NOT NULL,
    resulting_quantity INT          NOT NULL,
    reason             VARCHAR(255) NOT NULL,
    admin_id           BIGINT,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_inv_log_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_log_admin   FOREIGN KEY (admin_id)   REFERENCES users(id)            ON DELETE SET NULL
);

CREATE INDEX idx_inv_log_variant_id ON inventory_logs (variant_id);
CREATE INDEX idx_inv_log_created    ON inventory_logs (created_at DESC);
