"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Compass, CheckCircle, DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useDownloadStore } from "@/shared/store/download-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import { getCanonicalSavedDetailHref, getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { beginNavigationIntent } from "@/shared/lib/navigation-intent";
import { canonicalSourceKey, groupVerifiedCatalogEntries, canonicalGroupPreferenceKey, canonicalGroupPreferenceAliases } from "@/shared/lib/canonical-identity";
import { resolveCanonicalResume } from "@/shared/lib/canonical-resume";
import { rankQualityRefs, type QualitySort } from "@/shared/lib/source-quality";
import { SourceQualitySort } from "./source-quality-sort";
import { useSourceQualityStore } from "@/shared/store/source-quality-store";
import { useSharedChapterEvidence } from "@/shared/hooks/use-shared-chapter-evidence";
import { useAlternateSource } from "@/shared/hooks/use-alternate-source";
import { AlternateSourceModal, type AlternateSourceCandidate } from "./alternate-source-modal";
import { CatalogDetailSummary } from "./catalog-detail-summary";
import { CatalogBackButton } from "./catalog-back-button";

function FindAlternateSource({ sourceId, mangaId, title, author, blockedSourceIds, savedTitleId, onAttached }: {
  sourceId: string;
  mangaId: string;
  title: string;
  author?: string;
  blockedSourceIds?: ReadonlySet<string>;
  savedTitleId?: string;
  onAttached: () => void;
}) {
  const attachAlternateSource = useLibraryStore(state => state.attachAlternateSource);
  const onConfirmed = savedTitleId ? (candidate: AlternateSourceCandidate) => {
    const attached = attachAlternateSource(savedTitleId, candidate.sourceId, candidate.mangaId);
    if (attached) onAttached();
    return attached;
  } : undefined;
  const alternate = useAlternateSource({ sourceId, mangaId, knownTitle: title, knownAuthor: author, blockedSourceIds, onConfirmed });
  return (
    <>
      <Button type="button" variant="primary" onClick={alternate.openAndSearch} aria-haspopup="dialog" className="min-h-11 gap-2">
        <Compass size={17} aria-hidden="true" /> Cari alternatif
      </Button>
      <AlternateSourceModal
        isOpen={alternate.isOpen}
        onClose={() => alternate.setIsOpen(false)}
        deadSourceId={sourceId}
        deadMangaTitle={title}
        candidates={alternate.candidates}
        chapterMapResult={alternate.chapterMapResult}
        currentChapterTitle={savedTitleId ? undefined : alternate.mappingChapterTitle}
        isLoading={alternate.isSearching}
        onConfirm={alternate.handleConfirm}
        confirmLabel={savedTitleId ? "Tambahkan sumber ini" : undefined}
      />
    </>
  );
}

export function CanonicalSavedDetailView({ savedTitleId }: { savedTitleId: string }) {
  const mounted = useMounted();
  const router = useRouter();
  const libraryItems = useLibraryStore(state => state.items);
  const storedItem = useLibraryStore(state => state.getLibraryItemById(savedTitleId));
  const historyItems = useHistoryStore(state => state.items);
  const downloads = useDownloadStore(state => state.downloads);
  const perTitlePrefs = useSettingsStore(state => state.perTitleSourcePreferences);
  const setPreferred = useSettingsStore(state => state.setPerTitleSourcePreference);
  const disabledSources = useSourcePreferencesStore(state => state.disabledSources);
  const hideNsfw = useSettingsStore(state => state.hideNsfw);
  const qualityEvidence=useSourceQualityStore(state=>state.evidence);
  const shared=useSourceQualityStore(state=>state.shared);
  const [qualitySort,setQualitySort]=React.useState<QualitySort>("quality");
  const languages=useSettingsStore(state=>state.preferredLanguages);
  const { status: nsfwStatus, ids: nsfwSourceIds } = useNsfwSourceIds();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const sourceSectionRef = React.useRef<HTMLElement>(null);
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    if (pickerOpen) sourceSectionRef.current?.focus();
  }, [pickerOpen]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const updateNetwork = () => setOffline(navigator.onLine === false);
    updateNetwork();
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

  const groups = React.useMemo(() => {
    // Include history-only works: viewing a canonical History cover must not
    // silently require the work to be bookmarked first.
    const latestHistory = new Map<string, {
      id?: string; author?: string;
      sourceId: string; mangaId: string; title: string; coverUrl?: string;
      isNsfw?: boolean; readAt: number;
    }>();
    for (const item of Object.values(historyItems)) {
      const key = canonicalSourceKey(item.sourceId, item.mangaId);
      const previous = latestHistory.get(key);
      const readAt = typeof item.readAt === "number"
        ? item.readAt : new Date(String(item.readAt)).getTime() || 0;
      if (!previous || readAt > previous.readAt) {
        latestHistory.set(key, {
          sourceId: item.sourceId, mangaId: item.mangaId,
          title: item.mangaTitle, coverUrl: item.coverUrl,
          isNsfw: item.isNsfw, readAt,
        });
      }
    }
    return groupVerifiedCatalogEntries([
      ...Object.values(libraryItems),
      ...Array.from(latestHistory.values()),
    ]);
  }, [libraryItems, historyItems]);
  const exactGroup = groups.find(candidate => candidate.members.some(member =>
    member.id === savedTitleId || `${member.sourceId}::${member.mangaId}` === savedTitleId
  ));
  const group = exactGroup ?? groups.find(candidate =>
    candidate.members.some(member => member === storedItem) ||
    candidate.sourceBindings.some(ref => `${ref.sourceId}::${ref.mangaId}` === savedTitleId)
  );
  const mayShow = (sourceId: string, isNsfw?: boolean) => {
    if (!hideNsfw) return true;
    if (nsfwStatus !== "KNOWN") return false;
    const source = dynamicSourceRegistry.get(sourceId) ?? getSourceMetadata(sourceId);
    return !isNsfw && !nsfwSourceIds.has(sourceId) && source?.isNsfw !== true;
  };

  const explicitNsfwRefs = new Set([
    ...Object.values(libraryItems),
    ...Object.values(historyItems),
  ].filter(item => item.isNsfw === true).map(item =>
    canonicalSourceKey(item.sourceId, item.mangaId)
  ));
  const sharedChapters=useSharedChapterEvidence(group?.sourceBindings.filter(ref=>
    !disabledSources.includes(ref.sourceId)&&mayShow(ref.sourceId)&&
    !explicitNsfwRefs.has(canonicalSourceKey(ref.sourceId,ref.mangaId)))??[],
    mounted&&pickerOpen&&hideNsfw&&nsfwStatus==="KNOWN"&&!offline&&Boolean(group?.members.some(member=>mayShow(member.sourceId,member.isNsfw))));

  if (!mounted || (hideNsfw && nsfwStatus === "LOADING")) {
    return (
      <div className="mx-auto max-w-3xl p-5 text-text-muted">
        <h1 className="sr-only">Detail katalog</h1>
        <p role="status">Memuat katalog…</p>
      </div>
    );
  }

  const visibleMembers = group?.members.filter(member => mayShow(member.sourceId, member.isNsfw)) ?? [];
  if (!group || visibleMembers.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-3">
        <h1 className="text-xl font-semibold text-text-primary">Katalog tidak tersedia</h1>
        <p className="text-sm text-text-secondary">Judul tidak ditemukan pada Library di perangkat ini atau tidak dapat ditampilkan dengan filter konten saat ini.</p>
        <CatalogBackButton fallback="/bookmark?tab=collection" />
      </div>
    );
  }

  const selected = visibleMembers.find(member => member === storedItem) ??
    visibleMembers.find(member => `${member.sourceId}::${member.mangaId}` === savedTitleId) ??
    visibleMembers[0];
  const savedEntry = Object.entries(libraryItems).find(([, item]) => item === selected);

  // A safe primary must not expose a known-adult alternate from the same
  // general-purpose provider through a confirmed linkedSources entry.
  const safeBindings = group.sourceBindings.filter(ref =>
    mayShow(ref.sourceId) &&
    (!hideNsfw || !explicitNsfwRefs.has(canonicalSourceKey(ref.sourceId, ref.mangaId)))
  );
  const available = safeBindings.filter(ref => {
    const source = dynamicSourceRegistry.get(ref.sourceId) ?? getSourceMetadata(ref.sourceId);
    return !disabledSources.includes(ref.sourceId) &&
      Boolean(source && isDiscoverySourceSystemEligible(source));
  });
  const selectedAvailable = available.some(ref =>
    ref.sourceId === selected.sourceId && ref.mangaId === selected.mangaId
  );
  const preferenceKey = canonicalGroupPreferenceKey(group);
  const preferenceAliases = canonicalGroupPreferenceAliases(group);
  const legacyChoices = preferenceAliases
    .map(key => perTitlePrefs[key])
    .filter((value): value is string => Boolean(value));
  // Disagreeing old per-source preferences require explicit choice, not
  // arbitrary member ordering or last-write-wins.
  const legacyConflict = !perTitlePrefs[preferenceKey] && new Set(legacyChoices).size > 1;
  const preferredSourceId = legacyConflict ? undefined : perTitlePrefs[preferenceKey] ?? legacyChoices[0];
  const referenceSet = new Set(safeBindings.map(ref => canonicalSourceKey(ref.sourceId, ref.mangaId)));
  const lastRead = Object.values(historyItems)
    .filter(item => referenceSet.has(canonicalSourceKey(item.sourceId, item.mangaId)))
    .map(item => ({
      sourceId: item.sourceId,
      mangaId: item.mangaId,
      chapterId: item.chapterId,
      chapterTitle: item.chapterTitle,
      readAt: typeof item.readAt === "number" ? item.readAt : new Date(String(item.readAt)).getTime() || 0,
    }));
  const missing = safeBindings.filter(ref => !available.some(ok =>
    ok.sourceId === ref.sourceId && ok.mangaId === ref.mangaId
  ));
  const cachedChapters = Object.values(downloads)
    .filter(item => item.status === "downloaded" && referenceSet.has(canonicalSourceKey(item.sourceId, item.mangaId)));
  const decision = legacyConflict
    ? { action: "pick-source" as const, reason: "preference-conflict" as const }
    : resolveCanonicalResume({
        bindings: safeBindings,
        preferredSourceId,
        lastRead,
        disabledSourceIds: disabledSources,
        unavailableSourceIds: missing.map(ref => ref.sourceId),
        deviceOffline: offline,
        cachedSourceRefs: cachedChapters,
      });
  const canResume = decision.action === "resume" && (offline
    ? cachedChapters.some(item => item.sourceId === decision.source.sourceId &&
      item.mangaId === decision.source.mangaId && item.chapterId === decision.chapterId)
    : preferredSourceId === decision.source.sourceId || (selectedAvailable &&
      decision.source.sourceId === selected.sourceId && decision.source.mangaId === selected.mangaId));
  const showSources = () => {
    setPickerOpen(true);
    sourceSectionRef.current?.focus();
  };
  const returnTo = getCanonicalSavedDetailHref(savedTitleId);
  const resume = () => {
    if (decision.action === "resume") {
      const href = decision.chapterId
        ? getReaderHref(decision.source.sourceId, decision.source.mangaId, decision.chapterId, returnTo)
        : getMangaDetailHref(decision.source.sourceId, decision.source.mangaId, returnTo);
      if (beginNavigationIntent(href)) router.push(href);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-28 md:px-8">
      <CatalogBackButton fallback="/bookmark?tab=collection" />
      <CatalogDetailSummary
        title={selected.title}
        author={selected.author}
        coverUrl={selected.coverUrl}
        sourceId={selected.sourceId}
        mangaId={selected.mangaId}
        actions={<>
            {canResume && (
              <Button type="button" variant="primary" onClick={resume} className="min-h-11 gap-2">
                <BookOpen size={17} aria-hidden="true" /> {decision.chapterId ? "Lanjut baca" : "Buka komik"}
              </Button>
            )}
            {!offline && available.length > 0 && (
              <Button type="button" variant={canResume ? "outline" : "primary"} onClick={showSources} aria-controls="saved-reading-sources" className="min-h-11 gap-2">
                <Compass size={17} aria-hidden="true" /> Pilih sumber
              </Button>
            )}
            {!offline && available.length === 0 && (
              <FindAlternateSource
                key={canonicalSourceKey(selected.sourceId, selected.mangaId)}
                sourceId={selected.sourceId}
                mangaId={selected.mangaId}
                title={selected.title}
                author={selected.author}
                blockedSourceIds={hideNsfw ? nsfwSourceIds : undefined}
                savedTitleId={savedEntry?.[1].id ?? savedEntry?.[0]}
                onAttached={() => setPickerOpen(true)}
              />
            )}
            {(offline || cachedChapters.length > 0) && (
              <Button asChild variant={offline && !canResume ? "primary" : "outline"} className="min-h-11 gap-2">
                <Link href="/downloads"><DownloadSimple size={17} aria-hidden="true" /> Buka unduhan</Link>
              </Button>
            )}
        </>}
      >
          {offline && <p role="status">Perangkat sedang offline.</p>}
          {!offline && available.length === 0 && <p>Belum ada sumber yang dapat dibuka.</p>}
          {!offline && available.length > 0 && legacyConflict && <p className="text-status-warning-fg">
            Ada beberapa sumber utama dari riwayat lama. Pilih satu untuk katalog ini.
          </p>}
          {!offline && available.length > 0 && !legacyConflict && preferredSourceId && decision.action === "pick-source" &&
            <p className="text-status-warning-fg">Sumber utama belum tersedia. Pilihan utama tetap disimpan.</p>}
      </CatalogDetailSummary>
      {!offline && available.length > 0 && (
      <section ref={sourceSectionRef} id="saved-reading-sources" tabIndex={-1} className="scroll-mt-20 space-y-4 border-t border-border-subtle pt-4 focus-visible:outline-2 focus-visible:outline-accent" aria-labelledby="saved-reading-sources-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="saved-reading-sources-title" className="text-base font-bold text-text-primary">Sumber bacaan</h2>
          {preferredSourceId && <span className="text-xs text-text-muted">Sumber utama: {getSourceMetadata(preferredSourceId)?.name ?? preferredSourceId}</span>}
        </div>
        <div className="grid gap-3">
          {available.length>1&&<SourceQualitySort value={qualitySort} onChange={setQualitySort}/>}
          {rankQualityRefs(available.map(ref=>({...ref,language:getSourceMetadata(ref.sourceId)?.language})),qualityEvidence,{preferred:preferredSourceId,languages,verifiedGroup:true,shared,sharedChapters,sort:qualitySort}).map(({ref,quality,scope}) => {
            const recent = lastRead.filter(item => item.sourceId === ref.sourceId && item.mangaId === ref.mangaId)
              .sort((a,b) => b.readAt - a.readAt)[0];
            const isPreferred = preferredSourceId === ref.sourceId;
            const sourceName = (dynamicSourceRegistry.get(ref.sourceId) ?? getSourceMetadata(ref.sourceId))?.name ?? ref.sourceId;
            return (
              <div key={canonicalSourceKey(ref.sourceId, ref.mangaId)}
                className="flex flex-col sm:flex-row gap-3 justify-between rounded-lg border border-border-subtle bg-surface-base p-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    {sourceName} {isPreferred && <CheckCircle className="text-accent" size={16} aria-label="Pilihan utama" />}
                  </p>
                  <p className="text-xs text-text-muted">{quality.score===null?"SQS: Belum cukup data":`SQS ${quality.score}/100 · bukti ${quality.coverage}% · ${scope==="title"?"judul":scope==="monitor"?"monitor":"perangkat"}`}</p>
                  {recent && <p className="text-xs text-text-muted">{recent.chapterTitle ? `Terakhir dibaca: ${recent.chapterTitle}` : "Ada riwayat baca"}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={recent ? getReaderHref(ref.sourceId, ref.mangaId, recent.chapterId, returnTo) : getMangaDetailHref(ref.sourceId, ref.mangaId, returnTo)}>
                      {recent ? "Lanjut" : "Buka"}
                    </Link>
                  </Button>
                  {!isPreferred && <Button type="button" variant="outline" size="sm"
                    onClick={() => setPreferred(preferenceKey, ref.sourceId)}>Jadikan utama</Button>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}
    </div>
  );
}
