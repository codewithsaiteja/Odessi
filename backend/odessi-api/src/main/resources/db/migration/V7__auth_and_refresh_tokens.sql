-- ══════════════════════════════════════════════════════════════
-- V7 — Authentication and Refresh Tokens
-- ══════════════════════════════════════════════════════════════

-- 1. Add email_verified to users
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT        NOT NULL,
    token_hash    VARCHAR(255)  NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ   NOT NULL,
    revoked       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_used_at  TIMESTAMPTZ,
    
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens (token_hash);

-- 3. Password Reset Tokens Table
CREATE TABLE password_reset_tokens (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT        NOT NULL,
    token_hash    VARCHAR(255)  NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ   NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX idx_reset_tokens_hash ON password_reset_tokens (token_hash);

-- 4. Email Verification Tokens Table
CREATE TABLE email_verification_tokens (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT        NOT NULL,
    token_hash    VARCHAR(255)  NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ   NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_verification_tokens_user ON email_verification_tokens (user_id);
CREATE INDEX idx_verification_tokens_hash ON email_verification_tokens (token_hash);
