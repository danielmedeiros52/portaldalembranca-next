import { getDb } from "~/server/db";
import { funeralHomes } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

async function addTestCredits() {
  console.log("Adding test credits to funeral homes...");

  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    // Add 3 credits to all funeral homes
    const result = await db
      .update(funeralHomes)
      .set({ memorialCredits: 3 })
      .returning({ id: funeralHomes.id, name: funeralHomes.name, email: funeralHomes.email, credits: funeralHomes.memorialCredits });

    console.log("\n✅ Credits added successfully!\n");
    console.log("Updated funeral homes:");
    result.forEach(home => {
      console.log(`  - ${home.name} (${home.email}): ${home.credits} credits`);
    });

    console.log("\n✨ You can now test creating memorials in the dashboard!");
    console.log("   Each memorial creation will decrement credits by 1.\n");

    process.exit(0);
  } catch (error) {
    console.error("Error adding credits:", error);
    process.exit(1);
  }
}

addTestCredits();
