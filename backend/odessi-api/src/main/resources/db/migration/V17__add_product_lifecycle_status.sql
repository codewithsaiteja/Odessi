-- ══════════════════════════════════════════════════════════════
-- V16 — Add Product Lifecycle Status Column
-- ══════════════════════════════════════════════════════════════

ALTER TABLE products 
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED';

-- Map existing active/inactive products deliberately
UPDATE products SET status = 'PUBLISHED' WHERE active = TRUE;
UPDATE products SET status = 'ARCHIVED' WHERE active = FALSE;

CREATE INDEX idx_products_status ON products (status);
