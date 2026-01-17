-- Create leads table for invitation requests
CREATE TABLE IF NOT EXISTS "leads" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "phone" VARCHAR(20),
  "accept_emails" BOOLEAN DEFAULT false NOT NULL,
  "status" VARCHAR(50) DEFAULT 'pending' NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" ("status");
