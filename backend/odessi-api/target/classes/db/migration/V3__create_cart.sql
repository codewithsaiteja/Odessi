-- ══════════════════════════════════════════════════════════════
-- V3 — Cart, CartItems, Wishlist, WishlistItems
-- ══════════════════════════════════════════════════════════════

-- ── Carts ─────────────────────────────────────────────────────
CREATE TABLE carts (
    id         BIGSERIAL   PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_carts_user   UNIQUE (user_id),
    CONSTRAINT fk_carts_user   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_carts_user ON carts (user_id);

-- ── Cart Items ────────────────────────────────────────────────
CREATE TABLE cart_items (
    id         BIGSERIAL   PRIMARY KEY,
    cart_id    BIGINT      NOT NULL,
    variant_id BIGINT      NOT NULL,
    quantity   INT         NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_cart_items_cart_variant UNIQUE (cart_id, variant_id),
    CONSTRAINT chk_cart_items_qty         CHECK (quantity >= 1),
    CONSTRAINT fk_cart_items_cart         FOREIGN KEY (cart_id)    REFERENCES carts(id)            ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_variant      FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

CREATE INDEX idx_cart_items_cart    ON cart_items (cart_id);
CREATE INDEX idx_cart_items_variant ON cart_items (variant_id);

-- ── Wishlists ─────────────────────────────────────────────────
CREATE TABLE wishlists (
    id         BIGSERIAL   PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_wishlists_user UNIQUE (user_id),
    CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_wishlists_user ON wishlists (user_id);

-- ── Wishlist Items ────────────────────────────────────────────
CREATE TABLE wishlist_items (
    id          BIGSERIAL   PRIMARY KEY,
    wishlist_id BIGINT      NOT NULL,
    product_id  BIGINT      NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_wishlist_items_wishlist_product UNIQUE (wishlist_id, product_id),
    CONSTRAINT fk_wishlist_items_wishlist          FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_items_product           FOREIGN KEY (product_id)  REFERENCES products(id)
);

CREATE INDEX idx_wishlist_items_wishlist ON wishlist_items (wishlist_id);
CREATE INDEX idx_wishlist_items_product  ON wishlist_items (product_id);
