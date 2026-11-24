import { describe, expect, it } from "vitest";
import { normalizeMangaItem, normalizeMangaDetail } from "../normalizer";
import type { MangaDexManga } from "../types";

describe("MangaDex catalog identity", () => {
  it("preserves aliases and namespaced identifiers without extra requests", () => {
    const fixture: MangaDexManga = {
      id:"fixture", type:"manga", relationships:[],
      attributes:{title:{en:"Translated"},altTitles:[{ko:"원제"},{en:"Other title"}],description:{en:"Fixture"},status:"ongoing",year:2020,contentRating:"safe",tags:[],originalLanguage:"ko",publicationDemographic:null,lastChapter:null,lastVolume:null,links:{al:"100",mal:"200",mu:"abc123",raw:"https://example.com/raw"}},
    };
    for (const result of [normalizeMangaItem(fixture),normalizeMangaDetail(fixture)]) {
      expect(result.originalTitle).toBe("원제");
      expect(result.alternativeTitles).toEqual(["원제","Other title"]);
      expect(result.externalWorkIds).toEqual({anilist:"100",my_anime_list:"200",manga_updates:"abc123"});
      expect(result.id).toBe("fixture");
    }
  });
});
