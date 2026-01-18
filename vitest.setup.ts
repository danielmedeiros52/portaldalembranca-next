import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
process.env.NODE_ENV = "test";
process.env.STRIPE_SECRET_KEY = "sk_test_mock_stripe_key_123456";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_mock_stripe_key_123456";

// Mock env module to avoid server-side environment check
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-at-least-32-characters-long",
    STRIPE_SECRET_KEY: "sk_test_mock_stripe_key_123456",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_mock_stripe_key_123456",
  },
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: "/",
    query: {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Next.js headers
vi.mock("next/headers", () => ({
  headers: () => new Headers(),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));
