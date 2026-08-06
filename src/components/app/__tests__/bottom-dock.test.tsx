import { render, screen } from '@testing-library/react';
import { BottomDock } from '../bottom-dock';
import { usePathname } from 'next/navigation';
import { useUpdateStore } from '@/shared/store/update-store';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@/shared/store/update-store', () => ({
  useUpdateStore: vi.fn(),
}));

vi.mock('@/shared/store/search-filter-store', () => ({
  useSearchFilterStore: {
    getState: () => ({ resetFilters: vi.fn() })
  }
}));

vi.mock('@/shared/hooks/use-mounted', () => ({
  useMounted: () => true
}));

describe('BottomDock Navigation Badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue('/');
  });

  it('hides badge when unread count is 0', () => {
    (useUpdateStore as any).mockReturnValue(0);
    render(<BottomDock />);
    
    // Updates menu item should exist
    const updatesLink = screen.getByLabelText('Updates');
    expect(updatesLink).toBeTruthy();
    
    // No badge should be visible
    const badge = screen.queryByTestId('updates-badge');
    expect(badge).toBeNull();
  });

  it('shows badge with exact unread count', () => {
    (useUpdateStore as any).mockReturnValue(5);
    render(<BottomDock />);
    
    const badge = screen.getByTestId('updates-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toBe('5');
  });

  it('shows 99+ when unread count is > 99', () => {
    (useUpdateStore as any).mockReturnValue(150);
    render(<BottomDock />);
    
    const badge = screen.getByTestId('updates-badge');
    expect(badge?.textContent).toBe('99+');
  });
});
