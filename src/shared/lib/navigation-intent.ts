export const NAVIGATION_INTENT_EVENT = "yomirra:navigation-intent";

export interface NavigationIntentDetail {
  href: string;
}

let pendingHref: string | null = null;

export function beginNavigationIntent(href: string): boolean {
  if (typeof window === "undefined" || !href) return true;
  if (pendingHref === href) return false;

  pendingHref = href;
  window.dispatchEvent(
    new CustomEvent<NavigationIntentDetail>(NAVIGATION_INTENT_EVENT, {
      detail: { href },
    })
  );
  return true;
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
