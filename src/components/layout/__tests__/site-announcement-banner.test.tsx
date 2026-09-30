import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SiteAnnouncementBanner } from "../site-announcement-banner";

describe("SiteAnnouncementBanner Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("should not render when announcement is disabled", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        announcement: { enabled: false, message: "" },
      }),
    });

    const { container } = render(<SiteAnnouncementBanner />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("should render message when announcement is enabled", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        announcement: {
          enabled: true,
          message: "Pemeliharaan terjadwal jam 02:00 WIB",
          type: "warning",
          id: "msg-1",
        },
      }),
    });

    render(<SiteAnnouncementBanner />);
    await waitFor(() => {
      expect(screen.getByText("Pemeliharaan terjadwal jam 02:00 WIB")).toBeDefined();
    });
  });

  it("should dismiss banner and persist to sessionStorage when close button clicked", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        announcement: {
          enabled: true,
          message: "Update fitur baru!",
          type: "info",
          id: "msg-2",
        },
      }),
    });

    render(<SiteAnnouncementBanner />);
    await waitFor(() => {
      expect(screen.getByText("Update fitur baru!")).toBeDefined();
    });

    const closeBtn = screen.getByLabelText("Tutup pengumuman");
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Update fitur baru!")).toBeNull();
    expect(sessionStorage.getItem("yomirra-dismissed-announcement")).toBe("msg-2");
  });

  it("should not render if already dismissed in sessionStorage", async () => {
    sessionStorage.setItem("yomirra-dismissed-announcement", "msg-already-dismissed");

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        announcement: {
          enabled: true,
          message: "Sudah pernah ditutup",
          type: "info",
          id: "msg-already-dismissed",
        },
      }),
    });

    const { container } = render(<SiteAnnouncementBanner />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
