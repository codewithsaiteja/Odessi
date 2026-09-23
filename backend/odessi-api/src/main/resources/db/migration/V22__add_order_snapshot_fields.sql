-- ══════════════════════════════════════════════════════════════
-- V22 — Add immutable snapshot & payment tracking fields to orders
-- ══════════════════════════════════════════════════════════════

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill customer contact details from users table for existing orders
UPDATE orders o
SET 
    customer_email = u.email,
    customer_name = TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))
FROM users u
WHERE o.user_id = u.id AND o.customer_email IS NULL;

-- Backfill payment IDs from payments table for existing orders (e.g. Order #3)
UPDATE orders o
SET 
    razorpay_order_id = p.provider_order_id,
    razorpay_payment_id = p.provider_payment_id
FROM payments p
WHERE p.order_id = o.id AND (o.razorpay_order_id IS NULL OR o.razorpay_payment_id IS NULL);

-- Create performance indexes for lookup and reconciliation
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

COMMENT ON COLUMN orders.razorpay_order_id        IS 'Razorpay order ID snapshot (e.g. order_xxx)';
COMMENT ON COLUMN orders.razorpay_payment_id      IS 'Razorpay payment ID snapshot after capture (e.g. pay_xxx)';
COMMENT ON COLUMN orders.customer_email           IS 'Customer email address snapshot at time of order';
COMMENT ON COLUMN orders.customer_name            IS 'Customer full name snapshot at time of order';
COMMENT ON COLUMN orders.confirmation_email_sent  IS 'Flag ensuring order confirmation email is sent exactly once';
