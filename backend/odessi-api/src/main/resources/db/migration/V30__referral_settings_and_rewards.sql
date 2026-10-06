-- ══════════════════════════════════════════════════════════════════════
-- V30 — Referral Settings (Admin-controlled) + Referral Reward Ledger
--
-- 1. referral_settings   — single-row admin configuration table
-- 2. referral_rewards    — immutable reward ledger (one row per qualified referral)
-- 3. Alter referrals     — add reward_amount snapshot column
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Referral Settings ─────────────────────────────────────────────
--
-- Single-row table enforced via id=1 convention (seeded below).
-- Admin can update, never insert a second row.
--
CREATE TABLE IF NOT EXISTS referral_settings (
    id                      INT PRIMARY KEY DEFAULT 1,
    enabled                 BOOLEAN NOT NULL DEFAULT TRUE,
    referrer_reward_amount  NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    referee_reward_amount   NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    minimum_order_value     NUMERIC(10, 2),
    reward_trigger          VARCHAR(50) NOT NULL DEFAULT 'ORDER_DELIVERED',
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by              VARCHAR(150),
    CONSTRAINT chk_referral_trigger CHECK (reward_trigger IN ('ORDER_DELIVERED', 'ORDER_PAID')),
    CONSTRAINT chk_single_row      CHECK (id = 1)
);

-- Seed with initial defaults (idempotent)
INSERT INTO referral_settings (id, enabled, referrer_reward_amount, referee_reward_amount, minimum_order_value, reward_trigger)
VALUES (1, TRUE, 100.00, 0.00, NULL, 'ORDER_DELIVERED')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Referral Reward Ledger ─────────────────────────────────────────
--
-- Each row is IMMUTABLE after creation — the reward_amount column records
-- the configured value AT THE TIME of qualification. Admin changes to
-- referral_settings do NOT retroactively change existing rows.
--
CREATE TABLE IF NOT EXISTS referral_rewards (
    id                  BIGSERIAL PRIMARY KEY,
    referral_id         BIGINT NOT NULL UNIQUE REFERENCES referrals(id) ON DELETE CASCADE,
    referrer_user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qualifying_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    code_used           VARCHAR(30) NOT NULL,
    reward_amount       NUMERIC(10, 2) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'ISSUED',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rewarded_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reward_status CHECK (status IN ('ISSUED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral ON referral_rewards(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status   ON referral_rewards(status);

-- ── 3. Add reward_amount snapshot to referrals ────────────────────────
--
-- Stores the reward amount that was active when this referral was qualified.
-- Populated by the service at qualification time; NULL while still PENDING.
--
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward_amount NUMERIC(10, 2);
