export const motionDuration = {
  instant: 0.08,
  fast: 0.14,
  normal: 0.2,
  slow: 0.32,
  page: 0.18,
} as const;

export const motionEase = {
  standard: [0.22, 1, 0.36, 1],
  softOut: [0.16, 1, 0.3, 1],
  sharp: [0.4, 0, 0.2, 1],
} as const;

export const motionSpring = {
  snappy: {
    type: "spring",
    stiffness: 520,
    damping: 34,
    mass: 0.7,
  },
  smooth: {
    type: "spring",
    stiffness: 360,
    damping: 32,
    mass: 0.9,
  },
  layout: {
    type: "spring",
    stiffness: 420,
    damping: 34,
    mass: 0.8,
  },
} as const;

export const transitions = {
  snappy: motionSpring.snappy,
  smooth: motionSpring.smooth,
  layout: motionSpring.layout,
  gentle: {
    duration: motionDuration.normal,
    ease: motionEase.standard,
  },
  page: {
    duration: motionDuration.page,
    ease: motionEase.softOut,
  },
} as const;

export const navigationTiming = {
  feedbackDelayMs: 180,
  recoveryTimeoutMs: 12_000,
} as const;
