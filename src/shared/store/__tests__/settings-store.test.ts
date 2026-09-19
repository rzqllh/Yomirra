import { useSettingsStore } from '../settings-store';
import { beforeEach, describe, expect, it } from 'vitest';

describe('SettingsStore Notification Preferences', () => {
  beforeEach(() => {
    // Reset store state
    useSettingsStore.setState({
      checkOnAppStart: true,
      minimumCheckIntervalMinutes: 15,
      notifyForAllLibraryItems: true,
      mutedMangaKeys: [],
    });
  });

  it('has correct default values', () => {
    const state = useSettingsStore.getState();
    expect(state.checkOnAppStart).toBe(true);
    expect(state.minimumCheckIntervalMinutes).toBe(15);
    expect(state.notifyForAllLibraryItems).toBe(true);
    expect(state.mutedMangaKeys).toEqual([]);
  });

  it('toggles checkOnAppStart', () => {
    useSettingsStore.getState().setCheckOnAppStart(false);
    expect(useSettingsStore.getState().checkOnAppStart).toBe(false);
  });

  it('updates minimumCheckIntervalMinutes', () => {
    useSettingsStore.getState().setMinimumCheckIntervalMinutes(60);
    expect(useSettingsStore.getState().minimumCheckIntervalMinutes).toBe(60);
  });

  it('mutes a manga key without duplicates', () => {
    const key = 'sourceA::manga1';
    
    useSettingsStore.getState().muteManga(key);
    expect(useSettingsStore.getState().mutedMangaKeys).toEqual([key]);
    
    // Add again
    useSettingsStore.getState().muteManga(key);
    expect(useSettingsStore.getState().mutedMangaKeys).toEqual([key]); // No duplicates
  });

  it('unmutes a manga key', () => {
    const key = 'sourceA::manga1';
    const key2 = 'sourceA::manga2';
    
    useSettingsStore.setState({ mutedMangaKeys: [key, key2] });
    
    useSettingsStore.getState().unmuteManga(key);
    expect(useSettingsStore.getState().mutedMangaKeys).toEqual([key2]);
  });

  describe('Phase 6 Source Routing Preferences', () => {
    it('has correct routing defaults', () => {
      const state = useSettingsStore.getState();
      expect(state.routingMode).toBe('PREFERRED');
      expect(state.globalSourceOrder).toContain('mangadex');
      expect(state.preferredLanguages).toEqual(['id', 'en']);
      expect(state.perTitleSourcePreferences).toEqual({});
    });

    it('updates routing mode', () => {
      useSettingsStore.getState().setRoutingMode('MANUAL');
      expect(useSettingsStore.getState().routingMode).toBe('MANUAL');

      useSettingsStore.getState().setRoutingMode('AUTO_SAFE');
      expect(useSettingsStore.getState().routingMode).toBe('AUTO_SAFE');
    });

    it('updates global source order and preferred languages', () => {
      useSettingsStore.getState().setGlobalSourceOrder(['komiku', 'mangadex']);
      expect(useSettingsStore.getState().globalSourceOrder).toEqual(['komiku', 'mangadex']);

      useSettingsStore.getState().setPreferredLanguages(['en', 'id']);
      expect(useSettingsStore.getState().preferredLanguages).toEqual(['en', 'id']);
    });

    it('sets and clears per-title source preference', () => {
      useSettingsStore.getState().setPerTitleSourcePreference('title-123', 'komiknesia');
      expect(useSettingsStore.getState().perTitleSourcePreferences['title-123']).toBe('komiknesia');

      useSettingsStore.getState().clearPerTitleSourcePreference('title-123');
      expect(useSettingsStore.getState().perTitleSourcePreferences['title-123']).toBeUndefined();
    });
  });
});
