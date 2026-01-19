/**
 * Script to mark prominent historical memorials as featured
 * Run with: tsx scripts/mark-featured-memorials.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { memorials } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

// Load environment variables from .env file
let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  try {
    const envFile = readFileSync(join(process.cwd(), ".env"), "utf8");
    const match = envFile.match(/DATABASE_URL=["']?([^\n"']+)["']?/);
    if (match) {
      DATABASE_URL = match[1];
    }
  } catch (error) {
    // .env file not found or error reading it
  }
}

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const featuredSlugs = [
  'joaquim-nabuco',                    // Major abolitionist, diplomat
  'miguel-arraes-de-alencar',          // Important political figure
  'francisco-de-assis-franca',         // Chico Science - Revolutionary musician
  'eduardo-henrique-accioly-campos'    // Eduardo Campos - Modern political figure
];

async function markFeaturedMemorials() {
  console.log("🚀 Starting featured memorials update...\n");

  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    console.log(`📝 Marking ${featuredSlugs.length} memorials as featured:`);
    featuredSlugs.forEach(slug => console.log(`   - ${slug}`));
    console.log();

    const result = await db
      .update(memorials)
      .set({ isFeatured: true })
      .where(inArray(memorials.slug, featuredSlugs))
      .returning({ slug: memorials.slug, fullName: memorials.fullName });

    console.log(`✅ Successfully updated ${result.length} memorials as featured:\n`);
    result.forEach(memorial => {
      console.log(`   ⭐ ${memorial.fullName} (${memorial.slug})`);
    });

    if (result.length < featuredSlugs.length) {
      console.log(`\n⚠️  Warning: Expected ${featuredSlugs.length} memorials but only updated ${result.length}`);
    }

  } catch (error) {
    console.error("❌ Error updating memorials:", error);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log("\n✨ Featured memorials update complete!");
}

markFeaturedMemorials();
