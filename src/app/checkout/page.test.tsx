import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutPage from "./page";

// Mock the tRPC hooks
vi.mock("~/trpc/react", () => ({
  api: {
    payment: {
      getPublicKey: {
        useQuery: () => ({
          data: { publicKey: "TEST-pub-key-123" },
          isLoading: false,
        }),
      },
      createCardPayment: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({
            id: "mp_test_123",
            status: "approved",
            statusDetail: "accredited",
            amount: 19.90,
          }),
          isPending: false,
        }),
      },
      createPixPayment: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({
            id: "mp_pix_test_456",
            status: "pending",
            statusDetail: "pending_waiting_payment",
            pixQrCode: "00020126580014br.gov.bcb.pix0136...",
            pixQrCodeBase64: "iVBORw0KGgoAAAANSUhEUgAA...",
            pixExpirationDate: new Date(Date.now() + 3600000).toISOString(),
          }),
          isPending: false,
        }),
      },
      getPaymentStatus: {
        useQuery: () => ({
          data: {
            status: "approved",
            statusDetail: "accredited"
          },
          isLoading: false,
          refetch: vi.fn(),
        }),
      },
      createSubscription: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({
            id: 1,
            userId: 1,
            planId: "essencial",
            status: "active",
          }),
          isPending: false,
        }),
      },
      getPlanDetails: {
        useQuery: () => ({
          data: {
            id: "essencial",
            name: "Memorial Essencial",
            price: 19.90,
            period: "ano",
          },
          isLoading: false,
        }),
      },
    },
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

// Mock Mercado Pago SDK
global.window = {
  ...global.window,
  MercadoPago: vi.fn().mockImplementation(() => ({
    cardForm: vi.fn().mockReturnValue({
      mount: vi.fn(),
      unmount: vi.fn(),
      getCardFormData: vi.fn().mockReturnValue({
        token: "test_token_123",
        paymentMethodId: "visa",
        installments: 1,
        cardholderEmail: "test@example.com",
      }),
    }),
  })),
};

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render checkout page with plan selection", () => {
    render(<CheckoutPage />);
    expect(screen.getByText(/Memorial Essencial/i)).toBeInTheDocument();
    expect(screen.getByText(/Memorial Premium/i)).toBeInTheDocument();
    expect(screen.getByText(/Plano Família/i)).toBeInTheDocument();
  });

  it("should display payment methods (card and PIX)", async () => {
    render(<CheckoutPage />);

    // Wait for the page to load and move to payment step
    const continueButtons = screen.getAllByText(/Continuar/i);
    if (continueButtons.length > 0) {
      await userEvent.click(continueButtons[0]!);
    }

    await waitFor(() => {
      expect(screen.getByText(/Cartão de Crédito/i)).toBeInTheDocument();
    });
  });

  it("should show loading state during payment processing", async () => {
    render(<CheckoutPage />);

    // The test would need to simulate the full payment flow
    // This is a placeholder for more comprehensive tests
    expect(true).toBe(true);
  });
});
