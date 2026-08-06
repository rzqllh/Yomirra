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
});
