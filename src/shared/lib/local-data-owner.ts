export const LOCAL_DATA_OWNER_KEY = "yomirra-local-data-owner-uid";

export function shouldResetLocalDataForAccount(
  currentOwnerUid: string | null,
  nextAuthenticatedUid: string
): boolean {
  return currentOwnerUid !== null && currentOwnerUid !== nextAuthenticatedUid;
}

export function getLocalDataOwnerUid(
  storage: Pick<Storage, "getItem"> | undefined =
    typeof localStorage === "undefined" ? undefined : localStorage
): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(LOCAL_DATA_OWNER_KEY);
  } catch {
    return null;
  }
}

export function setLocalDataOwnerUid(
  uid: string,
  storage: Pick<Storage, "setItem"> | undefined =
    typeof localStorage === "undefined" ? undefined : localStorage
): void {
  if (!storage) return;
  try {
    storage.setItem(LOCAL_DATA_OWNER_KEY, uid);
  } catch {
    // Storage availability must not block authentication.
  }
}

export function clearLocalDataOwnerUid(
  storage: Pick<Storage, "removeItem"> | undefined =
    typeof localStorage === "undefined" ? undefined : localStorage
): void {
  if (!storage) return;
  try {
    storage.removeItem(LOCAL_DATA_OWNER_KEY);
  } catch {
    // Best effort during device cleanup.
  }
}
