import { describe, expect, it } from "vitest";
import { sourceRegistry } from "../source-registry";
import { KEIYOUSHI_CANDIDATES } from "../keiyoushi-candidates";
import { sourceMap } from "@/server/lib/sources/adapters";
import { getStagedKeiyoushiSource } from "@/server/lib/sources/adapters/keiyoushi";

// Directory names from the owner's src.zip, 2026-11-24. Explicit aliases
// preserve persisted Yomirra source IDs; no new duplicate public providers.
const builtIn = {
  "asura-scans": "asurascans", doujindesu: "doujindesu", komikindo: "komikindo",
  komiknesia: "komiknesia", komiku: "komiku", "komiku-ii": "komiku-ii",
  mangadex: "mangadex", shinigami: "shinigami", "west-manga": "westmanga",
};
const staged = [
  "ainz-scans-id", "akuma", "astral-scans", "cosmicscans", "crotpedia",
  "dojing-net", "doujinku", "dreamteams-scans", "hentai-crot", "hentaihand",
  "izanami-scans", "kiryuu", "komikindoid", "kumapoi", "manga-plus-by-shueisha",
  "mangasusu", "mangatoon-limited", "manhuarm", "manhwa-indo", "manhwa-list",
  "manhwadesu", "manhwaland-mom", "mihentai", "mikoroku", "pix-hentai",
  "ryukomik", "sekte-doujin", "shiro-doujin", "soul-scans", "tooncubus", "webcomics",
];

describe("owner source archive inventory", () => {
  it("accounts for all 40 directories with existing stable IDs and no public replacement", () => {
    const directories = [...Object.keys(builtIn), ...staged];
    expect(directories).toHaveLength(40);
    expect(new Set(directories).size).toBe(40);
    expect(sourceRegistry.map(source => source.id).sort()).toEqual(Object.values(builtIn).sort());
    for (const id of Object.values(builtIn)) expect(sourceMap.get(id)?.id).toBe(id);
    expect(KEIYOUSHI_CANDIDATES.map(candidate => candidate.zipDirectory).sort()).toEqual([...staged].sort());
    for (const directory of staged) {
      const candidate = KEIYOUSHI_CANDIDATES.find(item => item.zipDirectory === directory)!;
      expect(candidate).toBeDefined();
      expect(sourceMap.has(candidate.id)).toBe(false);
      expect(getStagedKeiyoushiSource(candidate.id)?.id).toBe(candidate.id);
      expect(getStagedKeiyoushiSource(candidate.id)?.isEnabled).toBe(false);
    }
  });
});
