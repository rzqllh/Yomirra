export interface AppSettings {
  reader: {
    defaultDirection: "LTR" | "RTL" | "TTB";
    defaultMode: "PAGED" | "WEBTOON" | "CONTINUOUS_VERTICAL";
  };
  sources: {
    enabledIds: string[];
    nsfwEnabled: boolean;
  };
  ui: {
    theme: "light" | "dark" | "system";
  };
}

export const defaultSettings: AppSettings = {
  reader: {
    defaultDirection: "RTL",
    defaultMode: "PAGED",
  },
  sources: {
    enabledIds: ["shinigami"], // Shinigami enabled by default
    nsfwEnabled: false,
  },
  ui: {
    theme: "dark",
  },
};
