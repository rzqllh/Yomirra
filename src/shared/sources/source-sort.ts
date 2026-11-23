import type { SourceMetadata } from "./source-types";

const collator = new Intl.Collator("id", { sensitivity: "base", numeric: true });

/** User preference changes ordering only, not health or access policy. */
export function isSourceActiveForDisplay(source: SourceMetadata, disabled: ReadonlySet<string>): boolean {
  return source.isEnabled === true && source.isInstalled === true &&
    !source.maintenance && source.status !== "in-fix" &&
    source.status !== "in-dev" && !disabled.has(source.id);
}

export function sortSourcesForDisplay(
  sources: readonly SourceMetadata[],
  disabledSourceIds: Iterable<string>
): SourceMetadata[] {
  const disabled = new Set(disabledSourceIds);
  return [...sources].sort((a, b) => {
    const aActive = isSourceActiveForDisplay(a, disabled);
    const bActive = isSourceActiveForDisplay(b, disabled);
    if (aActive !== bActive) return aActive ? -1 : 1;
    return collator.compare(a.name, b.name) || collator.compare(a.id, b.id);
  });
}
