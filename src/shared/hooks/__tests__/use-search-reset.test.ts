import { renderHook } from '@testing-library/react';
import { useSearchReset } from '../use-search-reset';
import { vi, describe, it, expect } from 'vitest';

describe('useSearchReset', () => {
  const createMockSetPage = (initialPage: number) => {
    let currentPage = initialPage;
    const setPage = vi.fn((valOrUpdater: number | ((prev: number) => number)) => {
      if (typeof valOrUpdater === 'function') {
        const next = valOrUpdater(currentPage);
        if (next !== currentPage) {
          currentPage = next;
        }
      } else {
        if (valOrUpdater !== currentPage) {
          currentPage = valOrUpdater;
        }
      }
    });
    return {
      setPage,
      getCurrentPage: () => currentPage,
      setCurrentPage: (p: number) => { currentPage = p; }
    };
  };

  const defaultProps = {
    genres: ['action'],
    formats: ['manga'],
    status: 'ongoing',
    sort: 'popular',
    query: 'naruto',
    activeSelectedSources: ['shinigami']
  };

  it('initial render ketika page sudah 1 tidak menulis state', () => {
    const { setPage, getCurrentPage } = createMockSetPage(1);

    renderHook(() => useSearchReset({ ...defaultProps, setPage }));

    expect(setPage).not.toHaveBeenCalled();
    expect(getCurrentPage()).toBe(1);
  });

  it('rerender dengan source, filter, dan query identik tidak mereset ulang', () => {
    const { setPage, getCurrentPage } = createMockSetPage(1);

    const { rerender } = renderHook(
      (props) => useSearchReset({ ...props, setPage }),
      { initialProps: defaultProps }
    );

    expect(setPage).not.toHaveBeenCalled();

    // Rerender with identical values
    rerender({ ...defaultProps });

    expect(setPage).not.toHaveBeenCalled();
    expect(getCurrentPage()).toBe(1);
  });

  it('perubahan source ketika page lebih dari 1 mereset tepat satu kali', () => {
    const { setPage, getCurrentPage, setCurrentPage } = createMockSetPage(1);

    const { rerender } = renderHook(
      (props) => useSearchReset({ ...props, setPage }),
      { initialProps: defaultProps }
    );

    // Simulate page navigation to page 3
    setCurrentPage(3);
    expect(getCurrentPage()).toBe(3);

    // Change source
    rerender({
      ...defaultProps,
      activeSelectedSources: ['shinigami', 'komikindo']
    });

    expect(setPage).toHaveBeenCalledTimes(1);
    expect(getCurrentPage()).toBe(1);

    // Subsequent rerender with same props does not trigger reset again
    setPage.mockClear();
    rerender({
      ...defaultProps,
      activeSelectedSources: ['shinigami', 'komikindo']
    });

    expect(setPage).not.toHaveBeenCalled();
  });

  it('perubahan filter ketika page lebih dari 1 mengikuti behavior yang telah disepakati', () => {
    // 1) Test genre change resets page from 3 to 1
    const genreState = createMockSetPage(3);
    const genreHook = renderHook(
      (props) => useSearchReset({ ...props, setPage: genreState.setPage }),
      { initialProps: defaultProps }
    );
    genreHook.rerender({ ...defaultProps, genres: ['action', 'romance'] });
    expect(genreState.setPage).toHaveBeenCalledTimes(1);
    expect(genreState.getCurrentPage()).toBe(1);

    // 2) Test format change resets page from 2 to 1
    const formatState = createMockSetPage(2);
    const formatHook = renderHook(
      (props) => useSearchReset({ ...props, setPage: formatState.setPage }),
      { initialProps: defaultProps }
    );
    formatHook.rerender({ ...defaultProps, formats: ['manhwa'] });
    expect(formatState.setPage).toHaveBeenCalledTimes(1);
    expect(formatState.getCurrentPage()).toBe(1);

    // 3) Test status change resets page from 4 to 1
    const statusState = createMockSetPage(4);
    const statusHook = renderHook(
      (props) => useSearchReset({ ...props, setPage: statusState.setPage }),
      { initialProps: defaultProps }
    );
    statusHook.rerender({ ...defaultProps, status: 'completed' });
    expect(statusState.setPage).toHaveBeenCalledTimes(1);
    expect(statusState.getCurrentPage()).toBe(1);

    // 4) Test sort change resets page from 5 to 1
    const sortState = createMockSetPage(5);
    const sortHook = renderHook(
      (props) => useSearchReset({ ...props, setPage: sortState.setPage }),
      { initialProps: defaultProps }
    );
    sortHook.rerender({ ...defaultProps, sort: 'latest' });
    expect(sortState.setPage).toHaveBeenCalledTimes(1);
    expect(sortState.getCurrentPage()).toBe(1);
  });

  it('query tidak diubah oleh hook', () => {
    const { setPage, getCurrentPage, setCurrentPage } = createMockSetPage(3);

    const originalQuery = 'naruto';
    let currentQuery = originalQuery;

    const { rerender } = renderHook(
      (props) => useSearchReset({ ...props, query: currentQuery, setPage }),
      { initialProps: { ...defaultProps, query: currentQuery } }
    );

    // Change query value from outside
    currentQuery = 'one piece';
    rerender({ ...defaultProps, query: currentQuery });

    expect(setPage).toHaveBeenCalledTimes(1);
    expect(getCurrentPage()).toBe(1);
    // Ensure query variable was not mutated by the hook
    expect(currentQuery).toBe('one piece');
  });

  it('dependency array atau object baru dengan isi sama tidak memicu reset', () => {
    const { setPage, getCurrentPage, setCurrentPage } = createMockSetPage(3);

    const { rerender } = renderHook(
      (props) => useSearchReset({ ...props, setPage }),
      { initialProps: defaultProps }
    );

    setCurrentPage(3);

    // Pass brand new array instances for genres, formats, activeSelectedSources with IDENTICAL content
    rerender({
      genres: ['action'], // new reference
      formats: ['manga'], // new reference
      status: 'ongoing',
      sort: 'popular',
      query: 'naruto',
      activeSelectedSources: ['shinigami'] // new reference
    });

    expect(setPage).not.toHaveBeenCalled();
    expect(getCurrentPage()).toBe(3);
  });
});
