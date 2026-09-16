import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BookmarkPage from '../page';

vi.mock('@/components/bookmark/bookmark-page-view', () => ({
  BookmarkPageView: () => <div data-testid="bookmark-page-view">Bookmark Page View</div>,
}));

describe('/bookmark route — canonical Rak Buku view', () => {
  it('renders BookmarkPageView inside Suspense without redirecting', () => {
    render(<BookmarkPage />);
    expect(screen.getByTestId('bookmark-page-view')).toBeTruthy();
  });
});
