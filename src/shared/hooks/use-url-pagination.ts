"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function parseCatalogPage(value?: string | null): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function writeCatalogPageParam(
  searchParamsString: string,
  page: number
): string {
  const params = new URLSearchParams(searchParamsString);
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  return params.toString();
}

/**
 * Keeps lightweight pagination context in browser history/URL while the
 * response payload itself stays in React Query's in-memory cache.
 */
export function useUrlPagination(): [
  number,
  React.Dispatch<React.SetStateAction<number>>,
] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() || "";
  const urlPage = parseCatalogPage(searchParams?.get("page"));
  const [page, setPageState] = React.useState(urlPage);
  const pageRef = React.useRef(urlPage);

  React.useEffect(() => {
    pageRef.current = urlPage;
    setPageState(urlPage);
  }, [urlPage]);

  const setPage = React.useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (value) => {
      const resolved =
        typeof value === "function"
          ? value(pageRef.current)
          : value;
      const nextPage = Math.max(1, Math.floor(Number(resolved) || 1));
      // Filter and route handlers can reset the page in the same interaction.
      // A repeated reset must not overwrite a newer sort/source URL with the
      // previous render's search params while navigation is still pending.
      if (nextPage === pageRef.current) return;
      pageRef.current = nextPage;
      setPageState(nextPage);

      const suffix = writeCatalogPageParam(searchParamsString, nextPage);
      // Replacing an unchanged URL can cancel a source/query navigation that was
      // just pushed by the same interaction.
      if (suffix === searchParamsString) return;
      router.replace(suffix ? `${pathname}?${suffix}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParamsString]
  );

  return [page, setPage];
}
