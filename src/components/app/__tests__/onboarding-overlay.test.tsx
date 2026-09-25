import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingOverlay } from '../onboarding-overlay';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockCompleteOnboarding = vi.fn();
const mockIsInstallable = false;
const mockInstallPWA = vi.fn();

vi.mock('@/shared/store/onboarding-store', () => ({
  useOnboardingStore: () => ({
    completeOnboarding: mockCompleteOnboarding,
  }),
}));

vi.mock('@/shared/hooks/use-pwa-install', () => ({
  usePWAInstall: () => ({
    isInstallable: mockIsInstallable,
    installPWA: mockInstallPWA,
  }),
}));

vi.mock('@/shared/store/library-store', () => ({
  useLibraryStore: {
    getState: () => ({ items: {} }),
  },
}));

vi.mock('@/shared/store/history-store', () => ({
  useHistoryStore: {
    getState: () => ({ items: {} }),
  },
}));

describe('OnboardingOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial step and allows stepping forward to final step', async () => {
    const onComplete = vi.fn();
    render(<OnboardingOverlay onComplete={onComplete} />);

    expect(screen.getByText('SEMUA SUMBER, SATU PINTU')).toBeTruthy();
    expect(screen.getByText(/Ribuan Judul/)).toBeTruthy();

    const nextBtn = screen.getByRole('button', { name: 'Lanjut' });
    fireEvent.click(nextBtn);

    // Step 2
    await waitFor(() => {
      expect(screen.getByText('RAK & RIWAYAT')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));

    // Step 3
    await waitFor(() => {
      expect(screen.getByText('PENCARIAN LINTAS SUMBER')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));

    // Final Step: Step 4
    await waitFor(() => {
      expect(screen.getByText('READER YANG NGERTI KAMU')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Mulai Membaca' })).toBeTruthy();
    });

    const finishBtn = screen.getByRole('button', { name: 'Mulai Membaca' });
    fireEvent.click(finishBtn);
    expect(mockCompleteOnboarding).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('triggers completion when Lewati is clicked', () => {
    const onComplete = vi.fn();
    render(<OnboardingOverlay onComplete={onComplete} />);

    const skipBtn = screen.getByRole('button', { name: 'Lewati' });
    fireEvent.click(skipBtn);

    expect(mockCompleteOnboarding).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('supports keyboard navigation via ArrowRight, ArrowLeft, and Escape', async () => {
    const onComplete = vi.fn();
    render(<OnboardingOverlay onComplete={onComplete} />);

    expect(screen.getByText('SEMUA SUMBER, SATU PINTU')).toBeTruthy();

    // ArrowRight advances step
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(screen.getByText('RAK & RIWAYAT')).toBeTruthy();
    });

    // ArrowLeft goes back
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    await waitFor(() => {
      expect(screen.getByText('SEMUA SUMBER, SATU PINTU')).toBeTruthy();
    });

    // Escape exits
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockCompleteOnboarding).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });
});
