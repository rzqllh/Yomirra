import type { SourceHealthSnapshot } from "./types";

/** A catalogue probe is not reader verification. Even a deep pages probe
 * observes page references, not successful image decoding on every device. */
export function hasReaderPageEvidence(snapshot: SourceHealthSnapshot): boolean {
  return snapshot.status === "HEALTHY" &&
    snapshot.metadata?.probeType === "deep" &&
    snapshot.stage === "pages" &&
    !snapshot.metadata.pagesSkipped &&
    Boolean(snapshot.metadata.sampleChapterId?.trim());
}
