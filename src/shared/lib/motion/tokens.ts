export const motionDuration = {
  instant: 0.08,
  fast: 0.14,
  normal: 0.2,
  slow: 0.32,
  page: 0.45,
};

export const motionEase = {
  standard: [0.22, 1, 0.36, 1],
  softOut: [0.16, 1, 0.3, 1],
  sharp: [0.4, 0, 0.2, 1],
};

export const transitions = {
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
  gentle: {
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1],
  },
} as const;
