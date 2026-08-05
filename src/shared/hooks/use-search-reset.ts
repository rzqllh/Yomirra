import * as React from "react";

interface UseSearchResetProps {
  genres: string[];
  formats: string[];
  status: string;
  sort: string;
  query: string;
  activeSelectedSources: string[];
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export function useSearchReset({
  genres,
  formats,
  status,
  sort,
  query,
  activeSelectedSources,
  setPage
}: UseSearchResetProps) {
  const previousRefs = React.useRef({ genres, formats, status, sort, query, activeSelectedSources });

  React.useEffect(() => {
    const prev = previousRefs.current;

    // Arrays need shallow compare to avoid infinite loops if refs are unstable
    const genresChanged = prev.genres.length !== genres.length || prev.genres.some((g, i) => g !== genres[i]);
    const formatsChanged = prev.formats.length !== formats.length || prev.formats.some((f, i) => f !== formats[i]);
    const sourcesChanged = prev.activeSelectedSources.length !== activeSelectedSources.length ||
                           prev.activeSelectedSources.some((s, i) => s !== activeSelectedSources[i]);

    const filterOrSourceChanged =
      genresChanged ||
      formatsChanged ||
      prev.status !== status ||
      prev.sort !== sort ||
      sourcesChanged;

    const queryChanged = prev.query !== query;

    if (filterOrSourceChanged || queryChanged) {
      setPage((currentPage) => {
        if (currentPage !== 1) return 1;
        return currentPage;
      });
    }

    previousRefs.current = { genres, formats, status, sort, query, activeSelectedSources };
  }, [genres, formats, status, sort, query, activeSelectedSources, setPage]);
}
