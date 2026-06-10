export const variants = {
  pressable: {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.01, y: -1 },
    tap: { scale: 0.97, y: 0 },
  },
  fadeUp: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
  pop: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
} as const;
