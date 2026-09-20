-- ══════════════════════════════════════════════════════════════
-- V12 — Create Product Images Table
-- ══════════════════════════════════════════════════════════════

CREATE TABLE product_images (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT       NOT NULL,
    image_url   VARCHAR(500) NOT NULL,
    alt_text    VARCHAR(255),
    sort_order  INT          NOT NULL DEFAULT 0,
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_images_product ON product_images (product_id);
CREATE INDEX idx_product_images_primary ON product_images (is_primary) WHERE is_primary = TRUE;
