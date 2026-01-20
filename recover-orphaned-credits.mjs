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

/**
 * This script recovers credits from orphaned payments by:
 * 1. Finding all successful payments without credited accounts
 * 2. Checking if user has since registered
 * 3. Adding owed credits to their wallet
 */
async function main() {
  try {
    console.log('\n=== Orphaned Credits Recovery Tool ===\n');

    // Find all successful payments
    const allPayments = await sql`
      SELECT
        LOWER(customer_email) as email,
        COUNT(*) as payment_count,
        SUM(amount) as total_paid
      FROM payment_transactions
      WHERE status = 'succeeded'
      GROUP BY LOWER(customer_email)
      ORDER BY email DESC
    `;

    console.log(`Found ${allPayments.length} unique customers with successful payments\n`);

    const creditsByPlan = {
      essencial: 1,
      premium: 5,
      familia: 13,
    };

    let orphanedPayments = [];
    let recoveredCredits = 0;

    for (const paymentGroup of allPayments) {
      const email = paymentGroup.email;

      // Check if user exists
      const user = await sql`
        SELECT id, name, email, family_id
        FROM family_users
        WHERE LOWER(email) = ${email}
      `;

      if (user.length === 0) {
        // Orphaned payment - no account
        const payments = await sql`
          SELECT id, mp_payment_id, plan_id, amount, "createdAt"
          FROM payment_transactions
          WHERE LOWER(customer_email) = ${email}
            AND status = 'succeeded'
          ORDER BY "createdAt" DESC
        `;

        const totalCredits = payments.reduce((sum, p) => sum + (creditsByPlan[p.plan_id] || 0), 0);

        orphanedPayments.push({
          email,
          payments: payments.length,
          credits: totalCredits,
          amount: paymentGroup.total_paid,
        });

        console.log(`❌ ORPHANED: ${email}`);
        console.log(`   Payments: ${payments.length}`);
        console.log(`   Total: R$ ${(paymentGroup.total_paid / 100).toFixed(2)}`);
        console.log(`   Credits owed: ${totalCredits}\n`);

      } else {
        // User exists - check if they have a wallet
        const userId = user[0].id;

        // Get payments for this user
        const payments = await sql`
          SELECT id, mp_payment_id, plan_id, amount, "createdAt"
          FROM payment_transactions
          WHERE LOWER(customer_email) = ${email}
            AND status = 'succeeded'
          ORDER BY "createdAt" DESC
        `;

        const totalCreditsOwed = payments.reduce((sum, p) => sum + (creditsByPlan[p.plan_id] || 0), 0);

        // Get or create wallet
        let wallet = await sql`
          SELECT * FROM wallets
          WHERE owner_type = 'user' AND owner_id = ${userId}
        `;

        if (wallet.length === 0) {
          // Create wallet
          wallet = await sql`
            INSERT INTO wallets (owner_type, owner_id, credits, "createdAt", "updatedAt")
            VALUES ('user', ${userId}, 0, NOW(), NOW())
            RETURNING *
          `;
          console.log(`  Created wallet for ${email}`);
        }

        const currentCredits = wallet[0].credits;

        // Check if credits match what they paid for
        if (currentCredits < totalCreditsOwed) {
          const creditsToAdd = totalCreditsOwed - currentCredits;

          console.log(`⚠️  NEEDS RECOVERY: ${email}`);
          console.log(`   Current credits: ${currentCredits}`);
          console.log(`   Should have: ${totalCreditsOwed}`);
          console.log(`   Adding: ${creditsToAdd} credits`);

          // Add credits
          await sql`
            UPDATE wallets
            SET credits = credits + ${creditsToAdd}, "updatedAt" = NOW()
            WHERE id = ${wallet[0].id}
          `;

          console.log(`   ✅ Credits added!\n`);
          recoveredCredits += creditsToAdd;

        } else {
          console.log(`✅ OK: ${email} (${currentCredits} credits)\n`);
        }
      }
    }

    console.log('\n=== Summary ===\n');
    console.log(`Orphaned payments (no account): ${orphanedPayments.length}`);
    console.log(`Credits recovered: ${recoveredCredits}`);

    if (orphanedPayments.length > 0) {
      console.log('\n⚠️  ACTION REQUIRED for orphaned payments:\n');
      console.log('When these users register, run this script again to add their credits.');
      console.log('Alternatively, contact them to register and claim their credits.\n');

      console.table(orphanedPayments);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
