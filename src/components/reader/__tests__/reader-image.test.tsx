import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ReaderImage } from "../reader-image";

// Mock next/image to manually trigger error and load
vi.mock("next/image", () => ({
  default: ({ unoptimized, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        {...props}
        data-unoptimized={unoptimized ? "true" : "false"}
        data-priority={priority ? "true" : "false"}
      />
    );
  },
}));

describe("ReaderImage - Failure Recovery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    pageIndex: 0,
    pageUrl: "http://example.com/test.jpg",
    isWebtoon: true,
    dataSaver: false,
    isAllowedToLoad: true,
    onLoadComplete: vi.fn(),
    onError: vi.fn(),
  };

  it("should attempt to retry 3 times before rendering error state", () => {
    render(<ReaderImage {...defaultProps} />);
    const img = screen.getByRole("img");
    
    // Attempt 1 (0 -> 1)
    fireEvent.error(img);
    act(() => {
      vi.advanceTimersByTime(2000); // 1000 + jitter
    });
    
    // Attempt 2 (1 -> 2)
    fireEvent.error(screen.getByRole("img"));
    act(() => {
      vi.advanceTimersByTime(3500); // 2500 + jitter
    });

    // Attempt 3 (2 -> 3)
    fireEvent.error(screen.getByRole("img"));
    act(() => {
      vi.advanceTimersByTime(6000); // 5000 + jitter
    });

    // Final failure - should render PageImageError
    fireEvent.error(screen.getByRole("img"));
    
    expect(screen.getByText(/Gambar 0 Rusak/i)).toBeTruthy();
    expect(defaultProps.onError).toHaveBeenCalledWith(0);
  });

  it("should attempt URL re-resolution when onRefreshUrl is provided after 3 retries", async () => {
    const freshUrl = "http://example.com/fresh-url.jpg";
    const onRefreshUrl = vi.fn().mockResolvedValue(freshUrl);

    render(
      <ReaderImage
        {...defaultProps}
        onRefreshUrl={onRefreshUrl}
      />
    );

    // 3 retries
    fireEvent.error(screen.getByRole("img"));
    act(() => { vi.advanceTimersByTime(2000); });
    fireEvent.error(screen.getByRole("img"));
    act(() => { vi.advanceTimersByTime(3500); });
    fireEvent.error(screen.getByRole("img"));
    act(() => { vi.advanceTimersByTime(6000); });

    // 4th error triggers onRefreshUrl
    await act(async () => {
      fireEvent.error(screen.getByRole("img"));
    });

    expect(onRefreshUrl).toHaveBeenCalledWith(0);
    // Should update the image src to freshUrl
    expect(screen.getByRole("img").getAttribute("src")).toContain("fresh-url.jpg");
    // Not in error state yet
    expect(screen.queryByText(/Gambar 0 Rusak/i)).toBeNull();
  });

  it("should attempt proxy fallback when fallbackProxyUrl is provided", async () => {
    const fallbackProxyUrl = "/api/proxy/image?url=http%3A%2F%2Fexample.com%2Ftest.jpg&sig=abc";

    render(
      <ReaderImage
        {...defaultProps}
        fallbackProxyUrl={fallbackProxyUrl}
      />
    );

    // 3 retries
    fireEvent.error(screen.getByRole("img"));
    act(() => { vi.advanceTimersByTime(2000); });
    fireEvent.error(screen.getByRole("img"));
    act(() => { vi.advanceTimersByTime(3500); });
    fireEvent.error(screen.getByRole("img"));
    act(() => { vi.advanceTimersByTime(6000); });

    // 4th error switches to proxy fallback
    await act(async () => {
      fireEvent.error(screen.getByRole("img"));
    });

    expect(screen.getByRole("img").getAttribute("src")).toContain("/api/proxy/image");
    expect(screen.queryByText(/Gambar 0 Rusak/i)).toBeNull();
  });

  it("should reset recovery state when user clicks retry in error banner", () => {
    render(<ReaderImage {...defaultProps} />);

    // Trigger all retries to reach error state
    fireEvent.error(screen.getByRole("img"));
    act(() => { vi.advanceTimersByTime(2000); });
    fireEvent.error(screen.getByRole("img"));
    act(() => { vi.advanceTimersByTime(3500); });
    fireEvent.error(screen.getByRole("img"));
    act(() => { vi.advanceTimersByTime(6000); });
    fireEvent.error(screen.getByRole("img"));

    expect(screen.getByText(/Gambar 0 Rusak/i)).toBeTruthy();

    // Click "Coba Lagi"
    const retryBtn = screen.getByRole("button", { name: /Coba Lagi/i });
    fireEvent.click(retryBtn);

    // Error state cleared, image component rendered again
    expect(screen.queryByText(/Gambar 0 Rusak/i)).toBeNull();
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("should bypass image optimizer on error when dataSaver is enabled to prevent remote whitelist crash", async () => {
    const { container } = render(
      <ReaderImage
        {...defaultProps}
        pageUrl="https://unwhitelisted-cdn.com/chapter-1/page-1.jpg"
        dataSaver={true}
      />
    );

    const initialImg = container.querySelector("img");
    expect(initialImg?.getAttribute("data-unoptimized")).toBe("false");

    // Optimizer throws error (e.g. 400 Bad Request hostname not configured)
    await act(async () => {
      fireEvent.error(initialImg!);
    });

    // Should immediately re-render with unoptimized=true
    const bypassedImg = container.querySelector("img");
    expect(bypassedImg?.getAttribute("data-unoptimized")).toBe("true");
    expect(screen.queryByText(/Gambar 0 Rusak/i)).toBeNull();
  });
});
