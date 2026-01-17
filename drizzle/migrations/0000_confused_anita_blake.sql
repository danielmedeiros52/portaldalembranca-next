CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'pending_data', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "dedications" (
	"id" serial PRIMARY KEY NOT NULL,
	"memorial_id" integer NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "descendants" (
	"id" serial PRIMARY KEY NOT NULL,
	"memorial_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"relationship" varchar(100) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255),
	"phone" varchar(20),
	"invitation_token" varchar(255),
	"invitation_expiry" timestamp,
	"is_active" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "funeral_homes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "funeral_homes_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "memorials" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"birth_date" varchar(10),
	"death_date" varchar(10),
	"birthplace" varchar(255),
	"filiation" text,
	"biography" text,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"status" "status" DEFAULT 'pending_data' NOT NULL,
	"funeral_home_id" integer NOT NULL,
	"family_user_id" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memorials_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"memorial_id" integer NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"caption" text,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
-- Seed data: Funeral Home for historical memorials
INSERT INTO "funeral_homes" ("name", "email", "password_hash", "phone", "address", "createdAt", "updatedAt")
VALUES (
	'Portal da Lembrança - Memoriais Históricos',
	'historicos@portaldalembranca.com.br',
	'$2a$10$placeholder_hash_for_historical_account',
	'(81) 0000-0000',
	'Recife, Pernambuco, Brasil',
	now(),
	now()
);
--> statement-breakpoint
-- Seed data: Historical Memorial - Chico Science
INSERT INTO "memorials" ("slug", "full_name", "birth_date", "death_date", "birthplace", "filiation", "biography", "visibility", "status", "funeral_home_id", "createdAt", "updatedAt")
VALUES (
	'chico-science',
	'Francisco de Assis França',
	'13/03/1966',
	'02/02/1997',
	'Recife, Pernambuco',
	'Filho de Severina Maia França e José Valdemar França',
	'Chico Science foi um cantor, compositor e líder da banda Chico Science & Nação Zumbi. Revolucionou a música brasileira ao criar o movimento manguebeat, fundindo ritmos regionais como maracatu e coco com rock, funk e hip hop. Sua obra influenciou gerações e colocou Recife no mapa da música mundial.',
	'public',
	'active',
	1,
	now(),
	now()
);
