import type { MetadataWork } from "@/shared/lib/metadata-catalog";
import type { ExternalWorkIds } from "@/shared/sources/source-types";
export interface ParseCatalogRecordOptions {
  verifiedThirdPartyIdProviders?: ReadonlyArray<keyof ExternalWorkIds>;
}
export function parseCatalogRecord(
  value: unknown,
  allRatings?: boolean,
  options?: ParseCatalogRecordOptions
): MetadataWork | null;
