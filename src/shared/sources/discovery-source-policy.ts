import type { SourceMetadata } from "@/shared/sources/source-types";
import { isSourceContentVisible } from "./content-policy";

const NON_OPERATIONAL_STATUSES = new Set(["unavailable", "in-fix", "in-dev"]);

export function parseDisabledSourceIdsCookie(value?: string): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(parsed.filter((item): item is string => typeof item === "string" && item.length > 0))
    );
  } catch {
    return [];
  }
}

export function isDiscoverySourceSystemEligible(source: SourceMetadata): boolean {
  return (
    source.isEnabled !== false &&
    source.isInstalled === true &&
    !NON_OPERATIONAL_STATUSES.has(String(source.status || ""))
  );
}

export function isSearchSourceSystemEligible(source: SourceMetadata): boolean {
  return (
    source.isEnabled !== false &&
    source.isInstalled === true &&
    source.capabilities?.search === true &&
    !NON_OPERATIONAL_STATUSES.has(String(source.status || ""))
  );
}

export function isDiscoverySourceSelected(
  source: SourceMetadata,
  disabledSourceIds: Iterable<string>
): boolean {
  if (!isDiscoverySourceSystemEligible(source)) return false;

  const disabled = disabledSourceIds instanceof Set
    ? disabledSourceIds
    : new Set(disabledSourceIds);

  return !disabled.has(source.id);
}

export function selectDiscoverySources(
  sources: SourceMetadata[],
  disabledSourceIds: Iterable<string>
): SourceMetadata[] {
  const disabled = disabledSourceIds instanceof Set
    ? disabledSourceIds
    : new Set(disabledSourceIds);

  return sources.filter((source) => isDiscoverySourceSelected(source, disabled));
}


export function resolveDiscoverySourceId(
  explicitSourceId: string | null | undefined,
  eligibleSources: SourceMetadata[]
): string {
  const explicit = explicitSourceId?.trim();
  if (explicit) return explicit;
  return eligibleSources[0]?.id || "";
}

export function resolveQuickSearchScope(sources: SourceMetadata[], disabledSources: string[], rememberedSourceId: string | null, hideNsfw = true) {
  const eligible = selectDiscoverySources(sources, disabledSources).filter((source) => isSourceContentVisible(source, hideNsfw));
  const sourceId = resolveDiscoverySourceId(rememberedSourceId, eligible);
  const source = sources.find((item) => item.id === sourceId);
  const selected = eligible.find((item) => item.id === sourceId);
  const searchable = selected && isSearchSourceSystemEligible(selected);
  return { sourceId, source, sourceIds: searchable ? [sourceId] : [],
    reason: !sourceId ? "empty" : !selected ? "unavailable" : !searchable ? "unsupported" : null };
}
