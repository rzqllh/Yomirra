import { KEIYOUSHI_CANDIDATES } from "@/shared/sources/keiyoushi-candidates";
import type { MangaSource } from "@/shared/sources/source-types";
import { KeiyoushiHtmlAdapter } from "./html-adapter";
import { KeiyoushiApiAdapter } from "./api-adapter";

/**
 * All 31 owner-ZIP candidates are staged for diagnostic access only.
 * None is registered in public discovery, live sourceRegistry or sourceMap.
 * Compilation and fixture tests are not a substitute for upstream parity.
 */
const stagedSources = new Map<string, MangaSource>(
  KEIYOUSHI_CANDIDATES.map((candidate) => [
    candidate.id,
    candidate.engine === "api"
      ? new KeiyoushiApiAdapter(candidate)
      : new KeiyoushiHtmlAdapter(candidate),
  ])
);

export function getStagedKeiyoushiSource(id: string): MangaSource | undefined {
  return stagedSources.get(id);
}

export function getStagedKeiyoushiSourceIds(): string[] {
  return [...stagedSources.keys()];
}
