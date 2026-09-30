import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";

// Admin source overrides can change while a PWA session stays open.
// Refresh metadata at lifecycle boundaries; cached results remain visible.
export const sourceQueryOptions = queryOptions({
  queryKey: ["sources"],
  queryFn: () => apiClient.getSources(),
  staleTime: 0,
  refetchOnMount: "always",
  refetchOnWindowFocus: "always",
  refetchOnReconnect: "always",
});
