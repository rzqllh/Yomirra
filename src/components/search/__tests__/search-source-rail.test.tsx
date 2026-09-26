import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { SearchSourceRail } from "../search-source-rail";
import type { SourceMetadata } from "@/shared/sources/source-types";

describe("SearchSourceRail candidate health & visibility", () => {
  const mockSources: SourceMetadata[] = [
    {
      id: "shinigami",
      name: "Shinigami",
      isInstalled: true,
      status: "online",
      capabilities: { search: true },
    } as SourceMetadata,
    {
      id: "komiku",
      name: "Komiku",
      isInstalled: true,
      status: "unavailable",
      capabilities: { search: true },
    } as SourceMetadata,
    {
      id: "komikindo",
      name: "Komikindo",
      isInstalled: true,
      status: "in-fix",
      capabilities: { search: true },
    } as SourceMetadata,
  ];

  it("renders all eligible candidate sources, including degraded and offline ones", () => {
    render(
      <SearchSourceRail
        searchableSources={mockSources}
        activeSelectedSources={["shinigami", "komiku", "komikindo"]}
        onToggleSource={vi.fn()}
      />
    );

    expect(screen.getByText("Shinigami")).toBeTruthy();
    expect(screen.getByText("Komiku")).toBeTruthy();
    expect(screen.getByText("Komikindo")).toBeTruthy();

    // Verify "Gangguan" badge is visible for degraded/offline sources
    const warningBadges = screen.getAllByText("Gangguan");
    expect(warningBadges).toHaveLength(2);
  });

  it("triggers onToggleSource callback when chip is clicked", () => {
    const onToggleSource = vi.fn();
    render(
      <SearchSourceRail
        searchableSources={mockSources}
        activeSelectedSources={["shinigami"]}
        onToggleSource={onToggleSource}
      />
    );

    const komikuChip = screen.getByRole("button", { name: /Komiku/i });
    fireEvent.click(komikuChip);
    expect(onToggleSource).toHaveBeenCalledWith("komiku");
  });
});
