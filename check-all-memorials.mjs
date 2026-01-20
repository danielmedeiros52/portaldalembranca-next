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
    // Check all memorials
    const memorials = await sql`
      SELECT id, full_name, funeral_home_id, family_user_id, is_historical, "createdAt"
      FROM memorials
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    console.log('\nRecent Memorials:');
    memorials.forEach(m => {
      console.log(`  - ID: ${m.id} | ${m.full_name} | FH: ${m.funeral_home_id ?? 'NULL'} | Family: ${m.family_user_id ?? 'NULL'} | Historical: ${m.is_historical}`);
    });

    // Count by type
    const counts = await sql`
      SELECT
        CASE
          WHEN is_historical THEN 'Historical'
          WHEN funeral_home_id IS NOT NULL THEN 'Funeral Home'
          WHEN family_user_id IS NOT NULL THEN 'Family User'
          ELSE 'Unknown'
        END as type,
        COUNT(*) as count
      FROM memorials
      GROUP BY type
    `;

    console.log('\nCounts by type:');
    counts.forEach(c => {
      console.log(`  - ${c.type}: ${c.count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
