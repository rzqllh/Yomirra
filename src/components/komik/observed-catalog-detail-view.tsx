"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/shared/api-client";
import { canonicalSourceKey, type CanonicalSourceIdentity } from "@/shared/lib/canonical-identity";
import { inspectObservedCatalog, type ObservedCatalogDetail } from "@/shared/lib/observed-catalog";
import { sourceReadScope } from "@/shared/sources/content-policy";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { resolveCanonicalResume } from "@/shared/lib/canonical-resume";
import { rankQualityRefs, type QualitySort } from "@/shared/lib/source-quality";
import { SourceQualitySort } from "./source-quality-sort";
import { useSourceQualityStore } from "@/shared/store/source-quality-store";

import { CatalogDetailSummary } from "./catalog-detail-summary";
import { CatalogBackButton } from "./catalog-back-button";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "./bookmark-button";

export function ObservedCatalogDetailView({refs,returnTo}:{refs:CanonicalSourceIdentity[];returnTo:string}) {
  const router=useRouter();
  const scope=useSettingsStore(sourceReadScope);
  const preferences=useSettingsStore(s=>s.perTitleSourcePreferences);
  const qualityEvidence=useSourceQualityStore(s=>s.evidence);
  const shared=useSourceQualityStore(state=>state.shared);
  const [qualitySort,setQualitySort]=useState<QualitySort>("quality");
  const languages=useSettingsStore(s=>s.preferredLanguages);
  const history=useHistoryStore(s=>s.items);
  const disabled=useSourcePreferencesStore(s=>s.disabledSources);
  const [showPicker,setShowPicker]=useState(false);
  const available=refs.filter(ref=>{
    const meta=getSourceMetadata(ref.sourceId);
    return Boolean(meta && !meta.isDynamic && !meta.isNsfw &&
      isDiscoverySourceSystemEligible(meta) && meta.capabilities.detail && !disabled.includes(ref.sourceId));
  });
  const query=useQuery({
    queryKey:["catalog-observed-detail",available,scope],
    enabled:available.length>0,
    queryFn:async({signal})=>{
      // Only on explicit navigation, at most four public detail requests.
      // The source API remains the content/auth authority.
      const results=await Promise.allSettled(available.map(async ref=>({
        ...ref,detail:await apiClient.getDetail(ref.sourceId,ref.mangaId,{signal}),
      })));
      return results.flatMap(result=>result.status==="fulfilled"?[result.value]:[]);
    },
    retry:false,staleTime:5*60*1000,refetchOnWindowFocus:false,refetchOnReconnect:false,
  });
  const result=inspectObservedCatalog(refs,(query.data??[]) as ObservedCatalogDetail[]);
  const primary=result.visible[0];
  const refKeys=new Set(refs.map(ref=>canonicalSourceKey(ref.sourceId,ref.mangaId)));
  const lastRead=Object.values(history).filter(item=>refKeys.has(canonicalSourceKey(item.sourceId,item.mangaId)))
    .map(item=>({sourceId:item.sourceId,mangaId:item.mangaId,chapterId:item.chapterId,
      readAt:typeof item.readAt==="number"?item.readAt:Date.parse(String(item.readAt))||0}));
  const existingChoices=new Set(refs.map(ref=>preferences[ref.sourceId+"::"+ref.mangaId]).filter(Boolean));
  const preferred=existingChoices.size===1?[...existingChoices][0]:undefined;
  const decision=result.verified && existingChoices.size<2 ? resolveCanonicalResume({
    bindings:refs,preferredSourceId:preferred,lastRead,
    disabledSourceIds:disabled,
    unavailableSourceIds:refs.filter(ref=>!result.visible.some(row=>row.sourceId===ref.sourceId && row.mangaId===ref.mangaId)).map(ref=>ref.sourceId),
  }):null;
  const resume=()=>{
    if(decision?.action==="resume"){
      const ref=decision.source;
      router.push(decision.chapterId?getReaderHref(ref.sourceId,ref.mangaId,decision.chapterId,returnTo):getMangaDetailHref(ref.sourceId,ref.mangaId,returnTo));
    }else setShowPicker(true);
  };
  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-28 md:px-8">
    <CatalogBackButton fallback={returnTo} />
    {query.isFetching && !query.data ? <p role="status" className="text-sm text-text-secondary">Memeriksa detail sumber…</p> :
    !primary ? <section className="space-y-3 rounded-xl border border-border-subtle bg-surface-raised p-5">
      <h1 className="text-xl font-bold">Katalog belum tersedia</h1>
      <p className="text-sm text-text-secondary">Belum ada detail aman yang dapat diverifikasi. Pilihan sumber dan riwayat tetap disimpan.</p>
      {available.length>0 && <Button variant="outline" onClick={()=>void query.refetch()}>Coba lagi</Button>}
    </section> :
    <>
      <CatalogDetailSummary
        title={primary.detail.title}
        author={primary.detail.author}
        coverUrl={primary.detail.coverUrl}
        sourceId={primary.sourceId}
        mangaId={primary.mangaId}
        actions={<>
          <Button variant="primary" onClick={resume}>Lanjut baca</Button>
          <Button variant="outline" onClick={()=>setShowPicker(true)}>Pilih sumber</Button>
          {result.workKey && <BookmarkButton sourceId={primary.sourceId} manga={{
            ...primary.detail,
            verifiedCatalogIdentity: { workId: result.workKey, refs },
          }} />}
        </>}
      >
        <div className="space-y-1 border-t border-border-default/70 pt-3">
          <h2 className="font-bold text-text-primary">Sinopsis</h2>
          <p>{primary.detail.description || "Sinopsis belum tersedia."}</p>
        </div>
        {!result.verified && <p role="status" className="text-xs text-text-muted">Sebagian identitas sumber masih perlu diverifikasi.</p>}
      </CatalogDetailSummary>
      <section aria-label="Sumber katalog" className="space-y-3 border-t border-border-subtle pt-4">
        <h2 className="text-lg font-bold">Sumber bacaan</h2>
        {showPicker && <p role="status" className="text-sm text-text-secondary">Pilih sumber untuk membaca. Pilihan ini tidak mengganti sumber utama.</p>}
        {result.visible.length>1&&<SourceQualitySort value={qualitySort} onChange={setQualitySort}/>}
        {rankQualityRefs(result.visible.map(row=>({...row,language:row.detail.language??getSourceMetadata(row.sourceId)?.language})),qualityEvidence,{preferred,languages,verifiedGroup:result.verified,shared,sort:qualitySort}).map(({ref:row,quality,scope})=><Link key={canonicalSourceKey(row.sourceId,row.mangaId)} prefetch={false} href={getMangaDetailHref(row.sourceId,row.mangaId,returnTo)}
          className="block rounded-lg border border-border-subtle p-3 text-text-primary hover:bg-surface-hover">
          {getSourceMetadata(row.sourceId)?.name??row.sourceId}
          <span className="block text-sm text-text-secondary">{row.detail.title}</span>
          <span className="block text-xs text-text-muted">{quality.score===null?"SQS: Belum cukup data":`SQS ${quality.score}/100 · bukti ${quality.coverage}% · ${scope==="title"?"judul":scope==="monitor"?"monitor":"perangkat"}`}</span>
        </Link>)}
        {result.visible.length<refs.length && <p className="text-xs text-text-muted">Sebagian sumber belum dapat diverifikasi atau dinonaktifkan.</p>}
      </section>
    </>}
  </main>;
}
