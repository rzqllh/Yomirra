export type ReadingDirection = "LTR" | "RTL" | "TTB";
export type ReaderMode = "PAGED" | "WEBTOON" | "CONTINUOUS_VERTICAL";

export interface ReaderSettings {
  direction: ReadingDirection;
  mode: ReaderMode;
  backgroundColor: string;
  padding: number;
  maxWidth: number;
}
