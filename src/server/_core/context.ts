import type { NextRequest } from "next/server";
import type { User } from "../../../drizzle/schema";
import { sdk } from "./sdk";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "~/shared/const";

export type TrpcContext = {
  headers: Headers;
  user: User | null;
};

export async function createContext(opts: {
  headers: Headers;
}): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get session cookie from Next.js cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    console.log("🍪 Context: Session cookie exists?", !!sessionCookie);

    if (sessionCookie) {
      const session = await sdk.verifySession(sessionCookie);
      console.log("🔐 Context: Session verified?", !!session, session?.openId);

      if (session) {
        // Get user from database using openId from session
        const { getUserByOpenId } = await import("~/server/db");
        user = (await getUserByOpenId(session.openId)) ?? null;
        console.log("👤 Context: User found?", !!user, user?.openId);
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
  };
}
