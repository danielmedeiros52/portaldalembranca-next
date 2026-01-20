-- Migration: Wallet System Implementation
-- Date: 2026-01-20
-- Description: Implement wallet system for credit management across users, families, and funeral homes

-- ====================
-- STEP 1: Create Enums
-- ====================

-- Wallet owner type enum
CREATE TYPE wallet_owner_type AS ENUM ('user', 'family', 'funeral_home');

-- Transfer status enum
CREATE TYPE transfer_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- ====================
-- STEP 2: Create Families Table
-- ====================

CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  admin_user_id INTEGER NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add foreign key to family_users (will be added after we update family_users table)
-- ALTER TABLE families ADD CONSTRAINT families_admin_user_id_fk FOREIGN KEY (admin_user_id) REFERENCES family_users(id);

-- ====================
-- STEP 3: Create Wallets Table
-- ====================

CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  owner_type wallet_owner_type NOT NULL,
  owner_id INTEGER NOT NULL,
  credits INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT wallets_unique_owner UNIQUE (owner_type, owner_id)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallets_owner ON wallets(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_wallets_credits ON wallets(credits);

-- ====================
-- STEP 4: Create Credit Transfers Table
-- ====================

CREATE TABLE IF NOT EXISTS credit_transfers (
  id SERIAL PRIMARY KEY,
  from_wallet_id INTEGER NOT NULL,
  to_wallet_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  transferred_by_user_id INTEGER NOT NULL,
  status transfer_status DEFAULT 'completed' NOT NULL,
  note TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT credit_transfers_from_wallet_fk FOREIGN KEY (from_wallet_id) REFERENCES wallets(id),
  CONSTRAINT credit_transfers_to_wallet_fk FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_credit_transfers_from_wallet ON credit_transfers(from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_to_wallet ON credit_transfers(to_wallet_id);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_status ON credit_transfers(status);

-- ====================
-- STEP 5: Migrate Existing Credits to Wallets
-- ====================

-- Create wallets for all existing funeral homes and migrate their credits
INSERT INTO wallets (owner_type, owner_id, credits, "createdAt", "updatedAt")
SELECT
  'funeral_home'::wallet_owner_type,
  id,
  COALESCE(memorial_credits, 0),
  NOW(),
  NOW()
FROM funeral_homes
ON CONFLICT (owner_type, owner_id) DO UPDATE
  SET credits = EXCLUDED.credits;

-- Create wallets for all existing family users and migrate their credits
INSERT INTO wallets (owner_type, owner_id, credits, "createdAt", "updatedAt")
SELECT
  'user'::wallet_owner_type,
  id,
  COALESCE(memorial_credits, 0),
  NOW(),
  NOW()
FROM family_users
ON CONFLICT (owner_type, owner_id) DO UPDATE
  SET credits = EXCLUDED.credits;

-- ====================
-- STEP 6: Update family_users Table
-- ====================

-- Add family_id column to family_users
ALTER TABLE family_users
  ADD COLUMN IF NOT EXISTS family_id INTEGER;

-- Add foreign key constraint to families table
ALTER TABLE family_users
  ADD CONSTRAINT family_users_family_id_fk FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_family_users_family_id ON family_users(family_id);

-- Drop memorial_credits column (data already migrated to wallets)
ALTER TABLE family_users
  DROP COLUMN IF EXISTS memorial_credits;

-- ====================
-- STEP 7: Update funeral_homes Table
-- ====================

-- Drop memorial_credits column (data already migrated to wallets)
ALTER TABLE funeral_homes
  DROP COLUMN IF EXISTS memorial_credits;

-- ====================
-- STEP 8: Add FK from families to family_users
-- ====================

-- Now we can safely add the foreign key from families to family_users
ALTER TABLE families
  ADD CONSTRAINT families_admin_user_id_fk FOREIGN KEY (admin_user_id) REFERENCES family_users(id);

-- ====================
-- VERIFICATION QUERIES (Run after migration)
-- ====================

-- Check wallets were created
-- SELECT owner_type, COUNT(*) FROM wallets GROUP BY owner_type;

-- Check credits were migrated
-- SELECT w.owner_type, w.owner_id, w.credits FROM wallets w WHERE w.credits > 0;

-- Check family_users have family_id column
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'family_users' AND column_name = 'family_id';

-- Check memorial_credits columns were dropped
-- SELECT column_name FROM information_schema.columns WHERE table_name IN ('funeral_homes', 'family_users') AND column_name = 'memorial_credits';
