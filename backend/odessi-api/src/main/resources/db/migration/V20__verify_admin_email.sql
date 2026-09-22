-- ══════════════════════════════════════════════════════════════
-- V20 — Verify Seeded Admin Email
-- ══════════════════════════════════════════════════════════════

-- Ensure seeded admin account has email_verified = TRUE
-- so AUTH_REQUIRE_EMAIL_VERIFICATION does not block production login
UPDATE users
SET email_verified = TRUE, updated_at = NOW()
WHERE email = 'admin@odessi.tfi';
