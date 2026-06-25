import { NextResponse } from "next/server";
import { sourceRegistry } from "@/shared/sources/source-registry";
import type { SourceMetadata } from "@/shared/sources/source-types";

/**
 * Returns a list of source IDs that are marked as NSFW.
 * This includes both static registry sources and SECRET_EXTENSION_SOURCES.
 * Safe to expose to the client — only returns IDs, not URLs or secrets.
 */
export async function GET() {
  const allSources: SourceMetadata[] = [...sourceRegistry];

  // Include secret extension sources (server-only env)
  const secretRaw = process.env.SECRET_EXTENSION_SOURCES;
  if (secretRaw) {
    try {
      const secretSources: SourceMetadata[] = JSON.parse(secretRaw);
      allSources.push(...secretSources);
    } catch {
      // ignore parse errors
    }
  }

  const nsfwSourceIds = allSources
    .filter((s) => s.isNsfw === true)
    .map((s) => s.id);

  // Fallback for legacy source IDs that might be saved in user's library before they were renamed
  const legacyNsfwIds = ["project-alpha", "project-beta", "project-gamma", "project-delta"];
  legacyNsfwIds.forEach(id => {
    if (!nsfwSourceIds.includes(id)) {
      nsfwSourceIds.push(id);
    }
  });

  return NextResponse.json({ data: nsfwSourceIds });
}
