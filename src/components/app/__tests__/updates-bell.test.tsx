import { render, screen } from '@testing-library/react';
import { UpdatesBell } from '../updates-bell';
import { useUpdateStore } from '@/shared/store/update-store';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/shared/store/update-store', () => ({
  useUpdateStore: vi.fn(),
}));

vi.mock('@/shared/store/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

vi.mock('@/shared/hooks/use-mounted', () => ({
  useMounted: () => true
}));

describe('UpdatesBell Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders link to /updates with accessible label when 0 unread', () => {
    (useUpdateStore as any).mockReturnValue(0);
    render(<UpdatesBell />);
    
    const bellLink = screen.getByRole('link', { name: 'Pembaruan' });
    expect(bellLink).toBeTruthy();
    expect(bellLink.getAttribute('href')).toBe('/updates');
    
    const badge = screen.queryByTestId('updates-badge');
    expect(badge).toBeNull();
  });

  it('shows badge and correct accessible label when unread count > 0', () => {
    (useUpdateStore as any).mockReturnValue(5);
    render(<UpdatesBell />);
    
    const bellLink = screen.getByRole('link', { name: 'Pembaruan, 5 belum dibaca' });
    expect(bellLink).toBeTruthy();
    
    const badge = screen.getByTestId('updates-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('5');
  });

  it('displays 99+ when unread count exceeds 99', () => {
    (useUpdateStore as any).mockReturnValue(120);
    render(<UpdatesBell />);
    
    const bellLink = screen.getByRole('link', { name: 'Pembaruan, 120 belum dibaca' });
    expect(bellLink).toBeTruthy();
    
    const badge = screen.getByTestId('updates-badge');
    expect(badge.textContent).toBe('99+');
  });
});
