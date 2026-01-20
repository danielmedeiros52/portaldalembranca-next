import postgres from 'postgres';
import { readFileSync } from 'fs';

// Load .env file manually
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const sql = postgres(envVars.DATABASE_URL || process.env.DATABASE_URL);

async function main() {
  try {
    console.log('\n=== Wallet System Migration ===\n');

    // Step 1: Create enums
    console.log('[1/9] Creating enums...');
    try {
      await sql`CREATE TYPE wallet_owner_type AS ENUM ('user', 'family', 'funeral_home')`;
      await sql`CREATE TYPE transfer_status AS ENUM ('pending', 'completed', 'failed', 'cancelled')`;
      console.log('✅ Enums created');
    } catch (e) {
      console.log('⚠️  Enums may already exist');
    }

    // Step 2: Create families table
    console.log('[2/9] Creating families table...');
    await sql`
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        admin_user_id INTEGER NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Families table created');

    // Step 3: Create wallets table
    console.log('[3/9] Creating wallets table...');
    await sql`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        owner_type wallet_owner_type NOT NULL,
        owner_id INTEGER NOT NULL,
        credits INTEGER DEFAULT 0 NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT wallets_unique_owner UNIQUE (owner_type, owner_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_wallets_owner ON wallets(owner_type, owner_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wallets_credits ON wallets(credits)`;
    console.log('✅ Wallets table created');

    // Step 4: Create credit_transfers table
    console.log('[4/9] Creating credit_transfers table...');
    await sql`
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
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_credit_transfers_from_wallet ON credit_transfers(from_wallet_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_credit_transfers_to_wallet ON credit_transfers(to_wallet_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_credit_transfers_status ON credit_transfers(status)`;
    console.log('✅ Credit transfers table created');

    // Step 5: Migrate funeral home credits to wallets
    console.log('[5/9] Migrating funeral home credits...');
    const fhResult = await sql`
      INSERT INTO wallets (owner_type, owner_id, credits, "createdAt", "updatedAt")
      SELECT
        'funeral_home'::wallet_owner_type,
        id,
        COALESCE(memorial_credits, 0),
        NOW(),
        NOW()
      FROM funeral_homes
      ON CONFLICT (owner_type, owner_id) DO UPDATE
        SET credits = EXCLUDED.credits
      RETURNING owner_id, credits
    `;
    console.log(`✅ Migrated ${fhResult.length} funeral home wallets`);

    // Step 6: Migrate family user credits to wallets
    console.log('[6/9] Migrating family user credits...');
    const fuResult = await sql`
      INSERT INTO wallets (owner_type, owner_id, credits, "createdAt", "updatedAt")
      SELECT
        'user'::wallet_owner_type,
        id,
        COALESCE(memorial_credits, 0),
        NOW(),
        NOW()
      FROM family_users
      ON CONFLICT (owner_type, owner_id) DO UPDATE
        SET credits = EXCLUDED.credits
      RETURNING owner_id, credits
    `;
    console.log(`✅ Migrated ${fuResult.length} family user wallets`);

    // Step 7: Update family_users table
    console.log('[7/9] Updating family_users table...');
    await sql`ALTER TABLE family_users ADD COLUMN IF NOT EXISTS family_id INTEGER`;
    await sql`CREATE INDEX IF NOT EXISTS idx_family_users_family_id ON family_users(family_id)`;
    try {
      await sql`ALTER TABLE family_users ADD CONSTRAINT family_users_family_id_fk FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL`;
    } catch (e) {
      console.log('⚠️  FK constraint may already exist');
    }
    await sql`ALTER TABLE family_users DROP COLUMN IF EXISTS memorial_credits`;
    console.log('✅ Family users table updated');

    // Step 8: Update funeral_homes table
    console.log('[8/9] Updating funeral_homes table...');
    await sql`ALTER TABLE funeral_homes DROP COLUMN IF EXISTS memorial_credits`;
    console.log('✅ Funeral homes table updated');

    // Step 9: Add FK from families to family_users
    console.log('[9/9] Adding families constraints...');
    try {
      await sql`ALTER TABLE families ADD CONSTRAINT families_admin_user_id_fk FOREIGN KEY (admin_user_id) REFERENCES family_users(id)`;
    } catch (e) {
      console.log('⚠️  FK constraint may already exist');
    }
    console.log('✅ Families constraints added');

    console.log('\n=== Verification ===\n');

    // Verify wallets
    const walletStats = await sql`
      SELECT owner_type, COUNT(*) as count, SUM(credits) as total_credits
      FROM wallets
      GROUP BY owner_type
    `;
    console.log('Wallet Statistics:');
    console.table(walletStats);

    console.log('\n✨ Wallet system migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
