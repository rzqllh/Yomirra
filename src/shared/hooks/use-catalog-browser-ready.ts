import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getBrowserSnapshot = () => true;
const getServerSnapshot = () => false;

// Preserve the server's first render at hydration and expose warm browser
// queries immediately when the App Router mounts an already visited page.
export function useCatalogBrowserReady() {
  return useSyncExternalStore(subscribe, getBrowserSnapshot, getServerSnapshot);
}
