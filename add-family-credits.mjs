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
    console.log('\n=== Adding Credits to Family Users ===\n');

    // Add 5 credits to family user ID 13 (Demo)
    const updated = await sql`
      UPDATE family_users
      SET memorial_credits = 5
      WHERE id = 13
      RETURNING id, name, email, memorial_credits
    `;

    console.log('✅ Credits added successfully!\n');
    console.log('Updated family user:');
    updated.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): ${user.memorial_credits} credits`);
    });

    console.log('\n✨ Refresh your dashboard to see the credits!');
    console.log('   You can now create memorials (each costs 1 credit).\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
