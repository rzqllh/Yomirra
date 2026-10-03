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

  React.useEffect(() => {
    setPageState(urlPage);
  }, [urlPage]);

  const setPage = React.useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (value) => {
      const resolved =
        typeof value === "function"
          ? value(page)
          : value;
      const nextPage = Math.max(1, Math.floor(Number(resolved) || 1));
      setPageState(nextPage);

      const suffix = writeCatalogPageParam(searchParamsString, nextPage);
      router.replace(suffix ? `${pathname}?${suffix}` : pathname, {
        scroll: false,
      });
    },
    [page, pathname, router, searchParamsString]
  );

  return [page, setPage];
}
