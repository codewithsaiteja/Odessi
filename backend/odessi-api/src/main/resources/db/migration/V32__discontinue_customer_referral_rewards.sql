-- ══════════════════════════════════════════════════════════════════════
-- V32 — Discontinue customer referral & rewards scheme
--
-- Preserves all shared credit-ledger infrastructure, store credit accounts,
-- historical referrals, and immutable reward ledger rows.
-- Permanently disables referral_settings and zeroes out reward amounts.
-- ══════════════════════════════════════════════════════════════════════

UPDATE referral_settings
SET enabled = FALSE,
    referrer_reward_amount = 0.00,
    referee_reward_amount = 0.00,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'system_discontinue_referrals'
WHERE id = 1;
