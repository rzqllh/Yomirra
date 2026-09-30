import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AdminLayout } from "../admin-layout";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Admin Portal Component (<AdminLayout />)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("should render Admin Passkey Gate when unauthenticated", async () => {
    render(<AdminLayout />);
    await waitFor(() => {
      expect(screen.getByText(/yomirra ops gate/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/masuk.*kunci akses admin/i)).toBeDefined();
    });
  });

  it("should unlock and render sidebar navigation when valid passkey is entered", async () => {
    // 1. Initial check for unlock attempt
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ sources: [] }),
    });

    // 2. Parallel 4 requests on dashboard load
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          sources: [
            {
              id: "komiku",
              name: "Komiku",
              status: "HEALTHY",
              latencyMs: 120,
              mirrors: [],
              isEnabled: true,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ reports: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          telemetry: {
            usedMemory: "12M",
            uptimeDays: 2,
            connectedClients: 1,
            status: "connected",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          config: {
            announcement: { enabled: false, message: "" },
            maintenanceMode: { enabled: false },
          },
        }),
      });

    render(<AdminLayout />);

    const input = await screen.findByPlaceholderText(/masuk.*kunci akses admin/i);
    fireEvent.change(input, { target: { value: "yomirra-ops-master-2026" } });

    const submitBtn = screen.getByText(/buka portal admin/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/admin ops v2.2/i)).toBeDefined();
      expect(screen.getAllByText(/source engine/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/ringkasan/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/telemetri/i).length).toBeGreaterThan(0);
    });
  });
});
