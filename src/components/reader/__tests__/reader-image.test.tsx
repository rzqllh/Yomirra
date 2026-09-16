import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ReaderImage } from "../reader-image";

// Mock next/image to manually trigger error and load
vi.mock("next/image", () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
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
});
