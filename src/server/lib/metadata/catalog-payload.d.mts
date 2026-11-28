import type {MetadataWork} from "@/shared/lib/metadata-catalog";
export function encodeCatalogPayload(value:MetadataWork):Buffer;
export function decodeCatalogPayload(value:unknown):MetadataWork;
