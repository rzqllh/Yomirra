"use client";

import { useLayoutEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { readBrowserCatalogScope } from "@/shared/lib/catalog-snapshot-scope";
import { useSettingsStore } from "@/shared/store/settings-store";

type CatalogPage = "home" | "popular";

export function useCatalogSnapshot<T>(page: CatalogPage) {
  const client = useQueryClient();
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const scope = readBrowserCatalogScope();
  if (!hideNsfw || !scope) return undefined;
  return client.getQueryData<T>(["catalog-snapshot", page, scope]);
}

export function useRememberCatalogSnapshot<T>(
  page: CatalogPage,
  scope: (string | undefined)[] | undefined,
  data: T,
) {
  const client = useQueryClient();
  useLayoutEffect(() => {
    if (scope) client.setQueryData(["catalog-snapshot", page, scope], data);
  }, [client, data, page, scope]);
}
