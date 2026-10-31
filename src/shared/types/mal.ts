/** External metadata identity; never a reading-provider MangaItem. */
export interface MalPopularWork {
  malId: number;
  title: string;
  coverUrl: string;
  rank: number;
  members: number | null;
  mediaType: string;
  nsfw: "white" | "gray" | "black" | null;
}
export type MalPopularFeed =
  | { status: "ready"; works: MalPopularWork[]; fetchedAt: string; safeOnly: boolean }
  | { status: "unconfigured" | "unavailable"; works: []; message: string };
