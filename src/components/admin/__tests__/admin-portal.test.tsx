import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { AdminLayout } from "../admin-layout";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

describe("Admin Portal Component (<AdminLayout />)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/admin");
  });

  it("renders the explicit administrator gate when unauthenticated", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ authenticated: false, code: "invalid_token" }, 401),
    );

    render(<AdminLayout />);

    await waitFor(() => {
      expect(screen.getByText(/administrator gate/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/masukkan kunci akses admin/i)).toBeDefined();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/session");
  });

  it("unlocks and renders the Yomirra Ink Ops navigation when the passkey is valid", async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({ authenticated: false, code: "invalid_token" }, 401),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          authenticated: true,
          admin: { uid: "admin-key", method: "session" },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
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
      )
      .mockResolvedValueOnce(jsonResponse({ reports: [] }))
      .mockResolvedValueOnce(
        jsonResponse({
          telemetry: {
            usedMemory: "12M",
            uptimeDays: 2,
            connectedClients: 1,
            totalSampledKeys: 10,
            status: "connected",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          config: {
            announcement: { enabled: false, message: "", type: "info" },
            maintenanceMode: { enabled: false },
          },
        }),
      );

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

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey: "test-admin-key" }),
    });
  });
});
