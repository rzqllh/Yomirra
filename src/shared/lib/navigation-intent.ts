export const NAVIGATION_INTENT_EVENT = "yomirra:navigation-intent";

export interface NavigationIntentDetail {
  href: string;
}

let pendingHref: string | null = null;
interface NavigationParent {
  from: string;
  to: string;
}

let pendingParent: NavigationParent | undefined;

export function beginNavigationIntent(href: string, mode: "push" | "replace" = "push"): boolean {
  if (typeof window === "undefined" || !href) return true;
  if (pendingHref === href) return false;

  if (mode === "replace") {
    const parent = getNavigationParentHref();
    const target = new URL(href, window.location.href);
    pendingParent = parent && target.origin === window.location.origin
      ? { from: new URL(parent, window.location.href).href, to: target.href }
      : undefined;
  } else {
    rememberNavigationParent(href);
  }
  pendingHref = href;
  window.dispatchEvent(
    new CustomEvent<NavigationIntentDetail>(NAVIGATION_INTENT_EVENT, {
      detail: { href },
    })
  );
  return true;
}

export function rememberNavigationParent(href: string) {
  if (typeof window === "undefined") return;
  const target = new URL(href, window.location.href);
  if (target.origin === window.location.origin && target.href !== window.location.href) {
    pendingParent = { from: window.location.href, to: target.href };
  }
}

export function commitNavigationParent() {
  if (typeof window === "undefined" || pendingParent?.to !== window.location.href) return;

  const parent = pendingParent;
  pendingParent = undefined;
  if (!("navigation" in window)) {
    // Keep the parent on its history entry so nested Back works without the Navigation API.
    window.history.replaceState({ ...window.history.state, yomirraNavigationParent: parent }, "");
  }
}

export function getNavigationParentHref(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const navigation = (window as Window & {
    navigation?: {
      currentEntry: { index: number } | null;
      entries(): { url: string | null }[];
    };
  }).navigation;
  const storedParent: NavigationParent | undefined = window.history.state?.yomirraNavigationParent;
  const parent = pendingParent?.to === window.location.href ? pendingParent : storedParent;
  const previous = navigation?.currentEntry
    ? navigation.entries()[navigation.currentEntry.index - 1]?.url
    : parent?.to === window.location.href ? parent.from : undefined;
  if (!previous) return undefined;
  const url = new URL(previous);
  if (url.origin === window.location.origin) return url.pathname + url.search + url.hash;
}

export function hasNavigationParent(href: string) {
  if (typeof window === "undefined") return false;
  const target = new URL(href, window.location.href);
  return target.origin === window.location.origin &&
    getNavigationParentHref() === target.pathname + target.search + target.hash;
}

export function endNavigationIntent() {
  pendingHref = null;
}

export function getNavigationPathname(href: string): string {
  const path = href.split(/[?#]/, 1)[0];
  return path || "/";
}

export function isNavigationIntentComplete(
  pendingHref: string | null,
  pathname: string | null
): boolean {
  if (!pendingHref || !pathname) return false;
  return getNavigationPathname(pendingHref) === pathname;
}
