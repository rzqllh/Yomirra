import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { FilterChip } from '../filter-chip';

describe('FilterChip', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  it('renders aria-pressed="true" when selected is true', async () => {
    await act(async () => {
      root.render(<FilterChip label="Test" selected={true} />);
    });
    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders aria-pressed="false" when selected is false', async () => {
    await act(async () => {
      root.render(<FilterChip label="Test" selected={false} />);
    });
    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-pressed')).toBe('false');
  });

  it('click handler remains functional', async () => {
    const onClick = vi.fn();
    await act(async () => {
      root.render(<FilterChip label="Test" onClick={onClick} />);
    });
    const button = container.querySelector('button');

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes down native button props like disabled', async () => {
    await act(async () => {
      root.render(<FilterChip label="Test" disabled={true} id="test-chip" />);
    });
    const button = container.querySelector('button');
    expect(button?.disabled).toBe(true);
    expect(button?.id).toBe('test-chip');
  });
});
