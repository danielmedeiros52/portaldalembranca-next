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

// Mock Stripe SDK
vi.mock("stripe", () => {
  const mockStripe = {
    paymentIntents: {
      create: vi.fn(async (params) => ({
        id: "pi_test_" + Math.random().toString(36).substr(2, 9),
        client_secret: "secret_test_" + Math.random().toString(36).substr(2, 9),
        amount: params.amount,
        currency: params.currency,
        status: "requires_payment_method",
        metadata: params.metadata,
        receipt_email: params.receipt_email,
      })),
      retrieve: vi.fn(async (id) => ({
        id,
        status: "requires_payment_method",
        amount: 1990,
        currency: "brl",
      })),
      confirm: vi.fn(async (id, params) => ({
        id,
        status: "succeeded",
        amount: 1990,
        currency: "brl",
      })),
    },
    paymentMethods: {
      create: vi.fn(async (params) => ({
        id: "pm_test_" + Math.random().toString(36).substr(2, 9),
        type: params.type,
        card: {
          last4: params.card?.number?.slice(-4),
          brand: "visa",
        },
      })),
    },
  };

  return {
    default: vi.fn(() => mockStripe),
  };
});
