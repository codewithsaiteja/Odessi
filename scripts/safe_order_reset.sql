-- ══════════════════════════════════════════════════════════════
-- SAFE PRODUCTION ORDER RESET
-- ══════════════════════════════════════════════════════════════

-- 1. Create backup tables before making destructive changes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        CREATE TABLE IF NOT EXISTS _backup_orders_20261006 AS SELECT * FROM orders;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        CREATE TABLE IF NOT EXISTS _backup_order_items_20261006 AS SELECT * FROM order_items;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        CREATE TABLE IF NOT EXISTS _backup_payments_20261006 AS SELECT * FROM payments;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_status_email_logs') THEN
        CREATE TABLE IF NOT EXISTS _backup_order_status_email_logs_20261006 AS SELECT * FROM order_status_email_logs;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_reservations') THEN
        CREATE TABLE IF NOT EXISTS _backup_inventory_reservations_20261006 AS SELECT * FROM inventory_reservations;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupon_usages') THEN
        CREATE TABLE IF NOT EXISTS _backup_coupon_usages_20261006 AS SELECT * FROM coupon_usages;
    END IF;
END $$;

-- 2. Preserve reviews: loosen foreign key on product_reviews if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_reviews') THEN
        ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS fk_product_reviews_order;
        ALTER TABLE product_reviews ALTER COLUMN order_id DROP NOT NULL;
        ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS uq_product_reviews_unique;
        ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_order 
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
        UPDATE product_reviews SET order_id = NULL;
    END IF;
END $$;

-- 3. Clear qualifying_order_id in referrals
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        UPDATE referrals SET qualifying_order_id = NULL;
    END IF;
END $$;

-- 4. Delete dependent records specifically for orders
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_status_email_logs') THEN
        DELETE FROM order_status_email_logs;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupon_usages') THEN
        DELETE FROM coupon_usages;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_reservations') THEN
        DELETE FROM inventory_reservations;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        DELETE FROM payments;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        DELETE FROM order_items;
    END IF;

    -- 5. Delete the test orders themselves
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        DELETE FROM orders;
    END IF;

    -- 6. Reset ID sequences starting fresh at 1
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'orders_id_seq') THEN
        ALTER SEQUENCE orders_id_seq RESTART WITH 1;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'order_items_id_seq') THEN
        ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'payments_id_seq') THEN
        ALTER SEQUENCE payments_id_seq RESTART WITH 1;
    END IF;
END $$;
