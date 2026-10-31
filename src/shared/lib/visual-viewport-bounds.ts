/**
 * Fixed drawer elements are positioned relative to the layout viewport, whereas
 * the browser toolbar/keyboard reduces or moves the visual viewport. Keep the
 * bottom action bar inside the latter without assuming safe-area env includes
 * browser chrome.
 */
export interface DrawerViewportBounds {
  height: number;
  bottom: number;
}

export function getVisualViewportBounds(
  layoutHeight: number,
  visualHeight: number,
  visualOffsetTop: number
): DrawerViewportBounds {
  const height = Math.max(0, Math.round(visualHeight));
  const bottom = Math.max(0, Math.round(layoutHeight - visualHeight - visualOffsetTop));
  return { height, bottom };
}
