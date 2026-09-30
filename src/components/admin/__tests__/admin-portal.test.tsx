import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { AdminLayout } from "../admin-layout";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Admin Portal Component (<AdminLayout />)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/admin");
  });

  it("renders the explicit administrator gate when unauthenticated", async () => {
    render(<AdminLayout />);

    await waitFor(() => {
      expect(screen.getByText(/administrator gate/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/masukkan kunci akses admin/i)).toBeDefined();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("unlocks and renders the Yomirra Ink Ops navigation when the passkey is valid", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ sources: [] }),
    });

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
            totalSampledKeys: 10,
            status: "connected",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          config: {
            announcement: { enabled: false, message: "", type: "info" },
            maintenanceMode: { enabled: false },
          },
        }),
      });

    render(<AdminLayout />);

    const input = await screen.findByPlaceholderText(/masukkan kunci akses admin/i);
    fireEvent.change(input, { target: { value: "test-admin-key" } });
    fireEvent.click(screen.getByRole("button", { name: /buka operations portal/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/source health/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/reader reports/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/infrastructure/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/operational pulse/i).length).toBeGreaterThan(0);
    });
  });
});
