-- ══════════════════════════════════════════════════════════════════════
-- V33 — ODESSI Trusted Sellers Program Schema & Initial Seed
--
-- 1. sellers                   — Dedicated seller identity, application & approval workflow
-- 2. seller_milestone_configs  — Editable milestone tiers & physical gift rewards
-- 3. seller_attributions       — Order attribution, qualification & fraud protection
-- 4. seller_rewards            — Physical reward fulfillment lifecycle (unlocked -> claimed -> shipped)
-- 5. seller_audit_logs         — Complete audit trail for admin actions & milestones
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Sellers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sellers (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    seller_code             VARCHAR(50) NOT NULL UNIQUE,
    full_name               VARCHAR(150) NOT NULL,
    email                   VARCHAR(255) NOT NULL,
    phone                   VARCHAR(50) NOT NULL,
    social_channel          VARCHAR(255) NOT NULL,
    application_reason      TEXT NOT NULL,
    terms_accepted          BOOLEAN NOT NULL DEFAULT TRUE,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    rejection_reason        TEXT,
    suspension_reason       TEXT,
    approved_by_admin_id    BIGINT REFERENCES users(id),
    approved_at             TIMESTAMP WITH TIME ZONE,
    rejected_by_admin_id    BIGINT REFERENCES users(id),
    rejected_at             TIMESTAMP WITH TIME ZONE,
    suspended_by_admin_id   BIGINT REFERENCES users(id),
    suspended_at            TIMESTAMP WITH TIME ZONE,
    verified_sales_count    INT NOT NULL DEFAULT 0,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_seller_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    CONSTRAINT chk_seller_sales_non_negative CHECK (verified_sales_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_seller_code ON sellers(seller_code);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status);

-- ── 2. Seller Milestone Configurations ─────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_milestone_configs (
    id                          BIGSERIAL PRIMARY KEY,
    tier_level                  INT NOT NULL UNIQUE,
    milestone_name              VARCHAR(100) NOT NULL,
    qualifying_sales_threshold  INT NOT NULL UNIQUE,
    reward_title                VARCHAR(150) NOT NULL,
    reward_description          TEXT NOT NULL,
    reward_type                 VARCHAR(50) NOT NULL DEFAULT 'PHYSICAL_GIFT',
    image_url                   VARCHAR(255),
    active                      BOOLEAN NOT NULL DEFAULT TRUE,
    version                     INT NOT NULL DEFAULT 1,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_milestone_threshold_positive CHECK (qualifying_sales_threshold > 0)
);

CREATE INDEX IF NOT EXISTS idx_seller_milestone_active ON seller_milestone_configs(active);
CREATE INDEX IF NOT EXISTS idx_seller_milestone_threshold ON seller_milestone_configs(qualifying_sales_threshold);

-- ── 3. Seller Attributions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_attributions (
    id                      BIGSERIAL PRIMARY KEY,
    order_id                BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    seller_id               BIGINT NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    customer_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seller_code_used        VARCHAR(50) NOT NULL,
    order_number            VARCHAR(50) NOT NULL,
    order_total             NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_qualifying           BOOLEAN NOT NULL DEFAULT FALSE,
    qualification_status    VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    qualification_reason    VARCHAR(255),
    qualified_at            TIMESTAMP WITH TIME ZONE,
    disqualified_at         TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_seller_attr_status CHECK (qualification_status IN ('PENDING', 'QUALIFIED', 'DISQUALIFIED_REFUND', 'DISQUALIFIED_CANCELLED', 'DISQUALIFIED_SELF_REFERRAL'))
);

CREATE INDEX IF NOT EXISTS idx_seller_attr_order_id ON seller_attributions(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_attr_seller_id ON seller_attributions(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_attr_customer_id ON seller_attributions(customer_id);
CREATE INDEX IF NOT EXISTS idx_seller_attr_qual_status ON seller_attributions(qualification_status);
CREATE INDEX IF NOT EXISTS idx_seller_attr_is_qualifying ON seller_attributions(is_qualifying);

-- ── 4. Seller Rewards (Physical Fulfillment) ───────────────────────────
CREATE TABLE IF NOT EXISTS seller_rewards (
    id                          BIGSERIAL PRIMARY KEY,
    seller_id                   BIGINT NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    milestone_config_id         BIGINT NOT NULL REFERENCES seller_milestone_configs(id) ON DELETE RESTRICT,
    tier_level                  INT NOT NULL,
    milestone_name_snapshot     VARCHAR(100) NOT NULL,
    reward_title_snapshot       VARCHAR(150) NOT NULL,
    reward_description_snapshot TEXT NOT NULL,
    qualifying_sales_at_unlock  INT NOT NULL,
    status                      VARCHAR(30) NOT NULL DEFAULT 'UNLOCKED',
    unlocked_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_at                  TIMESTAMP WITH TIME ZONE,
    shipping_full_name          VARCHAR(150),
    shipping_phone              VARCHAR(50),
    shipping_address_line1      VARCHAR(255),
    shipping_address_line2      VARCHAR(255),
    shipping_city               VARCHAR(100),
    shipping_state              VARCHAR(100),
    shipping_postal_code        VARCHAR(20),
    tshirt_size                 VARCHAR(10),
    shipping_carrier            VARCHAR(100),
    tracking_number             VARCHAR(100),
    tracking_url                VARCHAR(255),
    dispatched_at               TIMESTAMP WITH TIME ZONE,
    delivered_at                TIMESTAMP WITH TIME ZONE,
    admin_notes                 TEXT,
    updated_by_admin_id         BIGINT REFERENCES users(id),
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_seller_milestone_reward UNIQUE (seller_id, milestone_config_id),
    CONSTRAINT chk_seller_reward_status CHECK (status IN ('UNLOCKED', 'CLAIMED', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_seller_rewards_seller ON seller_rewards(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_rewards_status ON seller_rewards(status);

-- ── 5. Seller Audit Logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    seller_id       BIGINT REFERENCES sellers(id) ON DELETE SET NULL,
    admin_id        BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(60) NOT NULL,
    details         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seller_audit_seller ON seller_audit_logs(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_audit_admin ON seller_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_seller_audit_action ON seller_audit_logs(action);

-- ── 6. Seed Initial 4 Milestone Tiers ──────────────────────────────────
INSERT INTO seller_milestone_configs (
    tier_level, milestone_name, qualifying_sales_threshold,
    reward_title, reward_description, reward_type, image_url, active, version
) VALUES
(1, 'Rising Seller', 10, 'Appreciation Certificate & Sticker Pack', 'ODDSI appreciation certificate + exclusive sticker pack.', 'PHYSICAL_GIFT', '/images/rewards/tier1_certificate.png', TRUE, 1),
(2, 'Trusted Seller', 25, 'Exclusive ODESSI T-Shirt', 'One exclusive ODESSI T shirt as a gift.', 'PHYSICAL_GIFT', '/images/rewards/tier2_tshirt.png', TRUE, 1),
(3, 'Elite Seller', 50, 'Exclusive ODESSI Hoodie & Badge', 'One exclusive ODESSI hoodie + a trusted seller badge.', 'PHYSICAL_GIFT', '/images/rewards/tier3_hoodie.png', TRUE, 1),
(4, 'ODDSI Brand Ambassador', 100, 'Premium Gift Box & Ambassador Recognition', 'Exclusive premium gift box, ambassador recognition and early access to new drops.', 'PHYSICAL_GIFT', '/images/rewards/tier4_ambassador.png', TRUE, 1)
ON CONFLICT (tier_level) DO NOTHING;
