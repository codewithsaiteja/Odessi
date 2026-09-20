-- ══════════════════════════════════════════════════════════════
-- V2 — Categories, Collections, Products, ProductVariants
-- ══════════════════════════════════════════════════════════════

-- ── Categories ────────────────────────────────────────────────
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description TEXT,
    image       VARCHAR(500),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_categories_slug UNIQUE (slug)
);

CREATE INDEX idx_categories_slug   ON categories (slug);
CREATE INDEX idx_categories_active ON categories (active);

-- ── Collections ───────────────────────────────────────────────
CREATE TABLE collections (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description TEXT,
    hero_image  VARCHAR(500),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    featured    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_collections_slug UNIQUE (slug)
);

CREATE INDEX idx_collections_slug     ON collections (slug);
CREATE INDEX idx_collections_featured ON collections (featured);

-- ── Products ──────────────────────────────────────────────────
CREATE TABLE products (
    id                BIGSERIAL PRIMARY KEY,
    name              VARCHAR(200) NOT NULL,
    slug              VARCHAR(200) NOT NULL,
    description       TEXT,
    short_description VARCHAR(500),
    price             NUMERIC(10,2) NOT NULL,
    compare_at_price  NUMERIC(10,2),
    currency          VARCHAR(3)   NOT NULL DEFAULT 'INR',
    category_id       BIGINT REFERENCES categories(id),
    collection_id     BIGINT REFERENCES collections(id),
    material          VARCHAR(200),
    fit               VARCHAR(100),
    care_instructions TEXT,
    featured          BOOLEAN      NOT NULL DEFAULT FALSE,
    bestseller        BOOLEAN      NOT NULL DEFAULT FALSE,
    new_arrival       BOOLEAN      NOT NULL DEFAULT FALSE,
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_products_slug  UNIQUE (slug),
    CONSTRAINT chk_products_price CHECK (price > 0),
    CONSTRAINT fk_products_category   FOREIGN KEY (category_id)   REFERENCES categories(id),
    CONSTRAINT fk_products_collection FOREIGN KEY (collection_id) REFERENCES collections(id)
);

CREATE INDEX idx_products_slug       ON products (slug);
CREATE INDEX idx_products_active     ON products (active);
CREATE INDEX idx_products_category   ON products (category_id);
CREATE INDEX idx_products_collection ON products (collection_id);
CREATE INDEX idx_products_featured   ON products (featured) WHERE active = TRUE;
CREATE INDEX idx_products_bestseller ON products (bestseller) WHERE active = TRUE;
CREATE INDEX idx_products_new        ON products (new_arrival) WHERE active = TRUE;

-- ── Product Variants ──────────────────────────────────────────
CREATE TABLE product_variants (
    id             BIGSERIAL PRIMARY KEY,
    product_id     BIGINT        NOT NULL,
    sku            VARCHAR(100)  NOT NULL,
    size           VARCHAR(20)   NOT NULL,
    color          VARCHAR(100)  NOT NULL,
    color_hex      VARCHAR(7),
    price          NUMERIC(10,2) NOT NULL,
    stock_quantity INT           NOT NULL DEFAULT 0,
    active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_product_variants_sku UNIQUE (sku),
    CONSTRAINT chk_variants_stock      CHECK (stock_quantity >= 0),
    CONSTRAINT chk_variants_price      CHECK (price > 0),
    CONSTRAINT fk_variants_product     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_variants_product ON product_variants (product_id);
CREATE INDEX idx_variants_sku     ON product_variants (sku);
CREATE INDEX idx_variants_active  ON product_variants (active);

COMMENT ON COLUMN product_variants.sku IS 'Globally unique stock keeping unit';
COMMENT ON COLUMN products.price       IS 'Base display price. Per-variant pricing on product_variants';
