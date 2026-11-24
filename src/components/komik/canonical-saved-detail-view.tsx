"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowLeft, Compass, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { MangaCover } from "@/components/komik/manga-cover";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { canonicalSourceKey, groupVerifiedCatalogEntries, canonicalGroupPreferenceKey, canonicalGroupPreferenceAliases } from "@/shared/lib/canonical-identity";
import { resolveCanonicalResume } from "@/shared/lib/canonical-resume";
import { rankQualityRefs, type QualitySort } from "@/shared/lib/source-quality";
import { SourceQualitySort } from "./source-quality-sort";
import { useSourceQualityStore } from "@/shared/store/source-quality-store";
import { useSharedChapterEvidence } from "@/shared/hooks/use-shared-chapter-evidence";


export function CanonicalSavedDetailView({ savedTitleId }: { savedTitleId: string }) {
  const mounted = useMounted();
  const router = useRouter();
  const libraryItems = useLibraryStore(state => state.items);
  const historyItems = useHistoryStore(state => state.items);
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
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
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
  const group = groups.find(candidate => candidate.members.some(member =>
    member.id === savedTitleId || `${member.sourceId}::${member.mangaId}` === savedTitleId
  ));
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

  if (!mounted) return <main className="mx-auto max-w-3xl p-5 text-text-muted">Memuat katalog…</main>;

  const visibleMembers = group?.members.filter(member => mayShow(member.sourceId, member.isNsfw)) ?? [];
  if (!group || visibleMembers.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-3">
        <h1 className="text-xl font-semibold text-text-primary">Katalog tidak tersedia</h1>
        <p className="text-sm text-text-secondary">Judul tidak ditemukan pada Library di perangkat ini atau tidak dapat ditampilkan dengan filter konten saat ini.</p>
        <Link className="text-sm text-accent underline" href="/library">Kembali ke Library</Link>
      </main>
    );
  }

  const selected = visibleMembers.find(member => !disabledSources.includes(member.sourceId)) ?? visibleMembers[0];

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
  const preferenceKey = canonicalGroupPreferenceKey(group);
  const preferenceAliases = canonicalGroupPreferenceAliases(group);
  const legacyChoices = preferenceAliases
    .map(key => perTitlePrefs[key])
    .filter((value): value is string => Boolean(value));
  // Disagreeing old per-source preferences require explicit choice, not
  // arbitrary member ordering or last-write-wins.
  const legacyConflict = !perTitlePrefs[preferenceKey] && new Set(legacyChoices).size > 1;
  const preferredSourceId = perTitlePrefs[preferenceKey] ??
    preferenceAliases.map(key => perTitlePrefs[key]).find(Boolean);
  const referenceSet = new Set(safeBindings.map(ref => canonicalSourceKey(ref.sourceId, ref.mangaId)));
  const lastRead = Object.values(historyItems)
    .filter(item => referenceSet.has(canonicalSourceKey(item.sourceId, item.mangaId)))
    .map(item => ({
      sourceId: item.sourceId,
      mangaId: item.mangaId,
      chapterId: item.chapterId,
      readAt: typeof item.readAt === "number" ? item.readAt : new Date(String(item.readAt)).getTime() || 0,
    }));
  const missing = safeBindings.filter(ref => !available.some(ok =>
    ok.sourceId === ref.sourceId && ok.mangaId === ref.mangaId
  ));
  const decision = legacyConflict
    ? { action: "pick-source" as const, reason: "preference-conflict" as const }
    : resolveCanonicalResume({
        bindings: safeBindings,
        preferredSourceId,
        lastRead,
        disabledSourceIds: disabledSources,
        unavailableSourceIds: missing.map(ref => ref.sourceId),
        deviceOffline: offline,
      });
  const resume = () => {
    if (decision.action === "resume") {
      const href = decision.chapterId
        ? getReaderHref(decision.source.sourceId, decision.source.mangaId, decision.chapterId, "/library")
        : getMangaDetailHref(decision.source.sourceId, decision.source.mangaId, "/library");
      router.push(href);
    } else {
      setPickerOpen(true);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 pb-28 space-y-6">
      <Link href="/library" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft size={18} /> Kembali ke Library
      </Link>
      <section className="flex flex-col sm:flex-row gap-5 rounded-xl border border-border-subtle bg-surface-raised p-4 sm:p-5">
        <div className="w-32 sm:w-40 shrink-0 aspect-[2/3] overflow-hidden rounded-lg border border-border-default">
          <MangaCover
            src={selected.coverUrl}
            sourceId={selected.sourceId}
            mangaId={selected.mangaId}
            alt={selected.title}
            fallbackTitle={selected.title}
            className="w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{selected.title}</h1>
          {selected.author && <p className="text-sm text-text-secondary">{selected.author}</p>}
          <p className="text-sm text-text-muted">
            {safeBindings.length} sumber tercatat · {available.length} dapat dibuka
          </p>
          <p className="text-xs text-text-muted">
            Posisi membaca tetap disimpan terpisah pada setiap sumber.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="primary" onClick={resume} className="min-h-11 gap-2">
              <BookOpen size={17} /> Lanjut baca
            </Button>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(state => !state)} className="min-h-11 gap-2">
              <Compass size={17} /> Pilih sumber
            </Button>
          </div>
          {offline && <p className="text-xs text-status-warning-fg">Perangkat sedang offline. Ketersediaan sumber belum bisa dipastikan.</p>}
          {legacyConflict && <p className="text-xs text-status-warning-fg">
            Ada beberapa sumber utama dari riwayat lama. Pilih satu untuk katalog ini.
          </p>}
          {!legacyConflict && preferredSourceId && decision.action === "pick-source" &&
            <p className="text-xs text-status-warning-fg">Sumber utama belum tersedia. Pilihan utama tetap disimpan.</p>}
        </div>
      </section>
      <section className="rounded-xl border border-border-subtle bg-surface-raised p-4 space-y-4" aria-label="Sumber katalog">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-text-primary">Sumber bacaan</h2>
          {preferredSourceId && <span className="text-xs text-text-muted">Sumber utama: {getSourceMetadata(preferredSourceId)?.name ?? preferredSourceId}</span>}
        </div>
        {(pickerOpen || available.length === 0) && (
          <p className="text-sm text-text-secondary">
            {offline ? "Periksa koneksi atau buka unduhan yang sudah tersimpan." :
              available.length ? "Pilih sumber untuk membaca. Mengunjungi sumber lain tidak mengganti pilihan utama." :
                "Belum ada sumber aktif. Bookmark dan riwayat tetap disimpan."}
          </p>
        )}
        {available.length === 0 && <div className="flex items-center gap-2 text-sm text-text-muted"><WarningCircle size={18} /> Belum ada sumber yang dapat dibuka</div>}
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
                  <p className="text-xs text-text-muted">{recent ? `Terakhir: ${recent.chapterId}` : "Belum ada riwayat pada sumber ini"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-default px-3 text-sm text-text-primary hover:bg-surface-hover"
                    href={recent ? getReaderHref(ref.sourceId, ref.mangaId, recent.chapterId, "/library") : getMangaDetailHref(ref.sourceId, ref.mangaId, "/library")}>
                    {recent ? "Lanjut" : "Buka"}
                  </Link>
                  {!isPreferred && <Button type="button" variant="outline" size="sm"
                    onClick={() => setPreferred(preferenceKey, ref.sourceId)}>Jadikan utama</Button>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
