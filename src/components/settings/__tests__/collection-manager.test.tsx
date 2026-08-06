import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CollectionManager } from "../collection-manager";
import { useCollectionStore } from "@/shared/store/collection-store";

describe("CollectionManager Settings UI (Slice 2.2)", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collections: [],
      membershipsByManga: {},
      readingStatusByManga: {},
    });
    vi.clearAllMocks();
  });

  it("renders empty state", () => {
    render(<CollectionManager />);
    expect(screen.getByText("Belum ada koleksi yang dibuat.")).toBeDefined();
  });

  it("creates a new collection", () => {
    render(<CollectionManager />);
    fireEvent.click(screen.getByRole("button", { name: /Koleksi Baru/i }));
    
    const input = screen.getByPlaceholderText("Nama Koleksi");
    fireEvent.change(input, { target: { value: "My Test Collection" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Buat" }));
    
    expect(useCollectionStore.getState().collections.length).toBe(1);
    expect(useCollectionStore.getState().collections[0].name).toBe("My Test Collection");
  });

  it("renames a collection", () => {
    useCollectionStore.getState().createCollection("Old Name");
    render(<CollectionManager />);
    
    fireEvent.click(screen.getByRole("button", { name: "Ubah nama" }));
    
    const input = screen.getByPlaceholderText("Nama Koleksi");
    fireEvent.change(input, { target: { value: "New Name" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    
    expect(useCollectionStore.getState().collections[0].name).toBe("New Name");
  });

  it("deletes a collection with confirmation", () => {
    useCollectionStore.getState().createCollection("To Delete");
    render(<CollectionManager />);
    
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    
    expect(screen.getByText("Hapus Koleksi?")).toBeDefined();
    // Use getAllByRole to get the correct delete button in modal
    const buttons = screen.getAllByRole("button", { name: "Hapus" });
    fireEvent.click(buttons[buttons.length - 1]);
    
    expect(useCollectionStore.getState().collections.length).toBe(0);
  });
});
