import { transitions } from "./tokens";

export const pressMotion = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.01, y: -1 },
  tap: { scale: 0.97, y: 0 },
  transition: transitions.snappy,
} as const;

export const layoutMotion = {
  layout: true,
  transition: transitions.layout,
} as const;

export const variants = {
  pressable: {
    rest: pressMotion.rest,
    hover: pressMotion.hover,
    tap: pressMotion.tap,
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
