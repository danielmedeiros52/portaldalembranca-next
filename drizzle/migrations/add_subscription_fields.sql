-- Note: subscription_status enum already exists with values:
-- ('active', 'cancelled', 'expired', 'past_due', 'trialing')

-- Add subscription fields to funeral_homes table
ALTER TABLE funeral_homes
ADD COLUMN IF NOT EXISTS subscription_status "subscription_status" DEFAULT 'trialing' NOT NULL,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Set existing funeral homes to active subscription (grandfather clause)
UPDATE funeral_homes
SET subscription_status = 'active',
    subscription_expires_at = NOW() + INTERVAL '1 year'
WHERE subscription_expires_at IS NULL;
