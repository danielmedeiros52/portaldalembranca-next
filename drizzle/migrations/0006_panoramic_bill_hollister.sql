CREATE TYPE "public"."dedication_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "dedications" ADD COLUMN "status" "dedication_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "dedications" ADD COLUMN "reviewed_by" integer;--> statement-breakpoint
ALTER TABLE "dedications" ADD COLUMN "reviewed_at" timestamp;