import { describe, expect, it } from "vitest";
import { projectMetadataCatalogRows, type MetadataWork } from "../metadata-catalog";
import type { CatalogSearchRow } from "../canonical-search";

const work: MetadataWork = { provider: "mangabaka", externalId: 1, title: "Canonical title", aliases: ["Native title", "Translated title"], format: "manhwa", contentRating: "safe" };
const row = (sourceId: string, id: string, title: string, format = "manhwa"): CatalogSearchRow => ({
  sourceId, canonicalKey: JSON.stringify([sourceId, id]), manga: { id, title, format, coverUrl: "/cover.jpg" },
});

describe("metadata-assisted discovery", () => {
  it("groups different catalog aliases for unsaved works without rewriting source IDs", () => {
    const input = [row("a", "1", "Native title"), row("b", "2", "Translated title")];
    const result = projectMetadataCatalogRows(input, [work]);
    expect(result).toHaveLength(1);
    expect(result[0].manga.title).toBe("Canonical title");
    expect(result[0].sourceBindings?.map(binding => [binding.sourceId, binding.mangaId])).toEqual([["a", "1"], ["b", "2"]]);
    expect(input[0].manga.title).toBe("Native title");
  });
  it("does not group ambiguous aliases, mismatched formats, or same-provider editions", () => {
    const a = row("a", "1", "Native title");
    const b = row("b", "2", "Translated title");
    expect(projectMetadataCatalogRows([a,b], [work, {...work, externalId: 2}])).toHaveLength(2);
    expect(projectMetadataCatalogRows([a,row("b","2","Translated title","manga")], [work])).toHaveLength(2);
    expect(projectMetadataCatalogRows([a,row("a","2","Translated title")], [work])).toHaveLength(2);
    expect(projectMetadataCatalogRows([a,row("b","2","Translated title sequel")], [work])).toHaveLength(2);
    expect(projectMetadataCatalogRows([{...a,manga:{...a.manga,author:"A"}},{...b,manga:{...b.manga,author:"B"}}], [work])).toHaveLength(2);
  });
});
