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
    console.log('\n=== Checking Payment Status ===\n');

    // Find payments (case-insensitive)
    const payments = await sql`
      SELECT
        id,
        mp_payment_id,
        customer_email,
        amount,
        status,
        plan_id,
        "createdAt"
      FROM payment_transactions
      WHERE LOWER(customer_email) = 'danielmedeiros52@gmail.com'
      ORDER BY "createdAt" DESC
    `;

    console.log(`Found ${payments.length} payment(s):\n`);
    console.table(payments);

    // Check if user exists
    const familyUser = await sql`
      SELECT id, name, email, family_id
      FROM family_users
      WHERE LOWER(email) = 'danielmedeiros52@gmail.com'
    `;

    console.log('\n=== User Account ===\n');
    if (familyUser.length === 0) {
      console.log('❌ NO ACCOUNT EXISTS for danielmedeiros52@gmail.com');
      console.log('   Problem: User paid without registering!');
    } else {
      console.log('✅ User found:');
      console.table(familyUser);

      // Check wallet
      const wallet = await sql`
        SELECT * FROM wallets
        WHERE owner_type = 'user' AND owner_id = ${familyUser[0].id}
      `;

      console.log('\n=== Wallet Status ===\n');
      if (wallet.length === 0) {
        console.log('❌ No wallet exists');
      } else {
        console.log('Wallet:');
        console.table(wallet);
      }
    }

    // Calculate what should be credited
    console.log('\n=== Analysis ===\n');
    const creditsByPlan = {
      essencial: 1,
      premium: 5,
      familia: 13,
    };

    let totalCreditsOwed = 0;
    let totalPaid = 0;

    payments.forEach(payment => {
      if (payment.status === 'succeeded') {
        const credits = creditsByPlan[payment.plan_id] || 0;
        totalCreditsOwed += credits;
        totalPaid += payment.amount;
        console.log(`✓ Payment ID ${payment.mp_payment_id}: ${payment.plan_id} → ${credits} credit(s) (R$ ${(payment.amount / 100).toFixed(2)})`);
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   - Total paid: R$ ${(totalPaid / 100).toFixed(2)}`);
    console.log(`   - Credits owed: ${totalCreditsOwed}`);
    console.log(`   - Status: ${familyUser.length === 0 ? '❌ LOST PAYMENT - No account' : '⚠️ Need to add credits'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
