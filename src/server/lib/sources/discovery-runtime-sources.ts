import { getRuntimeSources } from "./runtime-sources";
import type { SourceHealthSnapshot } from "./health/types";
import type { SourceMetadata } from "@/shared/sources/source-types";

/** Monitoring failures are advisory, not automatic source maintenance.
 * Explicit operator maintenance must remain intact even after a healthy probe.
 */
export function applyDiscoveryMaintenance(
  source: SourceMetadata,
  _snapshot?: SourceHealthSnapshot
): SourceMetadata {
  return source;
}

export async function getDiscoveryRuntimeSources(): Promise<SourceMetadata[]> {
  return getRuntimeSources();
}
