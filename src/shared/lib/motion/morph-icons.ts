import type { MorphIconData } from "@/components/motion/morph-icon";

export interface MorphPair {
  off: MorphIconData;
  on: MorphIconData;
}

export const morphIconPairs = {
  bookmark: {
    off: "M7 4.5h10v15l-5-3-5 3Z",
    on: "M7 4.5h10v15l-5-3-5 3Z M9.5 10.5l1.6 1.6 3.4-3.4",
  },
  viewMode: {
    off: "M4 4h6v6H4Z M14 4h6v6h-6Z M4 14h6v6H4Z M14 14h6v6h-6Z",
    on: "M5 6h14 M5 12h14 M5 18h14",
  },
  disclosure: {
    off: "M6 9l6 6 6-6",
    on: "M6 15l6-6 6 6",
  },
  playback: {
    off: "M8 5l11 7-11 7Z",
    on: "M8 5v14 M16 5v14",
  },
} satisfies Record<string, MorphPair>;
