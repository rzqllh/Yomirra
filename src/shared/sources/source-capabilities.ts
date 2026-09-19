export interface SourceCapabilities {
  popular: boolean;
  latest: boolean;
  search: boolean;
  detail: boolean;
  chapters: boolean;
  pages: boolean;
  // Optional additive capabilities for Source Engine V1
  filters?: boolean;
  multiLanguage?: boolean;
  auth?: boolean;
  related?: boolean;
  download?: boolean;
}

export const DEFAULT_CAPABILITIES: Readonly<SourceCapabilities> = Object.freeze({
  popular: false,
  latest: false,
  search: false,
  detail: false,
  chapters: false,
  pages: false,
  filters: false,
  multiLanguage: false,
  auth: false,
  related: false,
  download: false,
});

/**
 * Safely inspects whether a source declares a specific capability.
 * Returns false if source or capability is undefined/falsy.
 */
export function hasCapability(
  source: { capabilities?: Partial<SourceCapabilities> } | null | undefined,
  capability: keyof SourceCapabilities
): boolean {
  return Boolean(source?.capabilities?.[capability]);
}
