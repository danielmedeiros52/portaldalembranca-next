CREATE TYPE "public"."lead_status" AS ENUM('pending', 'contacted', 'converted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."production_status" AS ENUM('new', 'in_production', 'waiting_data', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "dashboard_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer NOT NULL,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(20),
	"accept_emails" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"previous_status" "production_status",
	"new_status" "production_status" NOT NULL,
	"changed_by" varchar(255),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"memorial_id" integer NOT NULL,
	"funeral_home_id" integer NOT NULL,
	"family_user_id" integer,
	"production_status" "production_status" DEFAULT 'new' NOT NULL,
	"priority" "priority" DEFAULT 'normal' NOT NULL,
	"notes" text,
	"internal_notes" text,
	"estimated_delivery" timestamp,
	"delivered_at" timestamp,
	"assigned_to" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memorials" ALTER COLUMN "funeral_home_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "memorials" ADD COLUMN "popular_name" varchar(255);--> statement-breakpoint
ALTER TABLE "memorials" ADD COLUMN "main_photo" varchar(500);--> statement-breakpoint
ALTER TABLE "memorials" ADD COLUMN "is_historical" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "memorials" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "memorials" ADD COLUMN "grave_location" varchar(255);