import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HelpPage, { metadata } from "../page";

vi.mock("@/components/chrome/header", () => ({
  PageHeader: ({ title }: { title: string }) => <header>{title}</header>,
}));

describe("standalone Pusat Bantuan", () => {
  it("has its own route metadata and helpful topics", () => {
    expect(metadata.title).toBe("Pusat Bantuan | Yomirra");
    render(<HelpPage />);
    expect(screen.getByRole("heading", { name: /Masalah yang sering ditemui/i })).toBeTruthy();
    const summaries = screen.getAllByText(/Sumber komik gagal dimuat|Progres membaca atau bookmark belum tersinkron/);
    expect(summaries).toHaveLength(2);
    const providerTopic = screen.getByText("Sumber komik gagal dimuat").closest("details")!;
    expect(providerTopic.open).toBe(false);
    fireEvent.click(screen.getByText("Sumber komik gagal dimuat"));
    expect(providerTopic.open).toBe(true);
    expect(screen.getByRole("link", { name: /Periksa daftar sumber/i }).getAttribute("href")).toBe("/sources");
  });

  it("provides actual existing destination routes instead of fake anchors", () => {
    render(<HelpPage />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    for (const link of links) {
      const href = link.getAttribute("href");
      expect(href).toMatch(/^\/(?:sources|search|settings|bookmark)?$/);
      expect(href).not.toContain("#");
    }
  });
});
