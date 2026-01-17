import { eq, and, desc, count, sql, gte, lte, isNull, or, like, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, funeralHomes, familyUsers, memorials, descendants, photos, dedications, leads, orders, orderHistory, adminUsers, FuneralHome, FamilyUser, Memorial, Descendant, Photo, Dedication, Lead, Order, OrderHistory, AdminUser, InsertMemorial, InsertDescendant, InsertPhoto, InsertDedication, InsertLead, InsertOrder, InsertOrderHistory, InsertAdminUser } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL, { 
        max: 1,
        ssl: process.env.NODE_ENV === 'production' ? 'require' : false
      });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using onConflictDoUpdate
    await db.insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Funeral Home queries
export async function getFuneralHomeByEmail(email: string): Promise<FuneralHome | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(funeralHomes).where(eq(funeralHomes.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFuneralHomeById(id: number): Promise<FuneralHome | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(funeralHomes).where(eq(funeralHomes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Family User queries
export async function getFamilyUserByEmail(email: string): Promise<FamilyUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(familyUsers).where(eq(familyUsers.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFamilyUserById(id: number): Promise<FamilyUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(familyUsers).where(eq(familyUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFamilyUserByInvitationToken(token: string): Promise<FamilyUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(familyUsers).where(eq(familyUsers.invitationToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Memorial queries
export async function getMemorialsByFuneralHomeId(funeralHomeId: number): Promise<Memorial[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memorials).where(eq(memorials.funeralHomeId, funeralHomeId)).orderBy(desc(memorials.createdAt));
}

export async function getMemorialsByFamilyUserId(familyUserId: number): Promise<Memorial[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memorials).where(eq(memorials.familyUserId, familyUserId)).orderBy(desc(memorials.createdAt));
}

export async function getMemorialBySlug(slug: string): Promise<Memorial | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(memorials).where(eq(memorials.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMemorialById(id: number): Promise<Memorial | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(memorials).where(eq(memorials.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get all public active memorials
export async function getPublicMemorials(): Promise<Memorial[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memorials)
    .where(and(eq(memorials.status, 'active'), eq(memorials.visibility, 'public')))
    .orderBy(desc(memorials.createdAt));
}

// Descendant queries
export async function getDescendantsByMemorialId(memorialId: number): Promise<Descendant[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(descendants).where(eq(descendants.memorialId, memorialId));
}

// Photo queries
export async function getPhotosByMemorialId(memorialId: number): Promise<Photo[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photos).where(eq(photos.memorialId, memorialId)).orderBy(photos.order);
}

// Dedication queries
export async function getDedicationsByMemorialId(memorialId: number): Promise<Dedication[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dedications).where(eq(dedications.memorialId, memorialId)).orderBy(desc(dedications.createdAt));
}

// Lead queries
export async function createLead(lead: InsertLead): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    await db.insert(leads).values(lead);
    // Get the created lead by email (since we just inserted it)
    const result = await db.select().from(leads).where(eq(leads.email, lead.email)).orderBy(desc(leads.createdAt)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to create lead:", error);
    throw error;
  }
}

export async function getLeadByEmail(email: string): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.email, email)).orderBy(desc(leads.createdAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllLeads(): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function updateLead(id: number, data: Partial<Lead>): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(leads).set(data).where(eq(leads.id, id));
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// ADMIN MODULE - Orders & Production Queue
// ============================================

// Order queries
export async function getAllOrders(): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByStatus(status: string): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.productionStatus, status as any)).orderBy(desc(orders.createdAt));
}

export async function createOrder(order: InsertOrder): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    await db.insert(orders).values(order);
    const result = await db.select().from(orders).where(eq(orders.memorialId, order.memorialId)).orderBy(desc(orders.createdAt)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to create order:", error);
    throw error;
  }
}

export async function updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id));
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteOrder(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(orders).where(eq(orders.id, id));
  return true;
}

// Order History queries
export async function getOrderHistory(orderId: number): Promise<OrderHistory[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderHistory).where(eq(orderHistory.orderId, orderId)).orderBy(desc(orderHistory.createdAt));
}

export async function createOrderHistory(history: InsertOrderHistory): Promise<OrderHistory | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    await db.insert(orderHistory).values(history);
    const result = await db.select().from(orderHistory).where(eq(orderHistory.orderId, history.orderId)).orderBy(desc(orderHistory.createdAt)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to create order history:", error);
    throw error;
  }
}

// Admin User queries
export async function getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAdminUserById(id: number): Promise<AdminUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAdminUser(admin: InsertAdminUser): Promise<AdminUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    await db.insert(adminUsers).values(admin);
    const result = await db.select().from(adminUsers).where(eq(adminUsers.email, admin.email)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to create admin user:", error);
    throw error;
  }
}

export async function updateAdminLastLogin(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(adminUsers).set({ lastLogin: new Date(), updatedAt: new Date() }).where(eq(adminUsers.id, id));
}

// ============================================
// ADMIN DASHBOARD STATISTICS
// ============================================

export async function getAdminDashboardStats() {
  const db = await getDb();
  if (!db) return {
    totalMemorials: 0,
    activeMemorials: 0,
    pendingMemorials: 0,
    totalLeads: 0,
    pendingLeads: 0,
    totalOrders: 0,
    newOrders: 0,
    inProductionOrders: 0,
    waitingDataOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
    totalFuneralHomes: 0,
    totalFamilyUsers: 0,
  };

  const [memorialStats] = await db.select({
    total: count(),
    active: count(sql`CASE WHEN ${memorials.status} = 'active' THEN 1 END`),
    pending: count(sql`CASE WHEN ${memorials.status} = 'pending_data' THEN 1 END`),
  }).from(memorials);

  const [leadStats] = await db.select({
    total: count(),
    pending: count(sql`CASE WHEN ${leads.status} = 'pending' THEN 1 END`),
  }).from(leads);

  const [orderStats] = await db.select({
    total: count(),
    new: count(sql`CASE WHEN ${orders.productionStatus} = 'new' THEN 1 END`),
    inProduction: count(sql`CASE WHEN ${orders.productionStatus} = 'in_production' THEN 1 END`),
    waitingData: count(sql`CASE WHEN ${orders.productionStatus} = 'waiting_data' THEN 1 END`),
    ready: count(sql`CASE WHEN ${orders.productionStatus} = 'ready' THEN 1 END`),
    delivered: count(sql`CASE WHEN ${orders.productionStatus} = 'delivered' THEN 1 END`),
  }).from(orders);

  const [funeralHomeCount] = await db.select({ count: count() }).from(funeralHomes);
  const [familyUserCount] = await db.select({ count: count() }).from(familyUsers);

  return {
    totalMemorials: memorialStats?.total ?? 0,
    activeMemorials: memorialStats?.active ?? 0,
    pendingMemorials: memorialStats?.pending ?? 0,
    totalLeads: leadStats?.total ?? 0,
    pendingLeads: leadStats?.pending ?? 0,
    totalOrders: orderStats?.total ?? 0,
    newOrders: orderStats?.new ?? 0,
    inProductionOrders: orderStats?.inProduction ?? 0,
    waitingDataOrders: orderStats?.waitingData ?? 0,
    readyOrders: orderStats?.ready ?? 0,
    deliveredOrders: orderStats?.delivered ?? 0,
    totalFuneralHomes: funeralHomeCount?.count ?? 0,
    totalFamilyUsers: familyUserCount?.count ?? 0,
  };
}

// Get all memorials with related data for admin
export async function getAllMemorialsForAdmin(): Promise<Memorial[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memorials).orderBy(desc(memorials.createdAt));
}

// Get all funeral homes for admin
export async function getAllFuneralHomes(): Promise<FuneralHome[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(funeralHomes).orderBy(desc(funeralHomes.createdAt));
}

// Get all family users for admin
export async function getAllFamilyUsers(): Promise<FamilyUser[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(familyUsers).orderBy(desc(familyUsers.createdAt));
}
