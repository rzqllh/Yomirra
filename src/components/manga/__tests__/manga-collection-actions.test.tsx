import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MangaStatusButton } from "../manga-status-button";
import { MangaCollectionButton } from "../manga-collection-button";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useLibraryStore } from "@/shared/store/library-store";

const mockAuthUser = vi.fn();
vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockAuthUser(),
    loading: false,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("Manga Detail Collection Actions (Slice 2.2)", () => {
  beforeEach(() => {
    mockAuthUser.mockReturnValue(null);
    useCollectionStore.setState({
      collections: [],
      membershipsByManga: {},
      readingStatusByManga: {},
    });
    useLibraryStore.setState({
      items: {},
    });
    vi.clearAllMocks();
  });

  describe("MangaStatusButton", () => {
    it("renders and opens status dialog", () => {
      render(<MangaStatusButton sourceId="srcA" mangaId="m1" />);
      const btn = screen.getByRole("button", { name: /Status/i });
      fireEvent.click(btn);
      
      expect(screen.getByText("Sedang Dibaca")).toBeDefined();
      expect(screen.getByText("Selesai")).toBeDefined();
      expect(screen.getByText("Ditunda")).toBeDefined();
      expect(screen.getByText("Dihentikan")).toBeDefined();
      expect(screen.getByText("Akan Dibaca")).toBeDefined();
    });

    it("sets reading status using mangaKey sourceId::mangaId", () => {
      render(<MangaStatusButton sourceId="srcA" mangaId="m1" />);
      fireEvent.click(screen.getByRole("button", { name: /Status/i }));
      
      fireEvent.click(screen.getByText("Selesai"));
      
      expect(useCollectionStore.getState().readingStatusByManga["srcA::m1"]).toBe("completed");
    });
  });

  describe("MangaCollectionButton", () => {
    it("shows soft-gate modal for guest and opens collection dialog after choosing Lanjut sebagai Tamu", () => {
      mockAuthUser.mockReturnValue(null);
      render(<MangaCollectionButton sourceId="srcA" mangaId="m1" />);
      const btn = screen.getByRole("button", { name: /Koleksi/i });
      fireEvent.click(btn);
      
      // Soft-gate modal appears
      expect(screen.getByText("Bikin playlist komikmu aman di cloud")).toBeDefined();
      expect(screen.getByText("Amankan Pake Google")).toBeDefined();

      // Click "Bikin di Device Ini Dulu"
      const guestBtn = screen.getByRole("button", { name: /Bikin di Device Ini Dulu/i });
      fireEvent.click(guestBtn);

      // Now collection dialog opens
      expect(screen.getByText("Belum ada koleksi.")).toBeDefined();
      expect(screen.getByRole("button", { name: /Buat Koleksi Baru/i })).toBeDefined();
    });

    it("opens collection dialog directly without gate when user is logged in", () => {
      mockAuthUser.mockReturnValue({ uid: "user-123" });
      render(<MangaCollectionButton sourceId="srcA" mangaId="m1" />);
      const btn = screen.getByRole("button", { name: /Koleksi/i });
      fireEvent.click(btn);

      // Opens collection dialog immediately
      expect(screen.queryByText("Bikin playlist komikmu aman di cloud")).toBeNull();
      expect(screen.getByText("Belum ada koleksi.")).toBeDefined();
    });

    it("can add and remove manga from a collection as guest", () => {
      mockAuthUser.mockReturnValue(null);
      useCollectionStore.getState().createCollection("Favs");
      const cId = useCollectionStore.getState().collections[0].id;
      
      render(<MangaCollectionButton sourceId="srcA" mangaId="m1" />);
      fireEvent.click(screen.getByRole("button", { name: /Koleksi/i }));
      
      // Proceed as guest
      fireEvent.click(screen.getByRole("button", { name: /Bikin di Device Ini Dulu/i }));
      
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
      fireEvent.click(screen.getByRole("button", { name: /Koleksi/i }));
      fireEvent.click(screen.getByRole("button", { name: /Bikin di Device Ini Dulu/i }));
      
      fireEvent.click(screen.getByRole("button", { name: /Buat Koleksi Baru/i }));
      
      const input = screen.getByPlaceholderText("Nama Koleksi");
      fireEvent.change(input, { target: { value: "NewFavs" } });
      
      fireEvent.click(screen.getByRole("button", { name: /Buat & Tambahkan/i }));
      
      const collections = useCollectionStore.getState().collections;
      expect(collections.length).toBe(1);
      expect(collections[0].name).toBe("NewFavs");
      expect(useCollectionStore.getState().membershipsByManga["srcA::m1"]).toEqual([collections[0].id]);
    });

    it("auto-saves manga to library if not already saved when added to collection", () => {
      useCollectionStore.getState().createCollection("Reading List");
      const cId = useCollectionStore.getState().collections[0].id;

      expect(useLibraryStore.getState().isInLibrary("srcA", "m1")).toBe(false);

      render(
        <MangaCollectionButton
          sourceId="srcA"
          mangaId="m1"
          mangaDetail={{
            title: "Test Comic",
            coverUrl: "https://example.com/cover.jpg",
            author: "Artist",
            status: "Ongoing",
          }}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Koleksi/i }));
      fireEvent.click(screen.getByRole("button", { name: /Bikin di Device Ini Dulu/i }));
      fireEvent.click(screen.getByText("Reading List"));

      expect(useLibraryStore.getState().isInLibrary("srcA", "m1")).toBe(true);
      const savedItem = useLibraryStore.getState().getLibraryItem("srcA", "m1");
      expect(savedItem?.title).toBe("Test Comic");
      expect(useCollectionStore.getState().membershipsByManga["srcA::m1"]).toEqual([cId]);
    });
  });
});
