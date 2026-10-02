import { useCollectionStore } from "@/shared/store/collection-store";
import { useDownloadStore } from "@/shared/store/download-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useStatsStore } from "@/shared/store/stats-store";
import { useUpdateStore } from "@/shared/store/update-store";
import { clearLocalDataOwnerUid } from "./local-data-owner";
import { clearAutomaticCache } from "./reading-buffer";

const READER_SESSION_PREFIX = "yomirra-virtualizer-cache-";

export function clearUserScopedReadingState(): void {
  useHistoryStore.getState().clearHistory();
  useLibraryStore.getState().clearLibrary();
  useCollectionStore.getState().clearCollections();
  useUpdateStore.getState().clearUpdates();
  useStatsStore.getState().clearStats();
  useSourcePreferencesStore.getState().clearPreferences();

  useSettingsStore.setState({
    lastSyncedAt: null,
    mutedMangaKeys: [],
    perTitleSourcePreferences: {},
    guestBannerSnoozedUntil: null,
    guestBannerDismissCount: 0,
  });
}

function clearReaderSessionState(): void {
  if (typeof sessionStorage === "undefined") return;

  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(READER_SESSION_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  }
}

export async function clearSharedDeviceData(): Promise<void> {
  clearUserScopedReadingState();
  await useDownloadStore.getState().clearDownloads();
  await clearAutomaticCache();
  clearReaderSessionState();
  clearLocalDataOwnerUid();
}
