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

// Connect to database
const sql = postgres(envVars.DATABASE_URL || process.env.DATABASE_URL);

async function main() {
  try {
    console.log('\n=== Checking Current Memorial Credits ===\n');

    // Check current credits
    const homes = await sql`
      SELECT id, name, email, memorial_credits
      FROM funeral_homes
      ORDER BY id
    `;

    console.log('Current funeral homes:');
    homes.forEach(home => {
      console.log(`  - ID: ${home.id} | ${home.name} (${home.email}): ${home.memorial_credits ?? 'NULL'} credits`);
    });

    // Add 5 credits to all funeral homes
    console.log('\n=== Adding 5 Credits to All Funeral Homes ===\n');

    const updated = await sql`
      UPDATE funeral_homes
      SET memorial_credits = memorial_credits + 5
      RETURNING id, name, email, memorial_credits
    `;

    console.log('✅ Credits added successfully!\n');
    console.log('Updated funeral homes:');
    updated.forEach(home => {
      console.log(`  - ID: ${home.id} | ${home.name} (${home.email}): ${home.memorial_credits} credits`);
    });

    console.log('\n✨ You can now create memorials in the dashboard!');
    console.log('   Each memorial creation will decrement credits by 1.\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
