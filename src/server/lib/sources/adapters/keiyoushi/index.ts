import { KEIYOUSHI_CANDIDATES } from "@/shared/sources/keiyoushi-candidates";
import type { MangaSource } from "@/shared/sources/source-types";
import { KeiyoushiHtmlAdapter } from "./html-adapter";
import { KeiyoushiApiAdapter } from "./api-adapter";
import { portedKeiyoushiSources } from "../engines";

/**
 * All 31 owner-ZIP candidates are staged for diagnostic access only.
 * Priority: High-fidelity shared engines (MangaThemesia, NatsuId, Madara, GenericWp, Dedicated API)
 * are used for the 27 viable sources.
 * Prototypes/stubs are kept for the remaining 4 (1 duplicate Komikindo, 3 DRM/paywalled/token-blocked).
 * None is registered in public discovery, live sourceRegistry or public sourceMap.
 */
const engineSourceMap = new Map(portedKeiyoushiSources.map(engine => [engine.id, engine]));

const stagedSources = new Map<string, MangaSource>(
  KEIYOUSHI_CANDIDATES.map((candidate) => {
    // Prefer the high-fidelity engine if available
    const engine = engineSourceMap.get(candidate.id);
    if (engine) {
      return [candidate.id, engine];
    }
    // Fallback to candidate prototype adapter
    return [
      candidate.id,
      candidate.engine === "api"
        ? new KeiyoushiApiAdapter(candidate)
        : new KeiyoushiHtmlAdapter(candidate),
    ];
  })
);

export function getStagedKeiyoushiSource(id: string): MangaSource | undefined {
  const normalized = id.toLowerCase().trim();
  return stagedSources.get(normalized === "ainz-scans-id" ? "ainzscansid" : normalized);
}

export function getStagedKeiyoushiSourceIds(): string[] {
  return [...stagedSources.keys()];
}
