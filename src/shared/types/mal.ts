/** External metadata identity; never a reading-provider MangaItem. */
export type MalRankingType = "all" | "manga" | "manhwa" | "manhua" | "bypopularity" | "favorite";

export interface MalPopularWork {
  malId: number;
  title: string;
  coverUrl: string;
  rank: number;
  score?: number | null;
  members: number | null;
  mediaType: string;
  nsfw: "white" | "gray" | "black" | null;
}

export type MalPopularFeed =
  | { status: "ready"; works: MalPopularWork[]; rankingType?: MalRankingType; fetchedAt: string; safeOnly: boolean }
  | { status: "unconfigured" | "unavailable"; works: []; message: string };
