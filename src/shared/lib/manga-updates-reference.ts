/** A metadata-only reference, never a reading source or proof of safety. */
export interface MangaUpdatesReference {
  id: string;
  title: string;
  format: "manga" | "manhwa" | "manhua";
}
export function mangaUpdatesNumericId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9a-z][a-z0-9]{0,12}$/.test(value) || !/[a-z]/.test(value)) return null;
  const numeric = Number.parseInt(value, 36);
  return Number.isSafeInteger(numeric) && numeric > 0 && numeric.toString(36) === value ? numeric : null;
}
export function mangaUpdatesReferenceHref(id: string): string | undefined {
  return mangaUpdatesNumericId(id) === null ? undefined : "https://www.mangaupdates.com/series/" + id;
}
