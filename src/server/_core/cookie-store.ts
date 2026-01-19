/**
 * Cookie store for tRPC responses
 * This is needed because Next.js cookies().set() doesn't work in tRPC procedures
 */

export type PendingCookie = {
  name: string;
  value: string;
  options: {
    httpOnly?: boolean;
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none';
    secure?: boolean;
    maxAge?: number;
  };
};

// Global store for pending cookies, keyed by unique request ID
const cookieStore = new Map<string, PendingCookie[]>();

export function initCookieStore(requestId: string) {
  cookieStore.set(requestId, []);
  console.log("🆔 Cookie store initialized for request:", requestId);
}

export function addCookie(requestId: string, cookie: PendingCookie) {
  const cookies = cookieStore.get(requestId);
  if (cookies) {
    console.log("🍪 Cookie store: Adding cookie", cookie.name, "to request", requestId);
    cookies.push(cookie);
  } else {
    console.warn("⚠️  Cookie store not found for request", requestId);
  }
}

export function getCookies(requestId: string): PendingCookie[] {
  const cookies = cookieStore.get(requestId) ?? [];
  console.log("🔍 Getting cookies for request", requestId, "- found", cookies.length, "cookies");
  // Clean up after retrieving
  cookieStore.delete(requestId);
  return cookies;
}
