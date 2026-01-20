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
    // Check funeral home credits
    const homes = await sql`
      SELECT id, name, email, memorial_credits
      FROM funeral_homes
      WHERE id = 1
    `;

    console.log('\nFuneral Home:', homes[0]);

    // Count memorials
    const memorials = await sql`
      SELECT COUNT(*) as count
      FROM memorials
      WHERE funeral_home_id = 1
    `;

    console.log('Memorials created:', memorials[0].count);
    console.log('\n✅ Expected credits: 5');
    console.log('✅ If user created 1 memorial with 0 credits, this is a bug');
    console.log('✅ After refresh, user should see 5 credits available\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
