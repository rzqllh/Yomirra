import { useReducedMotion } from "motion/react";

export function useSafeMotion() {
  const shouldReduce = useReducedMotion();
  return {
    transition: shouldReduce ? { duration: 0 } : undefined,
    skipAnimations: shouldReduce,
  };
}
