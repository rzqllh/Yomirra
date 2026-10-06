export interface SearchSlotGeometry {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface SearchMorphInterpolated {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
  progress: number;
}

/**
 * Calculates scroll-linked search morph progress and interpolated geometry.
 * y = max(slot.top - scrollY, target.top)
 * progress p = clamp((slot.top - y) / (slot.top - target.top), 0, 1)
 */
export function calculateSearchMorphProgress(
  slot: SearchSlotGeometry,
  target: SearchSlotGeometry,
  scrollY: number
): SearchMorphInterpolated {
  const deltaY = slot.top - target.top;

  // If slot is at or above target, or geometry not measured, stay docked (p = 1)
  if (deltaY <= 0) {
    return {
      x: target.left,
      y: target.top,
      width: target.width,
      height: target.height,
      borderRadius: target.borderRadius,
      progress: 1,
    };
  }

  // Follow natural scroll, clamped so it never moves above target.top
  const y = Math.max(slot.top - scrollY, target.top);
  const rawProgress = (slot.top - y) / deltaY;
  const progress = Math.min(Math.max(rawProgress, 0), 1);

  const x = slot.left + progress * (target.left - slot.left);
  const width = slot.width + progress * (target.width - slot.width);
  const height = slot.height + progress * (target.height - slot.height);
  const borderRadius = slot.borderRadius + progress * (target.borderRadius - slot.borderRadius);

  return {
    x,
    y,
    width,
    height,
    borderRadius,
    progress,
  };
}
