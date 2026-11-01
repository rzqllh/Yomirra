import React, { useEffect } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentAccessBoundary } from "../content-access-boundary";
import { useSettingsStore } from "@/shared/store/settings-store";

beforeEach(() => useSettingsStore.setState({ hideNsfw: true }));
afterEach(cleanup);

describe("mounted content safety", () => {
  it("does not mount restricted metadata/images or child request effects by default", () => {
    const request = vi.fn();
    function Content() { useEffect(request, []); return <p>Restricted title and image</p>; }
    render(<ContentAccessBoundary sourceId="mangadex" item={{ contentRating: "erotica" }}><Content /></ContentAccessBoundary>);
    expect(screen.queryByText("Restricted title and image")).toBeNull();
    expect(screen.getByText("Konten disembunyikan")).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
  });

  it("unmounts already-visible opted-in content when safety is re-enabled without reload", () => {
    useSettingsStore.setState({ hideNsfw: false });
    const release = vi.fn();
    function Content() { useEffect(() => release, []); return <p>Restricted title and image</p>; }
    render(<ContentAccessBoundary sourceId="mangadex" item={{ contentRating: "erotica" }}><Content /></ContentAccessBoundary>);
    expect(screen.getByText("Restricted title and image")).toBeTruthy();
    act(() => useSettingsStore.getState().setHideNsfw(true));
    expect(screen.queryByText("Restricted title and image")).toBeNull();
    expect(release).toHaveBeenCalledOnce();
  });

  it("keeps safe mixed-provider content accessible", () => {
    render(<ContentAccessBoundary sourceId="mangadex" item={{ contentRating: "safe" }}><p>Safe title</p></ContentAccessBoundary>);
    expect(screen.getByText("Safe title")).toBeTruthy();
  });

  it("also hides an adult-only source when older title metadata has no rating", () => {
    render(<ContentAccessBoundary sourceId="doujindesu" item={{}}><p>Restricted source title</p></ContentAccessBoundary>);
    expect(screen.queryByText("Restricted source title")).toBeNull();
    expect(screen.getByText("Konten disembunyikan")).toBeTruthy();
  });

  it("warns about UNKNOWN before mounting detail, Reader image or request effects", () => {
    const fetchPages = vi.fn();
    function Pages() { useEffect(fetchPages, []); return <p>Unknown chapter images</p>; }
    render(<ContentAccessBoundary sourceId="mangadex" item={{ id: "unverified-1", contentRating: "unknown" }}><Pages /></ContentAccessBoundary>);
    expect(screen.getByText("Rating belum terverifikasi")).toBeTruthy();
    expect(screen.queryByText("Unknown chapter images")).toBeNull();
    expect(fetchPages).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan dan tampilkan konten" }));
    expect(screen.getByText("Unknown chapter images")).toBeTruthy();
    expect(fetchPages).toHaveBeenCalledOnce();
    expect(screen.getByText(/klasifikasi konten dari sumber belum tersedia/)).toBeTruthy();
  });

  it("treats absent rating as UNKNOWN and requires a new acknowledgement after opt-in toggles", () => {
    render(<ContentAccessBoundary sourceId="mangadex" item={{ id: "missing-rating" }}><p>Unclassified pages</p></ContentAccessBoundary>);
    expect(screen.getByText("Rating belum terverifikasi")).toBeTruthy();
    expect(screen.queryByText("Unclassified pages")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan dan tampilkan konten" }));
    expect(screen.getByText("Unclassified pages")).toBeTruthy();
    act(() => useSettingsStore.getState().setHideNsfw(false));
    act(() => useSettingsStore.getState().setHideNsfw(true));
    expect(screen.queryByText("Unclassified pages")).toBeNull();
    expect(screen.getByText("Rating belum terverifikasi")).toBeTruthy();
  });

});
