-- ══════════════════════════════════════════════════════════════
-- V13 — Growth Features Schema
--
-- 1. Partnership Applications
-- 2. Custom Order Inquiries
-- 3. Limited Drops Schema Updates (products & collections)
-- 4. Back-In-Stock Notification Requests
-- 5. Product Media Video Support (media_type, video_url, poster_url)
-- 6. Referral Codes & Referral Tracking
-- 7. Odessi Club Loyalty Accounts
-- ══════════════════════════════════════════════════════════════

-- ── 1. Partnership Applications ──────────────────────────────
CREATE TABLE IF NOT EXISTS partnership_applications (
    id BIGSERIAL PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    estimated_monthly_requirement VARCHAR(100),
    website_instagram VARCHAR(255),
    message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_partnership_status CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED'))
);

CREATE INDEX idx_partnership_apps_status ON partnership_applications(status);
CREATE INDEX idx_partnership_apps_created ON partnership_applications(created_at DESC);

-- ── 2. Custom Order Inquiries ────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_order_inquiries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    organization VARCHAR(150),
    order_type VARCHAR(50) NOT NULL,
    approximate_quantity INT NOT NULL,
    preferred_product VARCHAR(150),
    customization_requirement TEXT,
    expected_delivery_date VARCHAR(50),
    message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_custom_order_status CHECK (status IN ('NEW', 'IN_REVIEW', 'QUOTED', 'CONFIRMED', 'CANCELLED'))
);

CREATE INDEX idx_custom_orders_status ON custom_order_inquiries(status);
CREATE INDEX idx_custom_orders_created ON custom_order_inquiries(created_at DESC);

-- ── 3. Limited Drop Fields on Products & Collections ────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_drop BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS drop_title VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS drop_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS launch_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_drop BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS launch_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_products_is_drop ON products(is_drop, launch_at);

-- ── 4. Back-In-Stock Requests ────────────────────────────────
CREATE TABLE IF NOT EXISTS back_in_stock_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_back_in_stock_status CHECK (status IN ('PENDING', 'NOTIFIED', 'CANCELLED')),
    CONSTRAINT uq_variant_email_pending UNIQUE (variant_id, email, status)
);

CREATE INDEX idx_back_in_stock_variant ON back_in_stock_requests(variant_id, status);
CREATE INDEX idx_back_in_stock_email ON back_in_stock_requests(email);

-- ── 5. Product Media Video Fields ────────────────────────────
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) NOT NULL DEFAULT 'IMAGE';
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS poster_url VARCHAR(500);

-- ── 6. Referral Codes & Referrals ───────────────────────────
CREATE TABLE IF NOT EXISTS referral_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);

CREATE TABLE IF NOT EXISTS referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    code_used VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    qualifying_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_referral_status CHECK (status IN ('PENDING', 'QUALIFIED', 'CANCELLED')),
    CONSTRAINT chk_no_self_referral CHECK (referrer_user_id <> referee_user_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_user_id);

-- ── 7. Loyalty Accounts ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(30) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_loyalty_tier CHECK (tier IN ('STANDARD', 'MEMBER', 'VIP')),
    CONSTRAINT chk_loyalty_status CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

CREATE INDEX idx_loyalty_accounts_user ON loyalty_accounts(user_id);
