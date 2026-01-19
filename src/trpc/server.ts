import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";

import { appRouter, type AppRouter } from "~/server/routers";
import { createContext } from "~/server/_core/context";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createTRPCContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createContext({
    headers: heads,
    requestId: "rsc", // RSC doesn't need cookie tracking
  });
});

const getQueryClient = cache(createQueryClient);
const caller = appRouter.createCaller(createTRPCContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
);
