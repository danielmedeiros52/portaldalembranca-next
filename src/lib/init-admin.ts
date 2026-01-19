/**
 * Initialize default admin user from environment variables
 * This runs automatically on server startup
 */

import { env } from "~/env";
import { getDb } from "~/server/db";
import bcrypt from "bcryptjs";
import { adminUsers } from "drizzle/schema";
import { eq } from "drizzle-orm";

let adminInitialized = false;

export async function initializeDefaultAdmin() {
  // Only run once
  if (adminInitialized) {
    return;
  }

  // Skip if no admin credentials provided
  if (!env.DEFAULT_ADMIN_EMAIL || !env.DEFAULT_ADMIN_PASSWORD) {
    console.log("⚠️  No default admin credentials configured in .env");
    adminInitialized = true;
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Database not available for admin initialization");
      return;
    }

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, env.DEFAULT_ADMIN_EMAIL))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Default admin user already exists:", env.DEFAULT_ADMIN_EMAIL);
      adminInitialized = true;
      return;
    }

    // Create default admin user
    const passwordHash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, 10);

    await db.insert(adminUsers).values({
      name: env.DEFAULT_ADMIN_NAME || "Admin",
      email: env.DEFAULT_ADMIN_EMAIL,
      passwordHash,
      isActive: true,
    });

    console.log("✅ Default admin user created successfully!");
    console.log("   Email:", env.DEFAULT_ADMIN_EMAIL);
    console.log("   Password:", "******* (check your .env file)");
    console.log("   Login at: /admin/login");

    adminInitialized = true;
  } catch (error) {
    console.error("❌ Error initializing default admin:", error);
    // Don't throw - allow the app to continue starting
  }
}
