import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MaintenanceGate } from "../maintenance-gate";

// Mock next/navigation
let currentPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

describe("MaintenanceGate Component (Phase K)", () => {
  beforeEach(() => {
    currentPathname = "/";
    vi.clearAllMocks();
  });

  it("renders children when maintenance is disabled", () => {
    render(
      <MaintenanceGate initialConfig={{ enabled: false }}>
        <div data-testid="app-content">Normal App</div>
      </MaintenanceGate>
    );

    expect(screen.getByTestId("app-content")).toBeDefined();
    expect(screen.queryByText(/mode pemeliharaan/i)).toBeNull();
  });

  it("renders MaintenanceView when maintenance is enabled on public routes", () => {
    currentPathname = "/";
    render(
      <MaintenanceGate
        initialConfig={{
          enabled: true,
          message: "Kami sedang melakukan migrasi database.",
        }}
      >
        <div data-testid="app-content">Normal App</div>
      </MaintenanceGate>
    );

    expect(screen.queryByTestId("app-content")).toBeNull();
    expect(screen.getByText(/mode pemeliharaan/i)).toBeDefined();
    expect(screen.getByText(/kami sedang melakukan migrasi database/i)).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("bypasses maintenance mode when accessing /admin", () => {
    currentPathname = "/admin";
    render(
      <MaintenanceGate
        initialConfig={{
          enabled: true,
          message: "Maintenance aktif untuk publik",
        }}
      >
        <div data-testid="admin-content">Admin Portal</div>
      </MaintenanceGate>
    );

    expect(screen.getByTestId("admin-content")).toBeDefined();
    expect(screen.queryByText(/mode pemeliharaan/i)).toBeNull();
  });

  it("handles undefined or missing initialConfig safely (fails open)", () => {
    render(
      <MaintenanceGate initialConfig={undefined}>
        <div data-testid="app-content">Normal App</div>
      </MaintenanceGate>
    );

    expect(screen.getByTestId("app-content")).toBeDefined();
    expect(screen.queryByText(/mode pemeliharaan/i)).toBeNull();
  });

  it("displays default fallback message when custom message is empty", () => {
    render(
      <MaintenanceGate initialConfig={{ enabled: true, message: "" }}>
        <div data-testid="app-content">Normal App</div>
      </MaintenanceGate>
    );

    expect(screen.getByText(/yomirra sedang dalam pemeliharaan sistem/i)).toBeDefined();
  });
});
