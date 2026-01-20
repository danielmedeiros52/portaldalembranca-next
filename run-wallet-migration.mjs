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
    console.log('\n=== Running Wallet System Migration ===\n');

    // Read the migration SQL
    const migrationSQL = readFileSync('drizzle/migrations/20260120_wallet_system.sql', 'utf-8');

    // Split by statement (simple approach - might need refinement for complex SQL)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 5);

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      // Skip comment-only lines
      if (statement.match(/^--/)) continue;

      try {
        console.log(`[${i + 1}/${statements.length}] Executing...`);
        await sql.unsafe(statement + ';');
        console.log(`✅ Success`);
      } catch (error) {
        // Some errors are expected (like "type already exists")
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log(`⚠️  Skipped (${error.message.split('\n')[0]})`);
        } else {
          console.error(`❌ Error:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n=== Migration Completed! ===\n');

    // Verify the migration
    console.log('Verifying wallets...');
    const walletStats = await sql`
      SELECT owner_type, COUNT(*) as count, SUM(credits) as total_credits
      FROM wallets
      GROUP BY owner_type
    `;
    console.table(walletStats);

    console.log('\n✨ Wallet system is ready!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
