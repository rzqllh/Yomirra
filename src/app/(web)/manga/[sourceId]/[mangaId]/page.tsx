import { Metadata } from "next";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { MangaDetailView } from "@/components/manga/manga-detail-view";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import { cookies } from "next/headers";

import { DeadSourceRecovery } from "@/components/manga/dead-source-recovery";
import { MangaDetailErrorState } from "@/components/manga/manga-detail-error-state";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { SourceError, type SourceErrorCode } from "@/server/lib/sources/error";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ sourceId: string; mangaId: string }> 
}): Promise<Metadata> {
  const { sourceId, mangaId } = await params;
  const normalizedSourceId = sourceId.toLowerCase().trim();
  try {
    const manifestUrl = await getManifestUrlFromCookie(normalizedSourceId);
    const source = await sourceManager.getSource(normalizedSourceId, manifestUrl);
    const detail = await source.getDetail(mangaId);
    return {
      title: `${detail.title} - Yomirra`,
      description: detail.description?.slice(0, 150) + "...",
      openGraph: {
        images: detail.coverUrl ? [detail.coverUrl] : []
      }
    };
  } catch {
    return { title: "Manga tidak ditemukan - Yomirra" };
  }
}

export const dynamic = "force-dynamic";

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string; mangaId: string }>;
}) {
  const { sourceId, mangaId } = await params;
  const normalizedSourceId = sourceId.toLowerCase().trim();

  let detail;
  let chapters;
  let errorState: {
    type: "disabled" | "not_found" | "dead" | "network_error";
    message?: string;
    recoveryHealth?: {
      status: "BROKEN" | "RATE_LIMITED" | "DEGRADED";
      errorCode?: SourceErrorCode;
      message?: string;
    };
  } | null = null;

  try {
    const manifestUrl = await getManifestUrlFromCookie(normalizedSourceId);
    const source = await sourceManager.getSource(normalizedSourceId, manifestUrl);
    
    // Fetch data directly on the server with cache!
    [detail, chapters] = await Promise.all([
      withCache(`source:v2:${normalizedSourceId}:manga:${mangaId}`, () => source.getDetail(mangaId), CACHE_TTL.DETAIL),
      withCache(`source:v2:${normalizedSourceId}:chapters:${mangaId}`, () => source.getChapters(mangaId), CACHE_TTL.CHAPTERS),
    ]);

    if (!detail || !detail.title) {
      errorState = { type: "not_found" };
    }
  } catch (error) {
    console.error("Failed to load manga details", error);
    const errString = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (errString.includes("404") || errString.includes("not found") || errString.includes("tidak ditemukan")) {
      errorState = { type: "not_found" };
    } else {
      const sourceMeta = getSourceMetadata(normalizedSourceId);
      const classified = SourceError.classify(error, normalizedSourceId, "detail");
      const isExplicitlyDead =
        sourceMeta?.status === "unavailable" ||
        sourceMeta?.status === "in-fix" ||
        errString.includes("source is disabled") ||
        errString.includes("source not found");

      if (isExplicitlyDead) {
        errorState = {
          type: "dead",
          recoveryHealth: { status: "BROKEN", errorCode: classified.code, message: classified.message },
        };
      } else if (classified.code === "RATE_LIMITED") {
        errorState = {
          type: "dead",
          recoveryHealth: { status: "RATE_LIMITED", errorCode: classified.code, message: classified.message },
        };
      } else if (["UPSTREAM_TIMEOUT", "UPSTREAM_BLOCKED"].includes(classified.code)) {
        errorState = {
          type: "dead",
          recoveryHealth: { status: "DEGRADED", errorCode: classified.code, message: classified.message },
        };
      } else if (
        ["SOURCE_DOWN", "DOMAIN_CHANGED", "ROUTE_CHANGED", "PARSER_BROKEN", "SCHEMA_CHANGED", "DECRYPT_FAILURE"].includes(classified.code)
      ) {
        errorState = {
          type: "dead",
          recoveryHealth: { status: "BROKEN", errorCode: classified.code, message: classified.message },
        };
      } else {
        errorState = {
          type: "network_error",
          message: classified.message,
        };
      }
    }
  }

  if (errorState || !detail || !chapters) {
    if (errorState?.type === "dead") {
      return <DeadSourceRecovery sourceId={normalizedSourceId} mangaId={mangaId} health={errorState.recoveryHealth} />;
    }
    return (
      <MangaDetailErrorState
        sourceId={normalizedSourceId}
        mangaId={mangaId}
        type={errorState?.type || "not_found"}
        message={errorState?.message}
      />
    );
  }

  return (
    <MangaDetailView 
      sourceId={normalizedSourceId}
      mangaId={mangaId}
      detail={detail}
      chapters={chapters}
    />
  );
}

