import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReaderPanelShell } from "../reader-panel-shell";

function Harness() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Buka panel
      </button>
      <ReaderPanelShell
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Pengaturan reader"
      >
        <button type="button">Aksi pertama</button>
        <button type="button">Aksi terakhir</button>
      </ReaderPanelShell>
    </>
  );
}

describe("ReaderPanelShell accessibility", () => {
  it("exposes dialog semantics, traps keyboard focus, and returns focus to the trigger", async () => {
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Buka panel" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", {
      name: "Pengaturan reader",
    });
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    await waitFor(() => {
      expect(document.activeElement).toBe(dialog);
    });

    const close = screen.getByRole("button", { name: "Tutup panel" });
    const last = screen.getByRole("button", { name: "Aksi terakhir" });

    last.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(close);

    close.focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);

    fireEvent.click(close);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("closes on Escape and restores focus", async () => {
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Buka panel" });
    trigger.focus();
    fireEvent.click(trigger);
    await screen.findByRole("dialog");

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});
