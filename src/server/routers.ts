import { COOKIE_NAME, ONE_YEAR_MS } from "~/shared/const";
import { getSessionCookieOptions } from "~/server/_core/cookies";
import { systemRouter } from "~/server/_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "~/server/_core/trpc";
import { z } from "zod";
import { getDb } from "~/server/db";
import { funeralHomes, familyUsers, memorials, descendants, photos, dedications, leads, orders, orderHistory, adminUsers } from "../../drizzle/schema";
import type { InsertMemorial, InsertDescendant, InsertPhoto, InsertDedication, InsertLead, InsertOrder, InsertOrderHistory, InsertAdminUser } from "../../drizzle/schema";
import * as db from "~/server/db";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateMemorialQRCode, generateMemorialQRCodeSVG } from "~/server/qrcode";
import { sdk } from "~/server/_core/sdk";
import { cookies } from "next/headers";
import { initializeDefaultAdmin } from "~/lib/init-admin";
import { env } from "~/env";

const FUNERAL_HOME_PREFIX = "funeral" as const;
const FAMILY_USER_PREFIX = "family" as const;
const ADMIN_USER_PREFIX = "admin" as const;

// Initialize default admin on server startup
initializeDefaultAdmin().catch(console.error);

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

  console.log("🍪 Setting cookie:", COOKIE_NAME, "for openId:", payload.openId);

  // Add cookie to store so route handler can set it in response
  const { addCookie } = await import('~/server/_core/cookie-store');
  const cookieOptions = getSessionCookieOptions();

  // Get requestId from context (passed from route handler)
  const requestId = (ctx as any).requestId;
  console.log("📝 Using requestId from context:", requestId);

  addCookie(requestId, {
    name: COOKIE_NAME,
    value: token,
    options: {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS / 1000, // Convert milliseconds to seconds
    },
  });

  console.log("✅ Cookie added to store");
}

function buildAccountOpenId(prefix: string, id: number) {
  return `${prefix}-${id}`;
}

// Helper to generate unique slug
// Regular memorials: includes ID to avoid ambiguity (e.g., "maria-silva-123")
// Historical memorials: pretty slug without ID (e.g., "dom-pedro-ii")
function generateSlug(name: string, id?: number, isHistorical = false): string {
  const baseName = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();

  if (isHistorical) {
    // Historical memorials get pretty slugs (e.g., "dom-pedro-ii")
    return baseName.substring(0, 50);
  }

  // Regular memorials include ID to avoid ambiguity (e.g., "maria-silva-123")
  if (id) {
    return `${baseName.substring(0, 40)}-${id}`;
  }

  // Temporary slug before we have the ID
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `${baseName.substring(0, 30)}-tmp-${timestamp}-${random}`;
}

// Auth Router
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),

  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    // Funeral homes - check their wallet
    if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
      const funeralHomeId = parseInt(ctx.user.openId.split("-")[1] || "0");
      const funeralHome = await db.getFuneralHomeById(funeralHomeId);

      if (!funeralHome) return null;

      // Get wallet balance
      const walletBalance = await db.getWalletBalance('funeral_home', funeralHomeId);

      return {
        hasSubscription: true, // Keep for compatibility
        status: funeralHome.subscriptionStatus,
        expiresAt: funeralHome.subscriptionExpiresAt,
        isExpired: false,
        canCreateMemorials: walletBalance > 0,
        memorialCredits: walletBalance,
        personalWallet: walletBalance,
        familyWallet: null,
      };
    }

    // Family users - check personal wallet and family wallet (if member)
    if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
      const familyUserId = parseInt(ctx.user.openId.split("-")[1] || "0");
      const familyUser = await db.getFamilyUserById(familyUserId);

      if (!familyUser) return null;

      // Get personal wallet balance
      const personalWallet = await db.getWalletBalance('user', familyUserId);

      // Get family wallet balance (if user is in a family)
      let familyWallet = null;
      let familyId = null;
      if (familyUser.familyId) {
        familyWallet = await db.getWalletBalance('family', familyUser.familyId);
        familyId = familyUser.familyId;
      }

      // Total credits available = personal + family
      const totalCredits = personalWallet + (familyWallet || 0);

      return {
        hasSubscription: false,
        status: null,
        expiresAt: null,
        isExpired: false,
        canCreateMemorials: totalCredits > 0,
        memorialCredits: totalCredits,
        personalWallet,
        familyWallet,
        familyId,
      };
    }

    return null;
  }),

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

  // Get featured historical memorials (for homepage)
  getFeaturedHistoricMemorials: publicProcedure
    .query(async () => {
      return db.getFeaturedHistoricMemorials();
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

      console.log("🔍 memorial.list called by:", ctx.user.openId);

      // Check if user is an admin (openId starts with "admin-")
      if (ctx.user.openId.startsWith(ADMIN_USER_PREFIX + "-")) {
        console.log("✅ Admin detected, fetching all memorials");
        // Admins can see all memorials
        const allMemorials = await db.getAllMemorials();
        console.log("📊 Found", allMemorials.length, "total memorials");
        return allMemorials;
      }

      // Check if user is a funeral home (openId starts with "funeral-")
      if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
        console.log("🏢 Funeral home detected");
        const funeralHomeId = parseInt(ctx.user.openId.split("-")[1] || "0");
        return db.getMemorialsByFuneralHomeId(funeralHomeId);
      }

      // Check if user is a family user (openId starts with "family-")
      if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        console.log("👨‍👩‍👧‍👦 Family user detected");
        const familyUserId = parseInt(ctx.user.openId.split("-")[1] || "0");
        return db.getMemorialsByFamilyUserId(familyUserId);
      }

      console.log("⚠️ Unknown user type, returning empty array");
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

  // Create memorial (anyone can create)
  create: protectedProcedure
    .input(z.object({
      fullName: z.string().min(1),
      birthDate: z.string().optional(),
      deathDate: z.string().optional(),
      birthplace: z.string().optional(),
      funeralHomeId: z.number().optional(), // Optional - only if created by funeral home
    }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      if (!ctx.user) throw new Error("Não autenticado");

      let familyUserId: number | null = null;
      let funeralHomeId: number | null = input.funeralHomeId || null;
      let walletToDeduct: { type: 'user' | 'family' | 'funeral_home'; id: number; walletId: number } | null = null;

      // Determine who is creating the memorial and which wallet to use
      if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
        // Funeral home creating memorial
        funeralHomeId = parseInt(ctx.user.openId.split("-")[1] || "0");

        const funeralHome = await db.getFuneralHomeById(funeralHomeId);
        if (!funeralHome) throw new Error("Funerária não encontrada");

        // Check wallet balance
        const wallet = await db.getOrCreateWallet('funeral_home', funeralHomeId);
        if (!wallet || wallet.credits <= 0) {
          throw new Error("Você não possui créditos disponíveis. Compre créditos para criar novos memoriais.");
        }

        walletToDeduct = { type: 'funeral_home', id: funeralHomeId, walletId: wallet.id };

      } else if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        // Family user creating memorial
        familyUserId = parseInt(ctx.user.openId.split("-")[1] || "0");
        funeralHomeId = null;

        const familyUser = await db.getFamilyUserById(familyUserId);
        if (!familyUser) throw new Error("Usuário familiar não encontrado");

        // Check family wallet first (if user is in a family)
        let familyWallet = null;
        if (familyUser.familyId) {
          familyWallet = await db.getOrCreateWallet('family', familyUser.familyId);
        }

        // Check personal wallet
        const personalWallet = await db.getOrCreateWallet('user', familyUserId);

        // Prefer family wallet if available and has credits
        if (familyWallet && familyWallet.credits > 0) {
          walletToDeduct = { type: 'family', id: familyUser.familyId!, walletId: familyWallet.id };
        } else if (personalWallet && personalWallet.credits > 0) {
          walletToDeduct = { type: 'user', id: familyUserId, walletId: personalWallet.id };
        } else {
          throw new Error("Você não possui créditos disponíveis. Compre créditos para criar novos memoriais.");
        }

      } else {
        throw new Error("Tipo de usuário não suportado");
      }

      // Insert with temporary slug first
      const tempSlug = generateSlug(input.fullName);
      const [insertResult] = await dbInstance.insert(memorials).values({
        slug: tempSlug,
        fullName: input.fullName,
        birthDate: input.birthDate,
        deathDate: input.deathDate,
        birthplace: input.birthplace,
        funeralHomeId,
        familyUserId,
        status: "pending_data",
        visibility: "public",
        isHistorical: false, // Regular memorials are not historical
      }).returning({ id: memorials.id });

      const memorialId = insertResult?.id;
      if (!memorialId) throw new Error("Falha ao criar memorial");

      // Update with proper slug that includes the ID
      const finalSlug = generateSlug(input.fullName, memorialId, false);
      await dbInstance.update(memorials)
        .set({ slug: finalSlug })
        .where(eq(memorials.id, memorialId));

      // Deduct 1 credit from the appropriate wallet
      if (walletToDeduct) {
        const success = await db.updateWalletCredits(walletToDeduct.walletId, -1);
        if (!success) {
          console.error('[Memorial Creation] Failed to deduct credit from wallet');
          // Memorial was created but credit wasn't deducted - this is a critical error
          // In production, you might want to rollback the memorial creation
        }
      }

      return { id: memorialId, slug: finalSlug, familyUserId };
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

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      caption: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance.update(photos)
        .set({ caption: input.caption })
        .where(eq(photos.id, input.id));
      return { success: true };
    }),

  setAsMainPhoto: protectedProcedure
    .input(z.object({
      photoId: z.number(),
      memorialId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      // Get the photo URL
      const photo = await dbInstance.select().from(photos).where(eq(photos.id, input.photoId)).limit(1);
      if (photo.length === 0) throw new Error("Foto não encontrada");

      // Update memorial with new main photo
      await dbInstance.update(memorials)
        .set({ mainPhoto: photo[0]!.fileUrl })
        .where(eq(memorials.id, input.memorialId));

      return { success: true };
    }),

  setAsCover: protectedProcedure
    .input(z.object({
      photoId: z.number(),
      memorialId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      // First, unset any existing cover photo for this memorial
      await dbInstance.update(photos)
        .set({ isCover: false })
        .where(eq(photos.memorialId, input.memorialId));

      // Set the selected photo as cover
      await dbInstance.update(photos)
        .set({ isCover: true })
        .where(eq(photos.id, input.photoId));

      return { success: true };
    }),
});

// Dedication Router
const dedicationRouter = router({
  // Public: only get approved dedications
  getByMemorial: publicProcedure
    .input(z.object({ memorialId: z.number() }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return [];

      // Only return approved dedications for public view
      return dbInstance
        .select()
        .from(dedications)
        .where(
          and(
            eq(dedications.memorialId, input.memorialId),
            eq(dedications.status, "approved")
          )
        )
        .orderBy(desc(dedications.createdAt));
    }),

  // Protected: get pending dedications for review (family/admin only)
  getPending: protectedProcedure
    .input(z.object({ memorialId: z.number() }))
    .query(async ({ input, ctx }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return [];

      // Get pending dedications for this memorial
      return dbInstance
        .select()
        .from(dedications)
        .where(
          and(
            eq(dedications.memorialId, input.memorialId),
            eq(dedications.status, "pending")
          )
        )
        .orderBy(desc(dedications.createdAt));
    }),

  // Public: create new dedication (starts as pending)
  create: publicProcedure
    .input(z.object({
      memorialId: z.number(),
      authorName: z.string().min(1),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      // New dedications start as "pending" (default in schema)
      await dbInstance.insert(dedications).values(input);
      return {
        success: true,
        message: "Homenagem enviada! Ela será exibida após aprovação da família."
      };
    }),

  // Protected: approve dedication
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      // Get user ID for reviewedBy field
      let reviewerId = 0;
      if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
        reviewerId = parseInt(ctx.user.openId.split("-")[1] || "0");
      } else if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        reviewerId = parseInt(ctx.user.openId.split("-")[1] || "0");
      }

      await dbInstance
        .update(dedications)
        .set({
          status: "approved",
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        })
        .where(eq(dedications.id, input.id));

      return { success: true };
    }),

  // Protected: reject dedication
  reject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      // Get user ID for reviewedBy field
      let reviewerId = 0;
      if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
        reviewerId = parseInt(ctx.user.openId.split("-")[1] || "0");
      } else if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        reviewerId = parseInt(ctx.user.openId.split("-")[1] || "0");
      }

      await dbInstance
        .update(dedications)
        .set({
          status: "rejected",
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        })
        .where(eq(dedications.id, input.id));

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
    .query(async ({ ctx }) => {
      console.log("📧 lead.getAll called by:", ctx.user?.openId);
      const leads = await db.getAllLeads();
      console.log("📊 Found", leads.length, "leads");
      return leads;
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

      const adminOpenId = buildAccountOpenId(ADMIN_USER_PREFIX, admin.id);
      console.log("🔐 Admin login successful:", {
        adminId: admin.id,
        openId: adminOpenId,
        email: admin.email,
      });

      // Create session token
      const token = await sdk.createSessionToken(adminOpenId, {
        name: admin.name,
        expiresInMs: ONE_YEAR_MS,
      });

      // Upsert admin user in users table
      await db.upsertUser({
        openId: adminOpenId,
        name: admin.name,
        email: admin.email,
        loginMethod: "admin",
        lastSignedIn: new Date(),
      });

      console.log("✅ Admin session token created");

      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        type: "admin",
        token, // Return token to client
      };
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

  // Check if any active admin users exist (public for setup page)
  hasActiveAdmins: publicProcedure
    .query(async () => {
      const dbInstance = await getDb();
      if (!dbInstance) return false;

      const activeAdmins = await dbInstance
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.isActive, true))
        .limit(1);

      return activeAdmins.length > 0;
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

  // ============================================
  // HISTORICAL MEMORIALS MANAGEMENT
  // ============================================

  // Get all historical memorials
  getAllHistoricalMemorials: protectedProcedure
    .query(async ({ ctx }) => {
      console.log("🏛️ getAllHistoricalMemorials called by:", ctx.user?.openId);

      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      const historicals = await dbInstance
        .select()
        .from(memorials)
        .where(eq(memorials.isHistorical, true))
        .orderBy(memorials.fullName);

      console.log("📊 Found", historicals.length, "historical memorials");
      return historicals;
    }),

  // Toggle historical status
  toggleHistoricalStatus: protectedProcedure
    .input(z.object({
      memorialId: z.number(),
      isHistorical: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance
        .update(memorials)
        .set({ isHistorical: input.isHistorical, updatedAt: new Date() })
        .where(eq(memorials.id, input.memorialId));

      return { success: true };
    }),

  // Toggle featured status
  toggleFeaturedStatus: protectedProcedure
    .input(z.object({
      memorialId: z.number(),
      isFeatured: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      await dbInstance
        .update(memorials)
        .set({ isFeatured: input.isFeatured, updatedAt: new Date() })
        .where(eq(memorials.id, input.memorialId));

      return { success: true };
    }),

  // Bulk import historical memorials
  bulkImportMemorials: protectedProcedure
    .input(z.array(z.object({
      slug: z.string(),
      fullName: z.string(),
      popularName: z.string().optional(),
      birthDate: z.string().optional(),
      deathDate: z.string().optional(),
      birthplace: z.string().optional(),
      filiation: z.string().optional(),
      biography: z.string().optional(),
      mainPhoto: z.string().optional(),
      category: z.string().optional(),
      graveLocation: z.string().optional(),
      isHistorical: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
      visibility: z.enum(["public", "private"]).default("public"),
      status: z.enum(["active", "pending_data", "inactive"]).default("active"),
    })))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Banco de dados não disponível");

      const results = [];
      for (const memorial of input) {
        try {
          // Check if slug already exists
          const existing = await dbInstance
            .select()
            .from(memorials)
            .where(eq(memorials.slug, memorial.slug))
            .limit(1);

          if (existing.length > 0) {
            // Update existing memorial
            await dbInstance
              .update(memorials)
              .set({
                ...memorial,
                updatedAt: new Date(),
              })
              .where(eq(memorials.slug, memorial.slug));

            results.push({ slug: memorial.slug, status: "updated" });
          } else {
            // Insert new memorial
            await dbInstance.insert(memorials).values({
              ...memorial,
              funeralHomeId: null,
              familyUserId: null,
            });

            results.push({ slug: memorial.slug, status: "created" });
          }
        } catch (error) {
          results.push({
            slug: memorial.slug,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      return { success: true, results };
    }),
});

// Payment Router for Mercado Pago integration
const paymentRouter = router({
  // Get Mercado Pago public key for client-side SDK
  getPublicKey: publicProcedure
    .query(() => {
      return { publicKey: env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "" };
    }),

  // Create card payment with Mercado Pago
  createCardPayment: publicProcedure
    .input(z.object({
      planId: z.string(),
      cardToken: z.string().min(1, "Card token is required"),
      customerEmail: z.string().email(),
      paymentMethodId: z.string().min(1, "Payment method ID is required"),
      installments: z.number().int().min(1).max(12).default(1),
    }))
    .mutation(async ({ input }) => {
      const { createCardPayment } = await import('~/server/payments');
      return createCardPayment(
        input.planId,
        input.cardToken,
        input.customerEmail,
        input.paymentMethodId,
        input.installments
      );
    }),

  // Create PIX payment with Mercado Pago
  createPixPayment: publicProcedure
    .input(z.object({
      planId: z.string(),
      customerEmail: z.string().email(),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      cpf: z.string().regex(/^\d{11}$/, "CPF must be 11 digits"),
    }))
    .mutation(async ({ input }) => {
      const { createPixPayment } = await import('~/server/payments');
      return createPixPayment(
        input.planId,
        input.customerEmail,
        input.firstName,
        input.lastName,
        input.cpf
      );
    }),

  // Get payment status from Mercado Pago
  getPaymentStatus: publicProcedure
    .input(z.object({
      paymentId: z.string(),
    }))
    .query(async ({ input }) => {
      const { getPaymentStatus } = await import('~/server/payments');
      return getPaymentStatus(input.paymentId);
    }),

  // Get payment transaction from database
  getPaymentTransaction: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
    }))
    .query(async ({ input }) => {
      const { getPaymentTransaction } = await import('~/server/payments');
      return getPaymentTransaction(input.paymentId);
    }),

  // Get plan details
  getPlanDetails: publicProcedure
    .input(z.object({
      planId: z.string(),
    }))
    .query(async ({ input }) => {
      const { getPlanDetails } = await import('~/server/payments');
      return getPlanDetails(input.planId);
    }),

  // Subscription management
  createSubscription: protectedProcedure
    .input(z.object({
      planId: z.string(),
      mpCustomerId: z.string().optional(),
      mpSubscriptionId: z.string().optional(),
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
        mpCustomerId: input.mpCustomerId,
        mpSubscriptionId: input.mpSubscriptionId,
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

// Wallet Router - Credit management
const walletRouter = router({
  // Get wallet balance
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");

    let ownerType: 'user' | 'family' | 'funeral_home';
    let ownerId: number;

    if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
      ownerType = 'funeral_home';
      ownerId = parseInt(ctx.user.openId.split("-")[1] || "0");
    } else if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
      ownerType = 'user';
      ownerId = parseInt(ctx.user.openId.split("-")[1] || "0");
    } else {
      throw new Error("Unsupported user type");
    }

    const balance = await db.getWalletBalance(ownerType, ownerId);
    const wallet = await db.getOrCreateWallet(ownerType, ownerId);

    return {
      balance,
      walletId: wallet?.id,
    };
  }),

  // Get family wallet balance (if user is in a family)
  getFamilyBalance: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");

    if (!ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
      return null;
    }

    const userId = parseInt(ctx.user.openId.split("-")[1] || "0");
    const user = await db.getFamilyUserById(userId);

    if (!user || !user.familyId) {
      return null;
    }

    const balance = await db.getWalletBalance('family', user.familyId);
    const wallet = await db.getOrCreateWallet('family', user.familyId);

    return {
      balance,
      walletId: wallet?.id,
      familyId: user.familyId,
    };
  }),

  // Transfer credits between wallets
  transfer: protectedProcedure
    .input(z.object({
      toWalletId: z.number(),
      amount: z.number().min(1),
      note: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      // Determine source wallet
      let ownerType: 'user' | 'family' | 'funeral_home';
      let ownerId: number;
      let userId: number;

      if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
        ownerType = 'funeral_home';
        ownerId = parseInt(ctx.user.openId.split("-")[1] || "0");
        userId = ownerId;
      } else if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        ownerType = 'user';
        ownerId = parseInt(ctx.user.openId.split("-")[1] || "0");
        userId = ownerId;
      } else {
        throw new Error("Unsupported user type");
      }

      const fromWallet = await db.getOrCreateWallet(ownerType, ownerId);
      if (!fromWallet) throw new Error("Source wallet not found");

      // Perform transfer
      const result = await db.transferCredits(
        fromWallet.id,
        input.toWalletId,
        input.amount,
        userId,
        input.note
      );

      if (!result.success) {
        throw new Error(result.error || "Transfer failed");
      }

      return result;
    }),

  // Get transfer history
  getTransfers: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      let ownerType: 'user' | 'family' | 'funeral_home';
      let ownerId: number;

      if (ctx.user.openId.startsWith(FUNERAL_HOME_PREFIX + "-")) {
        ownerType = 'funeral_home';
        ownerId = parseInt(ctx.user.openId.split("-")[1] || "0");
      } else if (ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        ownerType = 'user';
        ownerId = parseInt(ctx.user.openId.split("-")[1] || "0");
      } else {
        throw new Error("Unsupported user type");
      }

      const wallet = await db.getOrCreateWallet(ownerType, ownerId);
      if (!wallet) throw new Error("Wallet not found");

      return db.getWalletTransfers(wallet.id, input.limit || 50);
    }),
});

// Family Router - Family group management
const familyRouter = router({
  // Create a new family
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      if (!ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
        throw new Error("Only family users can create families");
      }

      const userId = parseInt(ctx.user.openId.split("-")[1] || "0");

      // Check if user is already in a family
      const user = await db.getFamilyUserById(userId);
      if (user?.familyId) {
        throw new Error("You are already a member of a family");
      }

      const family = await db.createFamily(input.name, userId, input.description);
      if (!family) throw new Error("Failed to create family");

      return family;
    }),

  // Get family details
  getMyFamily: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");

    if (!ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
      return null;
    }

    const userId = parseInt(ctx.user.openId.split("-")[1] || "0");
    const user = await db.getFamilyUserById(userId);

    if (!user || !user.familyId) {
      return null;
    }

    const family = await db.getFamilyById(user.familyId);
    if (!family) return null;

    const members = await db.getFamilyMembers(user.familyId);
    const wallet = await db.getWalletBalance('family', user.familyId);

    return {
      ...family,
      members,
      walletBalance: wallet,
    };
  }),

  // Get family members
  getMembers: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");

    if (!ctx.user.openId.startsWith(FAMILY_USER_PREFIX + "-")) {
      return [];
    }

    const userId = parseInt(ctx.user.openId.split("-")[1] || "0");
    const user = await db.getFamilyUserById(userId);

    if (!user || !user.familyId) {
      return [];
    }

    return db.getFamilyMembers(user.familyId);
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
  wallet: walletRouter,
  family: familyRouter,
});

export type AppRouter = typeof appRouter;
