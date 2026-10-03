-- ============================================================================
-- V28: Secure Email OTP Password Recovery Challenges
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_reset_otp_challenges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    otp_salt VARCHAR(64) NOT NULL,
    reset_token_hash VARCHAR(255),
    failed_attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    otp_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reset_token_expires_at TIMESTAMP WITH TIME ZONE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    superseded BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_user_id ON password_reset_otp_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_email ON password_reset_otp_challenges(email);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_reset_token_hash ON password_reset_otp_challenges(reset_token_hash);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_active_lookup ON password_reset_otp_challenges(user_id, verified, consumed, superseded);
