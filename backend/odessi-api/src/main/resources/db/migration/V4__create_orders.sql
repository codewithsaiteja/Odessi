-- ══════════════════════════════════════════════════════════════
-- V4 — Addresses, Orders, OrderItems
-- ══════════════════════════════════════════════════════════════

-- ── Addresses ─────────────────────────────────────────────────
CREATE TABLE addresses (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    full_name     VARCHAR(200) NOT NULL,
    phone         VARCHAR(20)  NOT NULL,
    address_line1 VARCHAR(300) NOT NULL,
    address_line2 VARCHAR(300),
    city          VARCHAR(100) NOT NULL,
    state         VARCHAR(100) NOT NULL,
    postal_code   VARCHAR(20)  NOT NULL,
    country       VARCHAR(100) NOT NULL DEFAULT 'India',
    is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_addresses_user ON addresses (user_id);

-- ── Orders ────────────────────────────────────────────────────
CREATE TABLE orders (
    id                        BIGSERIAL      PRIMARY KEY,
    order_number              VARCHAR(50)    NOT NULL,
    user_id                   BIGINT         NOT NULL,
    subtotal                  NUMERIC(10,2)  NOT NULL,
    shipping_amount           NUMERIC(10,2)  NOT NULL DEFAULT 0,
    discount_amount           NUMERIC(10,2)  NOT NULL DEFAULT 0,
    tax_amount                NUMERIC(10,2)  NOT NULL DEFAULT 0,
    total_amount              NUMERIC(10,2)  NOT NULL,
    currency                  VARCHAR(3)     NOT NULL DEFAULT 'INR',
    status                    VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    payment_status            VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    shipping_address_snapshot TEXT,
    created_at                TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_orders_order_number UNIQUE (order_number),
    CONSTRAINT chk_orders_status      CHECK (status IN ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED')),
    CONSTRAINT chk_orders_pay_status  CHECK (payment_status IN ('PENDING','AUTHORIZED','PAID','FAILED','REFUNDED')),
    CONSTRAINT fk_orders_user         FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_orders_user         ON orders (user_id);
CREATE INDEX idx_orders_order_number ON orders (order_number);
CREATE INDEX idx_orders_status       ON orders (status);
CREATE INDEX idx_orders_created      ON orders (created_at DESC);

COMMENT ON COLUMN orders.shipping_address_snapshot IS 'JSON snapshot of address at checkout — immutable for historical accuracy';

-- ── Order Items ───────────────────────────────────────────────
CREATE TABLE order_items (
    id                    BIGSERIAL      PRIMARY KEY,
    order_id              BIGINT         NOT NULL,
    variant_id            BIGINT,
    product_name_snapshot VARCHAR(200)   NOT NULL,
    sku_snapshot          VARCHAR(100)   NOT NULL,
    size_snapshot         VARCHAR(20)    NOT NULL,
    color_snapshot        VARCHAR(100)   NOT NULL,
    unit_price            NUMERIC(10,2)  NOT NULL,
    quantity              INT            NOT NULL,
    total_price           NUMERIC(10,2)  NOT NULL,

    CONSTRAINT chk_order_items_qty    CHECK (quantity >= 1),
    CONSTRAINT chk_order_items_price  CHECK (unit_price > 0),
    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders(id)           ON DELETE CASCADE,
    CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE INDEX idx_order_items_order   ON order_items (order_id);
CREATE INDEX idx_order_items_variant ON order_items (variant_id);

COMMENT ON COLUMN order_items.product_name_snapshot IS 'Snapshot — preserves product name at purchase time';
COMMENT ON COLUMN order_items.unit_price            IS 'Snapshot — preserves price at purchase time';
