import type { NextRequest } from "next/server";
import type { User } from "../../../drizzle/schema";
import { sdk } from "./sdk";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "~/shared/const";

export type TrpcContext = {
  headers: Headers;
  user: User | null;
  requestId: string;
};

export async function createContext(opts: {
  headers: Headers;
  requestId: string;
}): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Check for Authorization header first (admin sessions)
    const authHeader = opts.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log("🔑 Context: Found Authorization header");

      const session = await sdk.verifySession(token);
      if (session) {
        console.log("🔐 Context: Token verified for", session.openId);
        const { getUserByOpenId } = await import("~/server/db");
        user = (await getUserByOpenId(session.openId)) ?? null;
        console.log("👤 Context: User found?", !!user, user?.openId);
      }
    }

    // Fallback to session cookie if no Authorization header
    if (!user) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

      console.log("🍪 Context: Session cookie exists?", !!sessionCookie);

      if (sessionCookie) {
        const session = await sdk.verifySession(sessionCookie);
        console.log("🔐 Context: Session verified?", !!session, session?.openId);

        if (session) {
          const { getUserByOpenId } = await import("~/server/db");
          user = (await getUserByOpenId(session.openId)) ?? null;
          console.log("👤 Context: User found?", !!user, user?.openId);
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures
    console.error("❌ [tRPC Context] Authentication failed:", error);
    user = null;
  }

  return {
    headers: opts.headers,
    user,
    requestId: opts.requestId,
  };
}
