import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MangaStatusButton } from "../manga-status-button";
import { MangaCollectionButton } from "../manga-collection-button";
import { useCollectionStore } from "@/shared/store/collection-store";

describe("Manga Detail Collection Actions (Slice 2.2)", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collections: [],
      membershipsByManga: {},
      readingStatusByManga: {},
    });
    vi.clearAllMocks();
  });

  describe("MangaStatusButton", () => {
    it("renders and opens status dialog", () => {
      render(<MangaStatusButton sourceId="srcA" mangaId="m1" />);
      const btn = screen.getByRole("button", { name: /Status Membaca/i });
      fireEvent.click(btn);
      
      expect(screen.getByText("Sedang Dibaca")).toBeDefined();
      expect(screen.getByText("Selesai")).toBeDefined();
      expect(screen.getByText("Ditunda")).toBeDefined();
      expect(screen.getByText("Dihentikan")).toBeDefined();
      expect(screen.getByText("Akan Dibaca")).toBeDefined();
    });

    it("sets reading status using mangaKey sourceId::mangaId", () => {
      render(<MangaStatusButton sourceId="srcA" mangaId="m1" />);
      fireEvent.click(screen.getByRole("button", { name: /Status Membaca/i }));
      
      fireEvent.click(screen.getByText("Selesai"));
      
      expect(useCollectionStore.getState().readingStatusByManga["srcA::m1"]).toBe("completed");
    });
  });

  describe("MangaCollectionButton", () => {
    it("renders and opens collection dialog with empty state", () => {
      render(<MangaCollectionButton sourceId="srcA" mangaId="m1" />);
      const btn = screen.getByRole("button", { name: /Kelola Koleksi/i });
      fireEvent.click(btn);
      
      expect(screen.getByText("Belum ada koleksi.")).toBeDefined();
      expect(screen.getByRole("button", { name: /Buat Koleksi Baru/i })).toBeDefined();
    });

    it("can add and remove manga from a collection", () => {
      useCollectionStore.getState().createCollection("Favs");
      const cId = useCollectionStore.getState().collections[0].id;
      
      render(<MangaCollectionButton sourceId="srcA" mangaId="m1" />);
      fireEvent.click(screen.getByRole("button", { name: /Kelola Koleksi/i }));
      
      const colBtn = screen.getByText("Favs");
      
      // Add
      fireEvent.click(colBtn);
      expect(useCollectionStore.getState().membershipsByManga["srcA::m1"]).toEqual([cId]);
      
      // Remove
      fireEvent.click(colBtn);
      expect(useCollectionStore.getState().membershipsByManga["srcA::m1"]).toBeUndefined();
    });

    it("can create collection and auto add manga", () => {
      render(<MangaCollectionButton sourceId="srcA" mangaId="m1" />);
      fireEvent.click(screen.getByRole("button", { name: /Kelola Koleksi/i }));
      
      fireEvent.click(screen.getByRole("button", { name: /Buat Koleksi Baru/i }));
      
      const input = screen.getByPlaceholderText("Nama Koleksi");
      fireEvent.change(input, { target: { value: "NewFavs" } });
      
      fireEvent.click(screen.getByRole("button", { name: /Buat & Tambahkan/i }));
      
      const collections = useCollectionStore.getState().collections;
      expect(collections.length).toBe(1);
      expect(collections[0].name).toBe("NewFavs");
      expect(useCollectionStore.getState().membershipsByManga["srcA::m1"]).toEqual([collections[0].id]);
    });
  });
});
