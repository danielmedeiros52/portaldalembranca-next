"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import * as db from "~/server/db";
import { sdk } from "~/server/_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "~/shared/const";
import { getSessionCookieOptions } from "~/server/_core/cookies";

const FUNERAL_HOME_PREFIX = "funeral" as const;
const FAMILY_USER_PREFIX = "family" as const;

function buildAccountOpenId(prefix: string, id: number) {
  return `${prefix}-${id}`;
}

export async function loginFuneralHome(email: string, password: string) {
  try {
    const funeralHome = await db.getFuneralHomeByEmail(email);
    if (!funeralHome) {
      return { success: false, error: "E-mail ou senha inválidos" };
    }

    const isPasswordValid = await bcrypt.compare(password, funeralHome.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "E-mail ou senha inválidos" };
    }

    const openId = buildAccountOpenId(FUNERAL_HOME_PREFIX, funeralHome.id);

    // Upsert user in database
    await db.upsertUser({
      openId,
      name: funeralHome.name || null,
      email: funeralHome.email ?? null,
      loginMethod: "funeral_home",
      lastSignedIn: new Date(),
    });

    // Create session token
    const token = await sdk.createSessionToken(openId, {
      name: funeralHome.name,
      expiresInMs: ONE_YEAR_MS,
    });

    // Set cookie
    const cookieStore = await cookies();
    const cookieOptions = getSessionCookieOptions();

    cookieStore.set(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS / 1000,
    });

    return {
      success: true,
      user: {
        id: funeralHome.id,
        name: funeralHome.name,
        email: funeralHome.email,
        type: "funeral_home" as const,
      },
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Erro ao fazer login" };
  }
}

export async function loginFamilyUser(email: string, password: string) {
  try {
    const familyUser = await db.getFamilyUserByEmail(email);
    if (!familyUser || !familyUser.passwordHash) {
      return { success: false, error: "E-mail ou senha inválidos" };
    }

    const isPasswordValid = await bcrypt.compare(password, familyUser.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "E-mail ou senha inválidos" };
    }

    const openId = buildAccountOpenId(FAMILY_USER_PREFIX, familyUser.id);

    // Upsert user in database
    await db.upsertUser({
      openId,
      name: familyUser.name || null,
      email: familyUser.email ?? null,
      loginMethod: "family_user",
      lastSignedIn: new Date(),
    });

    // Create session token
    const token = await sdk.createSessionToken(openId, {
      name: familyUser.name,
      expiresInMs: ONE_YEAR_MS,
    });

    // Set cookie
    const cookieStore = await cookies();
    const cookieOptions = getSessionCookieOptions();

    cookieStore.set(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS / 1000,
    });

    return {
      success: true,
      user: {
        id: familyUser.id,
        name: familyUser.name,
        email: familyUser.email,
        type: "family_user" as const,
      },
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Erro ao fazer login" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return { success: true };
}

export async function registerFuneralHome(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}) {
  try {
    const { getDb } = await import("~/server/db");
    const { funeralHomes } = await import("../../../drizzle/schema");

    const existing = await db.getFuneralHomeByEmail(data.email);
    if (existing) {
      return { success: false, error: "E-mail já registrado" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const dbInstance = await getDb();
    if (!dbInstance) {
      return { success: false, error: "Banco de dados não disponível" };
    }

    await dbInstance.insert(funeralHomes).values({
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      address: data.address,
    });

    const newUser = await db.getFuneralHomeByEmail(data.email);
    if (!newUser) {
      return { success: false, error: "Falha ao criar usuário" };
    }

    const openId = buildAccountOpenId(FUNERAL_HOME_PREFIX, newUser.id);

    // Upsert user in database
    await db.upsertUser({
      openId,
      name: newUser.name || null,
      email: newUser.email ?? null,
      loginMethod: "funeral_home",
      lastSignedIn: new Date(),
    });

    // Create session token
    const token = await sdk.createSessionToken(openId, {
      name: newUser.name,
      expiresInMs: ONE_YEAR_MS,
    });

    // Set cookie
    const cookieStore = await cookies();
    const cookieOptions = getSessionCookieOptions();

    cookieStore.set(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS / 1000,
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        type: "funeral_home" as const,
      },
    };
  } catch (error: any) {
    console.error("Register error:", error);
    return { success: false, error: error.message || "Erro ao criar conta" };
  }
}

export async function registerFamilyUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  try {
    const { getDb } = await import("~/server/db");
    const { familyUsers } = await import("../../../drizzle/schema");

    const existing = await db.getFamilyUserByEmail(data.email);
    if (existing) {
      return { success: false, error: "E-mail já registrado" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const dbInstance = await getDb();
    if (!dbInstance) {
      return { success: false, error: "Banco de dados não disponível" };
    }

    await dbInstance.insert(familyUsers).values({
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      isActive: true,
    });

    const newUser = await db.getFamilyUserByEmail(data.email);
    if (!newUser) {
      return { success: false, error: "Falha ao criar usuário" };
    }

    const openId = buildAccountOpenId(FAMILY_USER_PREFIX, newUser.id);

    // Upsert user in database
    await db.upsertUser({
      openId,
      name: newUser.name || null,
      email: newUser.email ?? null,
      loginMethod: "family_user",
      lastSignedIn: new Date(),
    });

    // Create session token
    const token = await sdk.createSessionToken(openId, {
      name: newUser.name,
      expiresInMs: ONE_YEAR_MS,
    });

    // Set cookie
    const cookieStore = await cookies();
    const cookieOptions = getSessionCookieOptions();

    cookieStore.set(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS / 1000,
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        type: "family_user" as const,
      },
    };
  } catch (error: any) {
    console.error("Register error:", error);
    return { success: false, error: error.message || "Erro ao criar conta" };
  }
}
