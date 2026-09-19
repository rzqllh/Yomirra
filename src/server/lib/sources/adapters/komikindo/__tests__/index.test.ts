import { describe, it, expect, vi, beforeEach } from "vitest";
import { KomikindoSource } from "../index";

const mockHttpClient = {
  getHtml: vi.fn(),
  getConfig: vi.fn().mockReturnValue({ baseUrl: "https://komikindo.ch" })
};

vi.mock("../../base/http-client", () => {
  return {
    HttpClient: class {
      constructor() {
        return mockHttpClient;
      }
    }
  };
});

// Mock Redis connection attempt inside filter-cache
vi.mock("../filter-cache", () => {
  return {
    komikindoFilterCache: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(true)
    }
  };
});

describe("KomikindoSource", () => {
  let source: KomikindoSource;

  beforeEach(() => {
    vi.clearAllMocks();
    source = new KomikindoSource();
  });

  describe("search", () => {
    it("should use /page/X/ route and parse results", async () => {
      const fixture = `
        <div class="animepost">
          <div class="animposx">
            <a itemprop="url" href="https://komikindo.ch/komik/solo-leveling/">
              <img itemprop="image" src="https://komikindo.ch/wp-content/uploads/2020/12/solo.jpg" />
            </a>
            <div class="tt">
              <h4>Solo Leveling</h4>
            </div>
          </div>
        </div>
      `;

      mockHttpClient.getHtml.mockResolvedValueOnce(fixture);

      const results = await source.search("solo", 1);
      
      expect(mockHttpClient.getHtml).toHaveBeenCalledWith("/page/1/", { s: "solo" });
      expect(results.mangas.length).toBe(1);
      expect(results.mangas[0].title).toBe("Solo Leveling");
      expect(results.mangas[0].id).toBe("solo-leveling");
      expect(results.mangas[0].coverUrl).toBe("https://komikindo.ch/wp-content/uploads/2020/12/solo.jpg");
    });
  });
});
