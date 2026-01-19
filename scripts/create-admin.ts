#!/usr/bin/env tsx
/**
 * CLI Script to create an admin user
 *
 * Usage:
 *   pnpm create-admin
 *   or
 *   tsx scripts/create-admin.ts
 */

import { getDb } from "../src/server/db";
import bcrypt from "bcryptjs";
import { adminUsers } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdmin() {
  console.log("\n🔧 Portal da Lembrança - Admin User Creator\n");

  try {
    const name = await question("Admin Name: ");
    const email = await question("Admin Email: ");
    const password = await question("Admin Password (min 6 chars): ");

    if (!name || !email || !password) {
      console.error("❌ All fields are required!");
      process.exit(1);
    }

    if (password.length < 6) {
      console.error("❌ Password must be at least 6 characters!");
      process.exit(1);
    }

    const db = await getDb();
    if (!db) {
      console.error("❌ Database not available");
      process.exit(1);
    }

    // Check if admin already exists
    const existing = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (existing.length > 0) {
      console.error(`❌ Admin with email ${email} already exists!`);
      process.exit(1);
    }

    // Create admin
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(adminUsers).values({
      name,
      email,
      passwordHash,
      isActive: true,
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Login at: /admin/login\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
