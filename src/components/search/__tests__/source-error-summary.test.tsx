import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchSourceErrorSummary, getFriendlySourceError } from "../source-error-summary";
import type { SourceMetadata } from "@/shared/sources/source-types";

const sources = [
  { id: "komikindo", name: "Komikindo" },
  { id: "komiknesia", name: "KomikNesia" },
  { id: "doujindesu", name: "Doujindesu" },
  { id: "westmanga", name: "WestManga" },
] as SourceMetadata[];

describe("SearchSourceErrorSummary", () => {
  it("collapses four provider failures into a single accessible disclosure", () => {
    const errors = sources.map(({ id }) => ({ sourceId: id, error: "HTTP 403" }));
    const { container } = render(<SearchSourceErrorSummary errors={errors} sources={sources} />);

    expect(screen.getByText(/4 sumber bermasalah/i)).toBeTruthy();
    expect(container.querySelectorAll("details")).toHaveLength(1);
    expect(container.querySelectorAll("summary")).toHaveLength(1);
    const disclosure = container.querySelector("details")!;
    expect(disclosure.open).toBe(false);
    fireEvent.click(screen.getByText(/4 sumber bermasalah/i));
    expect(disclosure.open).toBe(true);
    expect(screen.getByText("Komikindo")).toBeTruthy();
    expect(screen.getByText("KomikNesia")).toBeTruthy();
    expect(screen.getByText("Doujindesu")).toBeTruthy();
    expect(screen.getByText("WestManga")).toBeTruthy();
  });

  it("uses the provider's real name for a single failure", () => {
    render(<SearchSourceErrorSummary errors={[{ sourceId: "komikindo", error: "timeout" }]} sources={sources} />);
    expect(screen.getByText(/Komikindo bermasalah/i)).toBeTruthy();
  });

  it("renders nothing with no errors", () => {
    const { container } = render(<SearchSourceErrorSummary errors={[]} sources={sources} />);
    expect(container.firstChild).toBeNull();
  });

  it("does not leak raw upstream error text in the UI", () => {
    expect(getFriendlySourceError("fetch failed: internal host secret")).toBe("belum bisa dihubungi");
    expect(getFriendlySourceError("HTTP Error 403: Forbidden")).toBe("sementara menolak permintaan");
  });
});
