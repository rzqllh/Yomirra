import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminLayout } from "../admin-layout";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Admin Portal Component (<AdminLayout />)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading spinner when auth is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(<AdminLayout />);
    expect(screen.getByText(/memverifikasi kredensial admin/i)).toBeDefined();
  });

  it("should render Google Sign-In prompt when user is unauthenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(<AdminLayout />);
    expect(screen.getByText(/yomirra admin portal/i)).toBeDefined();
    expect(screen.getByText(/masuk dengan akun google/i)).toBeDefined();
  });

  it("should render Access Denied when user is not authorized as admin", async () => {
    const mockUser = {
      uid: "user-123",
      email: "user@example.com",
      getIdToken: vi.fn().mockResolvedValue("mock-token"),
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      status: 403,
      ok: false,
      json: async () => ({ error: "Forbidden" }),
    });

    render(<AdminLayout />);

    await waitFor(() => {
      expect(screen.getByText(/akses ditolak/i)).toBeDefined();
    });
  });

  it("should render full admin dashboard when user is authorized admin", async () => {
    const mockUser = {
      uid: "admin-123",
      email: "admin@yomirra.com",
      getIdToken: vi.fn().mockResolvedValue("valid-admin-token"),
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    // Mock 4 parallel calls: sources, reports, telemetry, site config
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          sources: [
            {
              id: "komikindo",
              name: "Komikindo",
              status: "HEALTHY",
              latencyMs: 120,
              mirrors: ["https://komikindo.ch"],
              lastCheckedAt: new Date().toISOString(),
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          reports: [
            {
              id: "rep-1",
              sourceId: "komikindo",
              chapterId: "ch-10",
              reason: "Gambar rusak",
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          telemetry: {
            usedMemory: "12.5M",
            uptimeDays: 5,
            connectedClients: 2,
            totalSampledKeys: 15,
            status: "connected",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          config: {
            announcement: { enabled: true, message: "Server migration", type: "info" },
            maintenanceMode: { enabled: false },
            features: { pagedReaderEnabled: true },
          },
        }),
      });

    render(<AdminLayout />);

    await waitFor(() => {
      expect(screen.getByText(/admin ops/i)).toBeDefined();
      expect(screen.getAllByText(/source engine/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/keluhan reader/i).length).toBeGreaterThan(0);
    });
  });
});
