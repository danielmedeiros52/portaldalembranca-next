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

    if (sessionCookie) {
      const session = await sdk.verifySession(sessionCookie);
      if (session) {
        // Get user from database using openId from session
        const { getUserByOpenId } = await import("~/server/db");
        user = (await getUserByOpenId(session.openId)) ?? null;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures
    console.warn("[tRPC Context] Authentication failed:", error);
    user = null;
  }

  return {
    headers: opts.headers,
    user,
  };
}
