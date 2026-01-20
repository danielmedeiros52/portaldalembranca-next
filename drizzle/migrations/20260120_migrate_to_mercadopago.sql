-- Migration: Stripe to Mercado Pago
-- Date: 2026-01-20
-- Description: Rename Stripe columns to Mercado Pago equivalents and add PIX payment support

-- ====================
-- PAYMENT TRANSACTIONS TABLE
-- ====================

-- Rename Stripe columns to Mercado Pago equivalents
ALTER TABLE payment_transactions
  RENAME COLUMN stripe_payment_intent_id TO mp_payment_id;

ALTER TABLE payment_transactions
  RENAME COLUMN stripe_payment_method_id TO mp_payment_method_id;

-- Add PIX-specific columns
ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS pix_qr_code TEXT,
  ADD COLUMN IF NOT EXISTS pix_qr_code_base64 TEXT,
  ADD COLUMN IF NOT EXISTS pix_expiration_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS external_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notification_url TEXT;

-- Update constraints
ALTER TABLE payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_stripe_payment_intent_id_unique;

ALTER TABLE payment_transactions
  ADD CONSTRAINT payment_transactions_mp_payment_id_unique UNIQUE (mp_payment_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_mp_payment_id
  ON payment_transactions(mp_payment_id);

-- ====================
-- SUBSCRIPTIONS TABLE
-- ====================

-- Rename Stripe columns to Mercado Pago equivalents
ALTER TABLE subscriptions
  RENAME COLUMN stripe_customer_id TO mp_customer_id;

ALTER TABLE subscriptions
  RENAME COLUMN stripe_subscription_id TO mp_subscription_id;

-- Add index for Mercado Pago customer lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_customer_id
  ON subscriptions(mp_customer_id);

-- ====================
-- DATA VALIDATION (Optional)
-- ====================

-- Verify migration success
-- Run this after migration to confirm changes:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payment_transactions' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscriptions' ORDER BY ordinal_position;
