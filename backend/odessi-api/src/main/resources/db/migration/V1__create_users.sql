-- ══════════════════════════════════════════════════════════════
-- V1 — Users and roles
-- ══════════════════════════════════════════════════════════════

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    first_name    VARCHAR(100)  NOT NULL,
    last_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(255)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    phone         VARCHAR(20),
    role          VARCHAR(20)   NOT NULL DEFAULT 'CUSTOMER',
    enabled       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('CUSTOMER', 'ADMIN'))
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);

COMMENT ON TABLE  users              IS 'Registered Odessi.tfi users';
COMMENT ON COLUMN users.email        IS 'Stored in lowercase — normalised at application layer';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hash only — NEVER plain text';
