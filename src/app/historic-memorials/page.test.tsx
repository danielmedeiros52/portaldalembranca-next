import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import HistoricMemorialsPage from "./page";

// Mock the tRPC hooks
vi.mock("~/trpc/react", () => ({
  api: {
    memorial: {
      getHistoricMemorials: {
        useQuery: () => ({
          data: [
            {
              id: "1",
              slug: "test-memorial",
              popularName: "Test Name",
              fullName: "Test Full Name",
              birthDate: "1950-01-01",
              deathDate: "2020-01-01",
              birthPlace: "Rio de Janeiro, RJ",
              biography: "A great person from history",
            },
          ],
          isLoading: false,
          error: null,
        }),
      },
      debugAllHistorical: {
        useQuery: () => ({
          data: [],
          isLoading: false,
        }),
      },
      debugAll: {
        useQuery: () => ({
          data: [],
          isLoading: false,
        }),
      },
    },
  },
}));

describe("Historic Memorials Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render page with historic memorials heading", async () => {
    render(<HistoricMemorialsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Memoriais/i)).toBeInTheDocument();
      expect(screen.getByText(/Históricos/i)).toBeInTheDocument();
    });
  });

  it("should display page description about historic stories", async () => {
    render(<HistoricMemorialsPage />);
    await waitFor(() => {
      expect(
        screen.getByText(/Conheça as histórias e legados preservados/i)
      ).toBeInTheDocument();
    });
  });

  it("should display search input for searching memorials", async () => {
    render(<HistoricMemorialsPage />);
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Buscar/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it("should render without errors and show memorial data", async () => {
    const { container } = render(<HistoricMemorialsPage />);
    expect(container).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/Test Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Full Name/i)).toBeInTheDocument();
    });
  });

  it("should display memorial count when data loads", async () => {
    render(<HistoricMemorialsPage />);
    await waitFor(() => {
      expect(screen.getByText(/memorial encontrado/i)).toBeInTheDocument();
    });
  });

  it("should display memorial button to view complete memorial", async () => {
    render(<HistoricMemorialsPage />);
    await waitFor(() => {
      const viewButton = screen.getByText(/Ver Memorial Completo/i);
      expect(viewButton).toBeInTheDocument();
    });
  });
});
