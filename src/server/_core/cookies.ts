// Cookie options for Next.js (migrated from Express)

export interface SessionCookieOptions {
  domain?: string;
  httpOnly: boolean;
  path: string;
  sameSite: "strict" | "lax" | "none";
  secure: boolean;
}

export function getSessionCookieOptions(
  req?: any // In Next.js, we don't need the request to determine cookie options
): SessionCookieOptions {
  // In production (HTTPS), use secure cookies
  // In development (HTTP), don't use secure
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax", // Changed from "none" to "lax" for Next.js
    secure: isProduction,
  };
}
