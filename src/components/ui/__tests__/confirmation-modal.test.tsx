import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ConfirmationModal } from "../confirmation-modal";

describe("ConfirmationModal", () => {
  it("renders title, description and action buttons when open", () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onOpenChange={vi.fn()}
        title="Hapus Koleksi?"
        description="Folder koleksi ini akan dihapus."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Hapus Koleksi?")).toBeDefined();
    expect(screen.getByText("Folder koleksi ini akan dihapus.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Hapus" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Batal" })).toBeDefined();
  });

  it("does not render dialog content when closed", () => {
    render(
      <ConfirmationModal
        isOpen={false}
        onOpenChange={vi.fn()}
        title="Hapus Koleksi?"
        description="Folder koleksi ini akan dihapus."
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByText("Hapus Koleksi?")).toBeNull();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        onOpenChange={vi.fn()}
        title="Hapus Bookmark?"
        description="Komik akan dihapus."
        confirmLabel="Hapus"
        onConfirm={onConfirm}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when cancel button is clicked", async () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        onOpenChange={onOpenChange}
        title="Hapus Bookmark?"
        description="Komik akan dihapus."
        cancelLabel="Batal"
        onConfirm={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("enforces requireCheckbox before allowing confirm", async () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ConfirmationModal
        isOpen={true}
        onOpenChange={vi.fn()}
        title="Bersihkan Data?"
        description="Semua data lokal akan dihapus."
        confirmLabel="Bersihkan"
        variant="danger"
        requireCheckbox="Saya mengerti data akan hilang"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByRole("button", { name: "Bersihkan" }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    // Clicking confirm while disabled should not trigger onConfirm
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    expect(onConfirm).not.toHaveBeenCalled();

    // Check the box
    await act(async () => {
      fireEvent.click(checkbox);
    });
    expect(checkbox.checked).toBe(true);
    expect(confirmBtn.disabled).toBe(false);

    // Now clicking confirm succeeds
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // If modal closes and reopens, checkbox should be reset to unchecked
    rerender(
      <ConfirmationModal
        isOpen={false}
        onOpenChange={vi.fn()}
        title="Bersihkan Data?"
        description="Semua data lokal akan dihapus."
        confirmLabel="Bersihkan"
        requireCheckbox="Saya mengerti data akan hilang"
        onConfirm={onConfirm}
      />
    );
    rerender(
      <ConfirmationModal
        isOpen={true}
        onOpenChange={vi.fn()}
        title="Bersihkan Data?"
        description="Semua data lokal akan dihapus."
        confirmLabel="Bersihkan"
        requireCheckbox="Saya mengerti data akan hilang"
        onConfirm={onConfirm}
      />
    );

    const newCheckbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(newCheckbox.checked).toBe(false);
    const newConfirmBtn = screen.getByRole("button", { name: "Bersihkan" }) as HTMLButtonElement;
    expect(newConfirmBtn.disabled).toBe(true);
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onOpenChange={vi.fn()}
        title="Menghapus Item..."
        description="Mohon tunggu."
        confirmLabel="Hapus"
        isLoading={true}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Menghapus Item...")).toBeDefined();
    const confirmBtn = screen.getByRole("button", { name: "Memproses..." }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
  });
});
