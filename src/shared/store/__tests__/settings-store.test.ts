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

  describe('Guest Sync Reminder Banner State', () => {
    beforeEach(() => {
      useSettingsStore.getState().resetGuestBanner();
    });

    it('has correct defaults', () => {
      const state = useSettingsStore.getState();
      expect(state.guestBannerSnoozedUntil).toBeNull();
      expect(state.guestBannerDismissCount).toBe(0);
    });

    it('snoozes for 7 days on initial dismiss with 5 items', () => {
      const now = Date.now();
      useSettingsStore.getState().dismissGuestBanner(5);
      const state = useSettingsStore.getState();
      expect(state.guestBannerDismissCount).toBe(1);
      expect(state.guestBannerSnoozedUntil).toBeGreaterThanOrEqual(now + 7 * 86400 * 1000 - 1000);
      expect(state.guestBannerSnoozedUntil).toBeLessThanOrEqual(now + 7 * 86400 * 1000 + 1000);
    });

    it('escalates snooze to 3 days when items >= 15 and previously dismissed', () => {
      const now = Date.now();
      // First dismiss with 5 items
      useSettingsStore.getState().dismissGuestBanner(5);
      expect(useSettingsStore.getState().guestBannerDismissCount).toBe(1);

      // Second dismiss with 16 items -> should escalate to 3 days
      useSettingsStore.getState().dismissGuestBanner(16);
      const state = useSettingsStore.getState();
      expect(state.guestBannerDismissCount).toBe(2);
      expect(state.guestBannerSnoozedUntil).toBeGreaterThanOrEqual(now + 3 * 86400 * 1000 - 1000);
      expect(state.guestBannerSnoozedUntil).toBeLessThanOrEqual(now + 3 * 86400 * 1000 + 1000);
    });

    it('resets snooze and count with resetGuestBanner', () => {
      useSettingsStore.getState().dismissGuestBanner(10);
      expect(useSettingsStore.getState().guestBannerDismissCount).toBe(1);
      expect(useSettingsStore.getState().guestBannerSnoozedUntil).not.toBeNull();

      useSettingsStore.getState().resetGuestBanner();
      expect(useSettingsStore.getState().guestBannerDismissCount).toBe(0);
      expect(useSettingsStore.getState().guestBannerSnoozedUntil).toBeNull();
    });
  });
});
