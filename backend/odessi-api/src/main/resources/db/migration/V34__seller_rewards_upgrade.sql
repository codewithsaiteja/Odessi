-- ============================================================================
-- V34__seller_rewards_upgrade.sql
-- Upgrade Seller Rewards: Real Gift Images, Milestone Configurations & Fulfillment Tracking
-- ============================================================================

-- 1. Add image_url_snapshot column to seller_rewards to preserve immutable reward appearance
ALTER TABLE seller_rewards ADD COLUMN IF NOT EXISTS image_url_snapshot VARCHAR(255);

-- 2. Backfill existing rewards with the milestone image URL
UPDATE seller_rewards sr
SET image_url_snapshot = smc.image_url
FROM seller_milestone_configs smc
WHERE sr.milestone_config_id = smc.id
  AND sr.image_url_snapshot IS NULL;

-- 3. Update default milestone tiers with real gift names, descriptions, and WebP media paths
UPDATE seller_milestone_configs
SET reward_title = 'Exclusive ODESSI Matte Bracelet Set',
    reward_description = 'Custom matte-black ODESSI branded silicone band and velvet pouch with certificate.',
    image_url = '/sellers/gifts/milestone-10.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE tier_level = 1;

UPDATE seller_milestone_configs
SET reward_title = 'Exclusive ODESSI T-Shirt Gift Set',
    reward_description = 'Luxury matte box with custom tissue wrap containing an exclusive ODESSI tee.',
    image_url = '/sellers/gifts/milestone-25.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE tier_level = 2;

UPDATE seller_milestone_configs
SET reward_title = 'Luxury ODESSI Hoodie & Gift Box',
    reward_description = 'Premium heavyweight ODESSI French terry hoodie in luxury presentation packaging with VIP correspondence.',
    image_url = '/sellers/gifts/milestone-50.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE tier_level = 3;

UPDATE seller_milestone_configs
SET reward_title = 'ODDSI Brand Ambassador Luxury Hamper',
    reward_description = 'The complete luxury ambassador unboxing chest with hoodie, tee, stainless thermos, cap, socks, keychain, and gold membership recognition.',
    image_url = '/sellers/gifts/milestone-100.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE tier_level = 4;

-- 4. Ensure index on seller_rewards(milestone_config_id)
CREATE INDEX IF NOT EXISTS idx_seller_rewards_milestone_config ON seller_rewards(milestone_config_id);
