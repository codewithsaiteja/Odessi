-- ══════════════════════════════════════════════════════════════════════
-- V31 — Odessi Store Credit Subsystem & Transaction Ledger
--
-- 1. store_credit_accounts   — One account per customer, tracks spendable balance
-- 2. store_credit_transactions — Immutable transaction ledger for auditability
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Store Credit Accounts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_credit_accounts (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    available_balance   NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    lifetime_credited   NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    lifetime_debited    NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    version             BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_store_credit_balance CHECK (available_balance >= 0.00),
    CONSTRAINT chk_store_credit_credited CHECK (lifetime_credited >= 0.00),
    CONSTRAINT chk_store_credit_debited CHECK (lifetime_debited >= 0.00)
);

CREATE INDEX IF NOT EXISTS idx_store_credit_accounts_user ON store_credit_accounts(user_id);

-- ── 2. Store Credit Transaction Ledger ────────────────────────────────
CREATE TABLE IF NOT EXISTS store_credit_transactions (
    id                  BIGSERIAL PRIMARY KEY,
    account_id          BIGINT NOT NULL REFERENCES store_credit_accounts(id) ON DELETE CASCADE,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount              NUMERIC(10, 2) NOT NULL,
    balance_after       NUMERIC(10, 2) NOT NULL,
    transaction_type    VARCHAR(40) NOT NULL,
    reference_type      VARCHAR(40),
    reference_id        BIGINT,
    idempotency_key     VARCHAR(100) UNIQUE,
    description         VARCHAR(255),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_credit_tx_type CHECK (transaction_type IN ('REFERRAL_REWARD', 'CHECKOUT_REDEMPTION', 'ORDER_REFUND', 'ADMIN_ADJUSTMENT', 'REFERRAL_REVERSAL')),
    CONSTRAINT chk_credit_ref_type CHECK (reference_type IN ('REFERRAL', 'ORDER', 'ADMIN'))
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_account ON store_credit_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON store_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_idempotency ON store_credit_transactions(idempotency_key);
