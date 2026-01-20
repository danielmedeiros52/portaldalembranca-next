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
    console.log('\n=== Searching for Payment from danielmedeiros52@gmail.com ===\n');

    // Find all payment transactions
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
      WHERE customer_email = 'danielmedeiros52@gmail.com'
      ORDER BY "createdAt" DESC
    `;

    if (payments.length === 0) {
      console.log('❌ No payments found for danielmedeiros52@gmail.com');
      console.log('\nSearching all recent payments...\n');

      const allPayments = await sql`
        SELECT
          id,
          mp_payment_id,
          customer_email,
          amount,
          status,
          plan_id,
          "createdAt"
        FROM payment_transactions
        ORDER BY "createdAt" DESC
        LIMIT 10
      `;

      console.log('Recent payments:');
      console.table(allPayments);
    } else {
      console.log(`✅ Found ${payments.length} payment(s):\n`);
      console.table(payments);

      // Check if user exists
      const familyUser = await sql`
        SELECT id, name, email, family_id
        FROM family_users
        WHERE email = 'danielmedeiros52@gmail.com'
      `;

      console.log('\n=== User Account Status ===\n');
      if (familyUser.length === 0) {
        console.log('❌ No family_user account found for danielmedeiros52@gmail.com');
        console.log('   → User needs to register first');
      } else {
        console.log('✅ Family user found:');
        console.table(familyUser);

        // Check wallet
        const wallet = await sql`
          SELECT * FROM wallets
          WHERE owner_type = 'user' AND owner_id = ${familyUser[0].id}
        `;

        console.log('\n=== Wallet Status ===\n');
        if (wallet.length === 0) {
          console.log('❌ No wallet found - needs to be created');
        } else {
          console.log('✅ Wallet found:');
          console.table(wallet);
        }
      }

      // Calculate credits owed
      console.log('\n=== Credits Owed ===\n');
      const creditsByPlan = {
        essencial: 1,
        premium: 5,
        familia: 13,
      };

      let totalCreditsOwed = 0;
      payments.forEach(payment => {
        if (payment.status === 'succeeded' || payment.status === 'pending') {
          const credits = creditsByPlan[payment.plan_id] || 0;
          totalCreditsOwed += credits;
          console.log(`  - Payment ${payment.mp_payment_id}: ${payment.plan_id} = ${credits} credits (${payment.status})`);
        }
      });

      console.log(`\n📊 Total credits owed: ${totalCreditsOwed}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
