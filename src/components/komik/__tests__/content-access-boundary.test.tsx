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

  it("permits unrated or missing-rating content without positive adult signals to mount directly (D-01)", () => {
    const fetchPages = vi.fn();
    function Pages() { useEffect(fetchPages, []); return <p>Unrated chapter images</p>; }
    render(<ContentAccessBoundary sourceId="mangadex" item={{ id: "unverified-1", contentRating: "unknown" }}><Pages /></ContentAccessBoundary>);
    expect(screen.getByText("Unrated chapter images")).toBeTruthy();
    expect(fetchPages).toHaveBeenCalledOnce();
  });

  it("treats absent rating as unrated and permits direct access without blocking consent", () => {
    render(<ContentAccessBoundary sourceId="mangadex" item={{ id: "missing-rating" }}><p>Unclassified pages</p></ContentAccessBoundary>);
    expect(screen.getByText("Unclassified pages")).toBeTruthy();
    expect(screen.queryByText("Rating belum terverifikasi")).toBeNull();
  });

});
