import { KEIYOUSHI_CANDIDATES } from "@/shared/sources/keiyoushi-candidates";
import { KeiyoushiHtmlAdapter } from "./html-adapter";

/**
 * Isolated, disabled adapters for explicit owner/admin diagnostic probes only.
 * No candidate is registered in Yomirra's live source registry or discovery.
 * API/protobuf candidates require dedicated implementations before staging.
 */
const stagedSources = new Map(
  KEIYOUSHI_CANDIDATES
    .filter((candidate) => candidate.engine !== "api")
    .map((candidate) => [candidate.id, new KeiyoushiHtmlAdapter(candidate)] as const)
);

export function getStagedKeiyoushiSource(id: string): KeiyoushiHtmlAdapter | undefined {
  return stagedSources.get(id);
}

export function getStagedKeiyoushiSourceIds(): string[] {
  return [...stagedSources.keys()];
}
