import { describe, it, expect, beforeEach } from "vitest";
import { useSearchFilterStore } from "../search-filter-store";

describe("search-filter-store", () => {
  beforeEach(() => {
    useSearchFilterStore.setState({
      selectedSources: null,
      genres: [],
      formats: [],
      status: "",
      sort: "popular"
    });
  });

  describe("pruneFilters", () => {
    it("should retain valid filters and remove invalid ones", () => {
      const store = useSearchFilterStore.getState();

      store.applyFilters({
        genres: ["action", "romance", "horror"],
        formats: ["manga", "manhwa"],
        status: "ongoing",
        sort: "latest"
      });

      // only action and romance are supported now
      const supportedGenres = ["action", "romance"];
      const supportedFormats = ["manga"];
      const supportedStatuses = ["completed"];
      const supportedSorts = ["latest", "popular"];

      useSearchFilterStore.getState().pruneFilters(supportedGenres, supportedFormats, supportedStatuses, supportedSorts);

      const updated = useSearchFilterStore.getState();

      expect(updated.genres).toEqual(["action", "romance"]);
      expect(updated.formats).toEqual(["manga"]);
      expect(updated.status).toBe(""); // ongoing was not in supportedStatuses
      expect(updated.sort).toBe("latest");
    });

    it("should not trigger state update if nothing changes", () => {
      const store = useSearchFilterStore.getState();

      store.applyFilters({
        genres: ["action"],
        formats: ["manga"],
        status: "ongoing",
        sort: "latest"
      });

      const beforeRef = useSearchFilterStore.getState();

      useSearchFilterStore.getState().pruneFilters(["action"], ["manga"], ["ongoing"], ["latest"]);

      const afterRef = useSearchFilterStore.getState();

    });
  });

  describe("source selection & migration to version 2", () => {
    it("defaults to hasCustomizedSources: false and selectedSources: null", () => {
      const state = useSearchFilterStore.getState();
      expect(state.hasCustomizedSources).toBe(false);
      expect(state.selectedSources).toBeNull();
    });

    it("marks hasCustomizedSources as true when setSelectedSources is called", () => {
      useSearchFilterStore.getState().setSelectedSources(["komikindo"]);
      const state = useSearchFilterStore.getState();
      expect(state.hasCustomizedSources).toBe(true);
      expect(state.selectedSources).toEqual(["komikindo"]);
    });

    it("marks hasCustomizedSources as true when toggleSource is called", () => {
      useSearchFilterStore.getState().toggleSource("komikindo", ["shinigami", "komikindo"]);
      const state = useSearchFilterStore.getState();
      expect(state.hasCustomizedSources).toBe(true);
      // Removed komikindo from candidates
      expect(state.selectedSources).toEqual(["shinigami"]);
    });

    it("migrates legacy persisted array state cleanly by preserving array and setting hasCustomizedSources = true", () => {
      const persistOptions = (useSearchFilterStore as any).persist.getOptions();
      const legacyState = {
        selectedSources: ["shinigami", "mangadex"],
        genres: ["action"],
      };

      const migrated = persistOptions.migrate(legacyState, 1);
      expect(migrated.selectedSources).toEqual(["shinigami", "mangadex"]);
      expect(migrated.hasCustomizedSources).toBe(true);
      expect(migrated.genres).toEqual(["action"]);
    });

    it("migrates legacy null/undefined selectedSources cleanly without forcing select-all", () => {
      const persistOptions = (useSearchFilterStore as any).persist.getOptions();
      const legacyState = {
        selectedSources: null,
      };

      const migrated = persistOptions.migrate(legacyState, 1);
      expect(migrated.selectedSources).toBeNull();
      expect(migrated.hasCustomizedSources).toBe(false);
    });
  });
});
