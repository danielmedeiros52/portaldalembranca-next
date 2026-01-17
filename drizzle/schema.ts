import { pgTable, serial, text, timestamp, varchar, boolean, integer, pgEnum } from "drizzle-orm/pg-core";

/**
 * Enums for PostgreSQL
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const visibilityEnum = pgEnum("visibility", ["public", "private"]);
export const statusEnum = pgEnum("status", ["active", "pending_data", "inactive"]);
export const productionStatusEnum = pgEnum("production_status", ["new", "in_production", "waiting_data", "ready", "delivered", "cancelled"]);
export const priorityEnum = pgEnum("priority", ["low", "normal", "high", "urgent"]);
export const leadStatusEnum = pgEnum("lead_status", ["pending", "contacted", "converted", "rejected"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * FuneralHome table for funeral home partners
 */
export const funeralHomes = pgTable("funeral_homes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FuneralHome = typeof funeralHomes.$inferSelect;
export type InsertFuneralHome = typeof funeralHomes.$inferInsert;

/**
 * FamilyUser table for family members managing memorials
 */
export const familyUsers = pgTable("family_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  invitationToken: varchar("invitation_token", { length: 255 }),
  invitationExpiry: timestamp("invitation_expiry"),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FamilyUser = typeof familyUsers.$inferSelect;
export type InsertFamilyUser = typeof familyUsers.$inferInsert;

/**
 * Memorial table for deceased individuals
 */
export const memorials = pgTable("memorials", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  birthDate: varchar("birth_date", { length: 10 }),
  deathDate: varchar("death_date", { length: 10 }),
  birthplace: varchar("birthplace", { length: 255 }),
  filiation: text("filiation"),
  biography: text("biography"),
  mainPhoto: varchar("main_photo", { length: 500 }),
  visibility: visibilityEnum("visibility").default("public").notNull(),
  status: statusEnum("status").default("pending_data").notNull(),
  funeralHomeId: integer("funeral_home_id"),
  familyUserId: integer("family_user_id"),
  isHistorical: boolean("is_historical").default(false).notNull(),
  category: varchar("category", { length: 100 }),
  graveLocation: varchar("grave_location", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Memorial = typeof memorials.$inferSelect;
export type InsertMemorial = typeof memorials.$inferInsert;

/**
 * Descendant table for children, grandchildren, etc.
 */
export const descendants = pgTable("descendants", {
  id: serial("id").primaryKey(),
  memorialId: integer("memorial_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  relationship: varchar("relationship", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Descendant = typeof descendants.$inferSelect;
export type InsertDescendant = typeof descendants.$inferInsert;

/**
 * Photo table for memorial gallery
 */
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  memorialId: integer("memorial_id").notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  caption: text("caption"),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

/**
 * Dedication table for messages/tributes
 */
export const dedications = pgTable("dedications", {
  id: serial("id").primaryKey(),
  memorialId: integer("memorial_id").notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Dedication = typeof dedications.$inferSelect;
export type InsertDedication = typeof dedications.$inferInsert;

/**
 * Leads table for invitation requests from landing page
 */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  acceptEmails: boolean("accept_emails").default(false).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, contacted, converted
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Orders table for production queue management
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  memorialId: integer("memorial_id").notNull(),
  funeralHomeId: integer("funeral_home_id").notNull(),
  familyUserId: integer("family_user_id"),
  productionStatus: productionStatusEnum("production_status").default("new").notNull(),
  priority: priorityEnum("priority").default("normal").notNull(),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order history table for tracking status changes
 */
export const orderHistory = pgTable("order_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  previousStatus: productionStatusEnum("previous_status"),
  newStatus: productionStatusEnum("new_status").notNull(),
  changedBy: varchar("changed_by", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderHistory = typeof orderHistory.$inferSelect;
export type InsertOrderHistory = typeof orderHistory.$inferInsert;

/**
 * Admin users table for system administrators
 */
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * Dashboard settings table for admin preferences
 */
export const dashboardSettings = pgTable("dashboard_settings", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull(),
  settingKey: varchar("setting_key", { length: 100 }).notNull(),
  settingValue: text("setting_value"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DashboardSetting = typeof dashboardSettings.$inferSelect;
export type InsertDashboardSetting = typeof dashboardSettings.$inferInsert;
