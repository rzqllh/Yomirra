import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { ReaderImage } from '../reader-image';

vi.mock('next/image', () => ({
  default: (props: any) => {
    return (
      <img
        {...props}
        data-unoptimized={props.unoptimized}
        data-src={props.src}
        onLoad={(e) => {
          Object.defineProperty(e.currentTarget, 'naturalWidth', { value: 800 });
          Object.defineProperty(e.currentTarget, 'naturalHeight', { value: 1200 });
          props.onLoad?.(e);
        }}
        onError={props.onError}
      />
    );
  }
}));

describe('ReaderImage', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', { onLine: true });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  it('offline URL sets unoptimized to true and uses offline source', async () => {
    await act(async () => {
      root.render(
        <ReaderImage
          pageIndex={0}
          pageUrl="https://online.com/image.jpg"
          isWebtoon={false}
          dataSaver={false}
          isAllowedToLoad={true}
          onLoadComplete={vi.fn()}
          onError={vi.fn()}
          offlineUrl="/offline-images/test/1.jpg"
        />
      );
    });

    const img = container.querySelector('img');
    expect(img?.getAttribute('data-src')).toBe('/offline-images/test/1.jpg');
    expect(img?.getAttribute('data-unoptimized')).toBe('true');
  });

  it('Data Saver online URL behavior remains unchanged', async () => {
    await act(async () => {
      root.render(
        <ReaderImage
          pageIndex={0}
          pageUrl="https://online.com/image.jpg"
          isWebtoon={false}
          dataSaver={true}
          isAllowedToLoad={true}
          onLoadComplete={vi.fn()}
          onError={vi.fn()}
        />
      );
    });
    
    let img = container.querySelector('img');
    expect(img?.getAttribute('data-src')).toBe('https://online.com/image.jpg');
    expect(img?.getAttribute('data-unoptimized')).toBe('false');

    await act(async () => {
      root.render(
        <ReaderImage
          pageIndex={0}
          pageUrl="https://online.com/image.jpg"
          isWebtoon={false}
          dataSaver={false}
          isAllowedToLoad={true}
          onLoadComplete={vi.fn()}
          onError={vi.fn()}
        />
      );
    });
    
    img = container.querySelector('img');
    expect(img?.getAttribute('data-unoptimized')).toBe('true');
  });

  it('failed offline URL falls back once when online', async () => {
    const onErrorMock = vi.fn();
    await act(async () => {
      root.render(
        <ReaderImage
          pageIndex={0}
          pageUrl="https://online.com/image.jpg"
          isWebtoon={false}
          dataSaver={false}
          isAllowedToLoad={true}
          onLoadComplete={vi.fn()}
          onError={onErrorMock}
          offlineUrl="/offline-images/test/1.jpg"
        />
      );
    });

    const img = container.querySelector('img');
    expect(img?.getAttribute('data-src')).toBe('/offline-images/test/1.jpg');

    await act(async () => {
      const event = new Event('error', { bubbles: true });
      img?.dispatchEvent(event);
    });

    expect(img?.getAttribute('data-src')).toBe('https://online.com/image.jpg');
    
    await act(async () => {
      const event = new Event('error', { bubbles: true });
      img?.dispatchEvent(event);
    });

    await act(async () => { vi.advanceTimersByTime(1500); });
    expect(img?.getAttribute('data-src')).toContain('retry=1');
  });

  it('failed offline URL does not attempt online fallback when fully offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const onErrorMock = vi.fn();
    
    await act(async () => {
      root.render(
        <ReaderImage
          pageIndex={0}
          pageUrl="https://online.com/image.jpg"
          isWebtoon={false}
          dataSaver={false}
          isAllowedToLoad={true}
          onLoadComplete={vi.fn()}
          onError={onErrorMock}
          offlineUrl="/offline-images/test/1.jpg"
        />
      );
    });

    const img = container.querySelector('img');
    expect(img?.getAttribute('data-src')).toBe('/offline-images/test/1.jpg');

    await act(async () => {
      const event = new Event('error', { bubbles: true });
      img?.dispatchEvent(event);
    });

    expect(onErrorMock).toHaveBeenCalledWith(0);
    expect(container.textContent).toMatch(/Coba/i);
  });
});
