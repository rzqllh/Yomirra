import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useCatalogSnapshot, useRememberCatalogSnapshot } from "../catalog-snapshot";
import { readBrowserCatalogScope } from "@/shared/lib/catalog-snapshot-scope";
import { useSettingsStore } from "@/shared/store/settings-store";

const sourceCookie = "yomirra-disabled-sources";
const sourcePreferences = JSON.stringify(["source-a"]);

afterEach(() => {
  document.cookie = `${sourceCookie}=; path=/; max-age=0`;
  useSettingsStore.setState({ hideNsfw: true });
});

describe("browser catalog snapshot", () => {
  it("restores the same page and scope immediately, including encoded source preferences", () => {
    document.cookie = `${sourceCookie}=${encodeURIComponent(sourcePreferences)}; path=/`;
    const scope = readBrowserCatalogScope();
    expect(scope).toContain(sourcePreferences);
    const client = new QueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const home = [{ title: "Safe title" }];
    const seed = renderHook(() => useRememberCatalogSnapshot("home", scope, home), { wrapper });
    seed.unmount();

    const snapshot = renderHook(({ page }) => useCatalogSnapshot(page), {
      wrapper,
      initialProps: { page: "home" as "home" | "popular" },
    });
    expect(snapshot.result.current).toBe(home);

    snapshot.rerender({ page: "popular" });
    expect(snapshot.result.current).toBeUndefined();
    document.cookie = `${sourceCookie}=${encodeURIComponent("[]")}; path=/`;
    snapshot.rerender({ page: "home" });
    expect(snapshot.result.current).toBeUndefined();

    document.cookie = `${sourceCookie}=${encodeURIComponent(sourcePreferences)}; path=/`;
    act(() => useSettingsStore.setState({ hideNsfw: false }));
    expect(snapshot.result.current).toBeUndefined();
  });
});
