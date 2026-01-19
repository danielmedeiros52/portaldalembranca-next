import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/routers";
import { createContext } from "~/server/_core/context";
import { initCookieStore, getCookies } from "~/server/_core/cookie-store";

/**
 * tRPC API handler for Next.js
 * Handles all /api/trpc/* requests
 */
async function handler(req: NextRequest) {
  // Generate unique request ID
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Initialize cookie store for this request
  initCookieStore(requestId);

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createContext({
        headers: req.headers,
        requestId, // Pass requestId to context
      }),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

  // Get cookies that were added during the request
  const pendingCookies = getCookies(requestId);

  if (pendingCookies.length > 0) {
    console.log("🍪 Route handler: Found", pendingCookies.length, "cookies to set");

    // Create new response with Set-Cookie headers
    const headers = new Headers(response.headers);

    pendingCookies.forEach((cookie) => {
      const parts = [`${cookie.name}=${cookie.value}`];

      if (cookie.options.path) parts.push(`Path=${cookie.options.path}`);
      if (cookie.options.maxAge) parts.push(`Max-Age=${cookie.options.maxAge}`);
      if (cookie.options.sameSite) parts.push(`SameSite=${cookie.options.sameSite}`);
      if (cookie.options.httpOnly) parts.push('HttpOnly');
      if (cookie.options.secure) parts.push('Secure');

      const cookieString = parts.join('; ');
      console.log("🍪 Setting header:", cookieString.substring(0, 100) + '...');
      headers.append('Set-Cookie', cookieString);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}

export { handler as GET, handler as POST };
