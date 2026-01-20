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
    // Check funeral homes
    const homes = await sql`
      SELECT id, name, email, memorial_credits
      FROM funeral_homes
    `;

    console.log('\n=== Funeral Homes ===');
    homes.forEach(h => {
      console.log(`  ID: ${h.id} | ${h.name} (${h.email}) | Credits: ${h.memorial_credits}`);
    });

    // Check family users
    const familyUsers = await sql`
      SELECT id, name, email
      FROM family_users
      ORDER BY id DESC
      LIMIT 5
    `;

    console.log('\n=== Recent Family Users ===');
    familyUsers.forEach(u => {
      console.log(`  ID: ${u.id} | ${u.name} (${u.email})`);
    });

    // Check who owns the Arlindo memorial
    const memorial = await sql`
      SELECT id, full_name, funeral_home_id, family_user_id
      FROM memorials
      WHERE id = 626
    `;

    console.log('\n=== Arlindo Memorial ===');
    console.log(memorial[0]);

    console.log('\n=== Analysis ===');
    console.log('If user is logged in as Family User 13 (Demo):');
    console.log('  - They see "-" for credits because family users do not have credits');
    console.log('  - They can create unlimited memorials (no credit check)');
    console.log('  - Credit system only applies to Funeral Homes');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
