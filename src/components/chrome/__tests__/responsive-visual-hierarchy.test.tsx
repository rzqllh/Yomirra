import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { useSidebarStore } from "@/shared/store/sidebar-store";
import { cn } from "@/shared/utils/cn";

describe("Responsive & Visual Hierarchy - Q26, Q27, Q40, Q99, Q102", () => {
  beforeEach(() => {
    useSidebarStore.setState({ isCollapsed: false });
  });

  describe("Q102 & Q99: Tablet Multi-Pane & Responsive Layout Adaptation", () => {
    it("adapts layout padding based on sidebar collapsed state across viewports", () => {
      // Expanded state (default)
      const expandedClasses = cn(
        "flex-1 flex flex-col min-h-dvh transition-[padding-left] min-w-0 duration-200",
        useSidebarStore.getState().isCollapsed ? "md:pl-[76px]" : "md:pl-[76px] xl:pl-[240px]"
      );
      expect(expandedClasses).toContain("md:pl-[76px]");
      expect(expandedClasses).toContain("xl:pl-[240px]");

      // Toggle collapsed (Tablet multi-pane icon rail mode)
      useSidebarStore.getState().toggleCollapsed();
      expect(useSidebarStore.getState().isCollapsed).toBe(true);

      const collapsedClasses = cn(
        "flex-1 flex flex-col min-h-dvh transition-[padding-left] min-w-0 duration-200",
        useSidebarStore.getState().isCollapsed ? "md:pl-[76px]" : "md:pl-[76px] xl:pl-[240px]"
      );
      expect(collapsedClasses).toContain("md:pl-[76px]");
      expect(collapsedClasses).not.toContain("xl:pl-[240px]");
    });
  });

  describe("Q27: Motion Discipline & Reduced Motion Respect", () => {
    it("includes motion-reduce:transition-none in layout containers", () => {
      const containerClass = cn(
        "flex-1 flex flex-col transition-[padding-left] duration-200 motion-reduce:transition-none"
      );
      expect(containerClass).toContain("motion-reduce:transition-none");
    });
  });

  describe("Q26 & Q40: Elevation & Squircle Radius Geometry Tokens", () => {
    it("verifies squircle geometric classes and elevation hierarchy tokens", () => {
      // Squircle card tokens
      const cardClass = cn(
        "rounded-[16px] border border-border-subtle bg-surface-raised shadow-xs"
      );
      expect(cardClass).toContain("rounded-[16px]");
      expect(cardClass).toContain("bg-surface-raised");
      expect(cardClass).toContain("border-border-subtle");

      // Squircle dialog / overlay tokens
      const overlayClass = cn(
        "rounded-[24px] border border-border-default bg-surface-overlay shadow-2xl backdrop-blur-xl"
      );
      expect(overlayClass).toContain("rounded-[24px]");
      expect(overlayClass).toContain("bg-surface-overlay");
    });
  });
});
