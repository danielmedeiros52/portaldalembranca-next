import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutPage from "./page";

// Mock the tRPC hooks
vi.mock("~/trpc/react", () => ({
  api: {
    payment: {
      createPaymentIntent: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({
            id: "pi_test",
            clientSecret: "secret_test",
            amount: 1990,
            currency: "brl",
            status: "requires_payment_method",
          }),
          isPending: false,
        }),
      },
      getPaymentStatus: {
        useQuery: () => ({
          data: { status: "succeeded" },
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
    loading: vi.fn(),
  },
}));

describe("Checkout Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render checkout page", () => {
    render(<CheckoutPage />);
    expect(screen.getByText(/Escolha seu plano/i)).toBeInTheDocument();
  });

  it("should display plan selection heading", () => {
    render(<CheckoutPage />);
    expect(screen.getByText(/Escolha seu plano/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Selecione o plano ideal para preservar suas memórias/i)
    ).toBeInTheDocument();
  });

  it("should render header with app title", () => {
    render(<CheckoutPage />);
    expect(screen.getByText(/Portal da Lembrança/i)).toBeInTheDocument();
  });

  it("should have back button in header", () => {
    render(<CheckoutPage />);
    const backButton = screen.getByRole("button", { name: /voltar/i });
    expect(backButton).toBeInTheDocument();
  });

  it("should have QR code icon in header", () => {
    render(<CheckoutPage />);
    const svg = document.querySelector(
      'svg[class*="lucide-qr-code"]'
    );
    expect(svg).toBeInTheDocument();
  });

  it("should render the page without errors", async () => {
    const { container } = render(<CheckoutPage />);
    expect(container).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/Escolha seu plano/i)).toBeInTheDocument();
    });
  });

  it("should have responsive layout", () => {
    const { container } = render(<CheckoutPage />);
    const mainElement = container.querySelector("main");
    expect(mainElement?.className).toContain("max-w-6xl");
  });
});
