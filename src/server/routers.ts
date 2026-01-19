import { COOKIE_NAME, ONE_YEAR_MS } from "~/shared/const";
import { getSessionCookieOptions } from "~/server/_core/cookies";
import { systemRouter } from "~/server/_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "~/server/_core/trpc";
import { z } from "zod";
import { getDb } from "~/server/db";
import { funeralHomes, familyUsers, memorials, descendants, photos, dedications, leads, orders, orderHistory, adminUsers } from "../../drizzle/schema";
import type { InsertMemorial, InsertDescendant, InsertPhoto, InsertDedication, InsertLead, InsertOrder, InsertOrderHistory, InsertAdminUser } from "../../drizzle/schema";
import * as db from "~/server/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateMemorialQRCode, generateMemorialQRCodeSVG } from "~/server/qrcode";
import { sdk } from "~/server/_core/sdk";
import { cookies } from "next/headers";

const FUNERAL_HOME_PREFIX = "funeral" as const;
const FAMILY_USER_PREFIX = "family" as const;
const ADMIN_USER_PREFIX = "admin" as const;

async function persistUserSession(
  ctx: any,
  payload: { openId: string; name: string; email?: string | null; loginMethod: string }
) {
  await db.upsertUser({
    openId: payload.openId,
    name: payload.name || null,
    email: payload.email ?? null,
    loginMethod: payload.loginMethod,
    lastSignedIn: new Date(),
  });

  const token = await sdk.createSessionToken(payload.openId, {
    name: payload.name,
    expiresInMs: ONE_YEAR_MS,
  });

  // Set session cookie using Next.js cookies() API
  const cookieStore = await cookies();
  const cookieOptions = getSessionCookieOptions();

  cookieStore.set(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS / 1000, // Convert milliseconds to seconds for maxAge
  });
}

function buildAccountOpenId(prefix: string, id: number) {
  return `${prefix}-${id}`;
}

// Helper to generate unique slug
function generateSlug(name: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name.toLowerCase().replace(/\s+/g, "-").substring(0, 20)}-${timestamp}-${random}`;
}

// Auth Router
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(async ({ ctx }) => {
    // Clear session cookie using Next.js cookies() API
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return { success: true } as const;
  }),

  // Funeral Home Login
  funeralHomeLogin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const funeralHome = await db.getFuneralHomeByEmail(input.email);
      if (!funeralHome) {
        throw new Error("E-mail ou senha inválidos");
      }
      const isPasswordValid = await bcrypt.compare(input.password, funeralHome.passwordHash);
      if (!isPasswordValid) {
        throw new Error("E-mail ou senha inválidos");
      }

      await persistUserSession(ctx, {
        openId: buildAccountOpenId(FUNERAL_HOME_PREFIX, funeralHome.id),
        name: funeralHome.name,
        email: funeralHome.email,
        loginMethod: "funeral_home",
      });

      return { id: funeralHome.id, name: funeralHome.name, email: funeralHome.email, type: "funeral_home" };
    }),

  // Funeral Home Register
  funeralHomeRegister: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getFuneralHomeByEmail(input.email);
      if (existing) {
        throw new Error("E-mail já registrado");
      }
      const passwordHash = await bcrypt.hash(input.password, 10);
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance.insert(funeralHomes).values({
        name: input.name,
        email: input.email,
        passwordHash,
        phone: input.phone,
        address: input.address,
      });

      const newUser = await db.getFuneralHomeByEmail(input.email);
      if (!newUser) throw new Error("Falha ao criar usuário");

      await persistUserSession(ctx, {
        openId: buildAccountOpenId(FUNERAL_HOME_PREFIX, newUser.id),
        name: newUser.name,
        email: newUser.email,
        loginMethod: "funeral_home",
      });

      return { id: newUser.id, name: newUser.name, email: newUser.email, type: "funeral_home" };
    }),

  // Family User Register
  familyUserRegister: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getFamilyUserByEmail(input.email);
      if (existing) {
        throw new Error("E-mail já registrado");
      }
      const passwordHash = await bcrypt.hash(input.password, 10);
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance.insert(familyUsers).values({
        name: input.name,
        email: input.email,
        passwordHash,
        phone: input.phone,
        isActive: true,
      });

      const newUser = await db.getFamilyUserByEmail(input.email);
      if (!newUser) throw new Error("Falha ao criar usuário");

      await persistUserSession(ctx, {
        openId: buildAccountOpenId(FAMILY_USER_PREFIX, newUser.id),
        name: newUser.name,
        email: newUser.email,
        loginMethod: "family_user",
      });

      return { id: newUser.id, name: newUser.name, email: newUser.email, type: "family_user" };
    }),

  // Family User Login
  familyUserLogin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const familyUser = await db.getFamilyUserByEmail(input.email);
      if (!familyUser || !familyUser.passwordHash) {
        throw new Error("E-mail ou senha inválidos");
      }
      const isPasswordValid = await bcrypt.compare(input.password, familyUser.passwordHash);
      if (!isPasswordValid) {
        throw new Error("E-mail ou senha inválidos");
      }

      await persistUserSession(ctx, {
        openId: buildAccountOpenId(FAMILY_USER_PREFIX, familyUser.id),
        name: familyUser.name,
        email: familyUser.email,
        loginMethod: "family_user",
      });

      return { id: familyUser.id, name: familyUser.name, email: familyUser.email, type: "family_user" };
    }),

  // Accept Family Invitation
  acceptInvitation: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const familyUser = await db.getFamilyUserByInvitationToken(input.token);
      if (!familyUser) {
        throw new Error("Convite inválido ou expirado");
      }
      if (familyUser.invitationExpiry && new Date(familyUser.invitationExpiry) < new Date()) {
        throw new Error("O convite expirou");
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance.update(familyUsers).set({
        passwordHash,
        isActive: true,
        invitationToken: null,
        invitationExpiry: null,
      }).where(eq(familyUsers.id, familyUser.id));

      return { success: true };
    }),
});

// Memorial Router
const memorialRouter = router({
  // Get all public active memorials (for public listing page)
  getPublicMemorials: publicProcedure
    .query(async () => {
      return db.getPublicMemorials();
    }),

  // Get all historical memorials (public and active)
  getHistoricMemorials: publicProcedure
    .query(async () => {
      return db.getHistoricMemorials();
    }),

  // Debug: Get all historical memorials (any status/visibility)
  debugAllHistorical: publicProcedure
    .query(async () => {
      return db.getAllHistoricalMemorials();
    }),

  // Debug: Get all memorials
  debugAll: publicProcedure
    .query(async () => {
      return db.getAllMemorials();
    }),

  // List memorials for current user (auto-detects user type)
  list: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Não autenticado");
      }

      // Check if user is a funeral home (openId starts with "funeral-")
      if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
        const funeralHomeId = parseInt(ctx.user.openId.split("-")[1] || "0");
        return db.getMemorialsByFuneralHomeId(funeralHomeId);
      }

      // Check if user is a family user (openId starts with "family-")
      if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        const familyUserId = parseInt(ctx.user.openId.split("-")[1] || "0");
        return db.getMemorialsByFamilyUserId(familyUserId);
      }

      // If neither, return empty array
      return [];
    }),

  // Get memorials by funeral home
  getByFuneralHome: protectedProcedure
    .input(z.object({ funeralHomeId: z.number() }))
    .query(async ({ input }) => {
      return db.getMemorialsByFuneralHomeId(input.funeralHomeId);
    }),

  // Get memorials by family user
  getByFamilyUser: protectedProcedure
    .input(z.object({ familyUserId: z.number() }))
    .query(async ({ input }) => {
      return db.getMemorialsByFamilyUserId(input.familyUserId);
    }),

  // Get memorial by slug (public)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const memorial = await db.getMemorialBySlug(input.slug);
      if (!memorial) throw new Error("Memorial não encontrado");
      if (memorial.visibility === "private") {
        throw new Error("Este memorial é privado");
      }
      return memorial;
    }),

  // Get memorial by ID (protected)
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getMemorialById(input.id);
    }),

  // Create memorial (funeral home only)
  create: protectedProcedure
    .input(z.object({
      fullName: z.string().min(1),
      birthDate: z.string().optional(),
      deathDate: z.string().optional(),
      birthplace: z.string().optional(),
      familyEmail: z.string().email(),
      funeralHomeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      // Get or create family user
      let familyUser = await db.getFamilyUserByEmail(input.familyEmail);
      let familyUserId: number;

      if (!familyUser) {
        const invitationToken = crypto.randomBytes(32).toString("hex");
        const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await dbInstance.insert(familyUsers).values({
          name: input.familyEmail.split("@")[0] || input.familyEmail,
          email: input.familyEmail,
          invitationToken,
          invitationExpiry,
          isActive: false,
        });

        const newFamilyUser = await db.getFamilyUserByEmail(input.familyEmail);
        if (!newFamilyUser) throw new Error("Falha ao criar usuário da família");
        familyUserId = newFamilyUser.id;
      } else {
        familyUserId = familyUser.id;
      }

      const slug = generateSlug(input.fullName);
      await dbInstance.insert(memorials).values({
        slug,
        fullName: input.fullName,
        birthDate: input.birthDate,
        deathDate: input.deathDate,
        birthplace: input.birthplace,
        funeralHomeId: input.funeralHomeId,
        familyUserId,
        status: "pending_data",
        visibility: "public",
      });

      const createdMemorial = await db.getMemorialBySlug(slug);
      return { id: createdMemorial?.id, slug, familyUserId };
    }),

  // Update memorial
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      fullName: z.string().optional(),
      birthDate: z.string().optional(),
      deathDate: z.string().optional(),
      birthplace: z.string().optional(),
      filiation: z.string().optional(),
      biography: z.string().optional(),
      visibility: z.enum(["public", "private"]).optional(),
      status: z.enum(["active", "pending_data", "inactive"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      const { id, ...updateData } = input;
      await dbInstance.update(memorials).set(updateData).where(eq(memorials.id, id));
      return { success: true };
    }),

  // Generate QR code for memorial
  generateQRCode: publicProcedure
    .input(z.object({
      slug: z.string(),
      baseUrl: z.string(),
      format: z.enum(["png", "svg"]).default("png"),
    }))
    .query(async ({ input }) => {
      const memorialUrl = `${input.baseUrl}/m/${input.slug}`;
      try {
        if (input.format === "svg") {
          const svgCode = await generateMemorialQRCodeSVG(memorialUrl);
          return { success: true, qrCode: svgCode, format: "svg" };
        } else {
          const pngCode = await generateMemorialQRCode(memorialUrl);
          return { success: true, qrCode: pngCode, format: "png" };
        }
      } catch (error) {
        throw new Error("Falha ao gerar código QR");
      }
    }),
});

// Descendant Router
const descendantRouter = router({
  getByMemorial: publicProcedure
    .input(z.object({ memorialId: z.number() }))
    .query(async ({ input }) => {
      return db.getDescendantsByMemorialId(input.memorialId);
    }),

  create: protectedProcedure
    .input(z.object({
      memorialId: z.number(),
      name: z.string().min(1),
      relationship: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance.insert(descendants).values(input);
      const created = await db.getDescendantsByMemorialId(input.memorialId);
      return { success: true, count: created.length };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance.delete(descendants).where(eq(descendants.id, input.id));
      return { success: true };
    }),
});

// Photo Router
const photoRouter = router({
  getByMemorial: publicProcedure
    .input(z.object({ memorialId: z.number() }))
    .query(async ({ input }) => {
      return db.getPhotosByMemorialId(input.memorialId);
    }),

  create: protectedProcedure
    .input(z.object({
      memorialId: z.number(),
      fileUrl: z.string(),
      caption: z.string().optional(),
      order: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance.insert(photos).values({
        ...input,
        order: input.order ?? 0,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance.delete(photos).where(eq(photos.id, input.id));
      return { success: true };
    }),
});

// Dedication Router
const dedicationRouter = router({
  getByMemorial: publicProcedure
    .input(z.object({ memorialId: z.number() }))
    .query(async ({ input }) => {
      return db.getDedicationsByMemorialId(input.memorialId);
    }),

  create: publicProcedure
    .input(z.object({
      memorialId: z.number(),
      authorName: z.string().min(1),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance.insert(dedications).values(input);
      return { success: true };
    }),
});

// Lead Router
const leadRouter = router({
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      email: z.string().email("E-mail inválido"),
      phone: z.string().optional(),
      acceptEmails: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      // Check if email already exists
      const existingLead = await db.getLeadByEmail(input.email);
      if (existingLead) {
        throw new Error("Este e-mail já foi cadastrado. Entraremos em contato em breve!");
      }

      // Create new lead
      const lead = await db.createLead({
        name: input.name,
        email: input.email,
        phone: input.phone,
        acceptEmails: input.acceptEmails,
        status: "pending",
      });

      if (!lead) {
        throw new Error("Erro ao salvar solicitação. Tente novamente.");
      }

      return { success: true, leadId: lead.id };
    }),

  getAll: protectedProcedure
    .query(async () => {
      return db.getAllLeads();
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateLead(id, data);
    }),
});

// ============================================
// ADMIN ROUTER - Administrative Module
// ============================================

const adminRouter = router({
  // Admin Login
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await db.getAdminUserByEmail(input.email);
      if (!admin) {
        throw new Error("E-mail ou senha inválidos");
      }
      if (!admin.isActive) {
        throw new Error("Conta desativada");
      }
      const isPasswordValid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!isPasswordValid) {
        throw new Error("E-mail ou senha inválidos");
      }

      await db.updateAdminLastLogin(admin.id);

      await persistUserSession(ctx, {
        openId: buildAccountOpenId(ADMIN_USER_PREFIX, admin.id),
        name: admin.name,
        email: admin.email,
        loginMethod: "admin",
      });

      return { id: admin.id, name: admin.name, email: admin.email, type: "admin" };
    }),

  // Create Admin User (for initial setup)
  createAdmin: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      setupKey: z.string(), // Simple security key for initial setup
    }))
    .mutation(async ({ input }) => {
      // Simple setup key validation (you can change this)
      if (input.setupKey !== "PORTAL_ADMIN_SETUP_2024") {
        throw new Error("Chave de configuração inválida");
      }
      
      const existing = await db.getAdminUserByEmail(input.email);
      if (existing) {
        throw new Error("E-mail já registrado");
      }
      
      const passwordHash = await bcrypt.hash(input.password, 10);
      const admin = await db.createAdminUser({
        name: input.name,
        email: input.email,
        passwordHash,
        isActive: true,
      });
      
      if (!admin) {
        throw new Error("Erro ao criar administrador");
      }
      
      return { success: true, id: admin.id };
    }),

  // Dashboard Statistics
  getDashboardStats: protectedProcedure
    .query(async () => {
      return db.getAdminDashboardStats();
    }),

  // Get all memorials for admin
  getAllMemorials: protectedProcedure
    .query(async () => {
      return db.getAllMemorialsForAdmin();
    }),

  // Get all funeral homes
  getAllFuneralHomes: protectedProcedure
    .query(async () => {
      return db.getAllFuneralHomes();
    }),

  // Get all family users
  getAllFamilyUsers: protectedProcedure
    .query(async () => {
      return db.getAllFamilyUsers();
    }),

  // Get all leads
  getAllLeads: protectedProcedure
    .query(async () => {
      return db.getAllLeads();
    }),

  // Update lead status
  updateLead: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateLead(id, data);
    }),

  // ============================================
  // ORDERS / PRODUCTION QUEUE
  // ============================================

  // Get all orders
  getAllOrders: protectedProcedure
    .query(async () => {
      return db.getAllOrders();
    }),

  // Get order by ID
  getOrderById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getOrderById(input.id);
    }),

  // Get orders by status
  getOrdersByStatus: protectedProcedure
    .input(z.object({ status: z.string() }))
    .query(async ({ input }) => {
      return db.getOrdersByStatus(input.status);
    }),

  // Create order
  createOrder: protectedProcedure
    .input(z.object({
      memorialId: z.number(),
      funeralHomeId: z.number(),
      familyUserId: z.number().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      notes: z.string().optional(),
      internalNotes: z.string().optional(),
      estimatedDelivery: z.string().optional(),
      assignedTo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const order = await db.createOrder({
        ...input,
        estimatedDelivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : undefined,
        productionStatus: "new",
      });
      
      if (order) {
        await db.createOrderHistory({
          orderId: order.id,
          newStatus: "new",
          changedBy: "Sistema",
          notes: "Pedido criado",
        });
      }
      
      return order;
    }),

  // Update order
  updateOrder: protectedProcedure
    .input(z.object({
      id: z.number(),
      productionStatus: z.enum(["new", "in_production", "waiting_data", "ready", "delivered", "cancelled"]).optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      notes: z.string().optional(),
      internalNotes: z.string().optional(),
      estimatedDelivery: z.string().optional(),
      assignedTo: z.string().optional(),
      changedBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, changedBy, ...data } = input;
      
      // Get current order to track status change
      const currentOrder = await db.getOrderById(id);
      
      const updateData: any = { ...data };
      if (data.estimatedDelivery) {
        updateData.estimatedDelivery = new Date(data.estimatedDelivery);
      }
      if (data.productionStatus === "delivered") {
        updateData.deliveredAt = new Date();
      }
      
      const order = await db.updateOrder(id, updateData);
      
      // Create history entry if status changed
      if (currentOrder && data.productionStatus && currentOrder.productionStatus !== data.productionStatus) {
        await db.createOrderHistory({
          orderId: id,
          previousStatus: currentOrder.productionStatus,
          newStatus: data.productionStatus,
          changedBy: changedBy || "Admin",
          notes: `Status alterado de ${currentOrder.productionStatus} para ${data.productionStatus}`,
        });
      }
      
      return order;
    }),

  // Delete order
  deleteOrder: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return db.deleteOrder(input.id);
    }),

  // Get order history
  getOrderHistory: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return db.getOrderHistory(input.orderId);
    }),
});

// Payment Router for Stripe integration
const paymentRouter = router({
  createPaymentIntent: publicProcedure
    .input(z.object({
      planId: z.string(),
      customerEmail: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const { createPaymentIntent } = await import('~/server/payments');
      return createPaymentIntent(input.planId, input.customerEmail || '');
    }),

  confirmPayment: publicProcedure
    .input(z.object({
      paymentIntentId: z.string(),
      paymentMethodId: z.string().startsWith("pm_", "Payment method ID must start with 'pm_'"),
    }))
    .mutation(async ({ input }) => {
      const { confirmPaymentWithPaymentMethod } = await import('~/server/payments');
      return confirmPaymentWithPaymentMethod(
        input.paymentIntentId,
        input.paymentMethodId
      );
    }),

  getPaymentStatus: publicProcedure
    .input(z.object({
      paymentIntentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { getPaymentIntentStatus } = await import('~/server/payments');
      return getPaymentIntentStatus(input.paymentIntentId);
    }),

  // Subscription management
  createSubscription: protectedProcedure
    .input(z.object({
      planId: z.string(),
      stripeCustomerId: z.string().optional(),
      stripeSubscriptionId: z.string().optional(),
      durationMonths: z.number().positive().default(12),
      memorialId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { createSubscription } = await import('~/server/payments');

      // Determine user type and ID from openId
      let userId: number;
      let userType: "funeral_home" | "family_user" | "oauth_user";

      if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
        userId = parseInt(ctx.user.openId.replace(FUNERAL_HOME_PREFIX + "-", ""));
        userType = "funeral_home";
      } else if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        userId = parseInt(ctx.user.openId.replace(FAMILY_USER_PREFIX + "-", ""));
        userType = "family_user";
      } else {
        // For OAuth users, we'd need to parse differently or store differently
        throw new Error("OAuth user subscriptions not yet implemented");
      }

      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + input.durationMonths);

      const subscriptionId = await createSubscription({
        userId,
        userType,
        planId: input.planId,
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        memorialId: input.memorialId,
      });

      return { subscriptionId };
    }),

  getMySubscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      const { getUserSubscriptions } = await import('~/server/payments');

      // Determine user type and ID from openId
      let userId: number;
      let userType: "funeral_home" | "family_user" | "oauth_user";

      if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
        userId = parseInt(ctx.user.openId.replace(FUNERAL_HOME_PREFIX + "-", ""));
        userType = "funeral_home";
      } else if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        userId = parseInt(ctx.user.openId.replace(FAMILY_USER_PREFIX + "-", ""));
        userType = "family_user";
      } else {
        throw new Error("OAuth user subscriptions not yet implemented");
      }

      return getUserSubscriptions(userId, userType);
    }),

  getPaymentTransaction: protectedProcedure
    .input(z.object({
      paymentIntentId: z.string(),
    }))
    .query(async ({ input }) => {
      const { getPaymentTransaction } = await import('~/server/payments');
      return getPaymentTransaction(input.paymentIntentId);
    }),

  cancelSubscription: protectedProcedure
    .input(z.object({
      subscriptionId: z.number(),
      cancelAtPeriodEnd: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new Error("Database not available");
      }

      const { subscriptions } = await import('../../drizzle/schema');

      await database
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: input.cancelAtPeriodEnd,
          status: input.cancelAtPeriodEnd ? "active" : "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, input.subscriptionId));

      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  memorial: memorialRouter,
  descendant: descendantRouter,
  photo: photoRouter,
  dedication: dedicationRouter,
  lead: leadRouter,
  admin: adminRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
