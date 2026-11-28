import Link from "next/link";
import {notFound} from "next/navigation";
import {getReviewedCatalogWork} from "@/shared/lib/reviewed-catalog";
import {getRuntimeSources} from "@/server/lib/sources/runtime-sources";
import {sourceManager} from "@/server/lib/sources/source-manager";
import {loadSourceDetail} from "@/server/lib/sources/content-access";
import {isDiscoverySourceSystemEligible} from "@/shared/sources/discovery-source-policy";
import {classifyContent} from "@/shared/sources/content-policy";
import {getMangaDetailHref} from "@/shared/lib/routes";
import {ReviewedWorkBookmark} from "@/components/komik/reviewed-work-bookmark";
import { CatalogBackButton } from "@/components/komik/catalog-back-button";
import type {MangaDetail} from "@/shared/sources/source-types";

export const dynamic="force-dynamic";
export const metadata={title:"Katalog karya - Yomirra",robots:{index:false,follow:false}};

export default async function ReviewedWorkPage({params}:{params:Promise<{workId:string}>}){
  const {workId}=await params;
  const work=getReviewedCatalogWork(workId);
  if(!work)notFound();
  const sources=await getRuntimeSources();
  const candidates=work.bindings.filter(binding=>sources.some(source=>
    source.id===binding.sourceId && !source.isDynamic && !source.isNsfw && isDiscoverySourceSystemEligible(source)
  )).slice(0,4);
  // No fanout for a nonexistent work. Only reviewed exact references and
  // independently safe detail records may be shown. Never import chapter IDs.
  const available=(await Promise.all(candidates.map(async binding=>{
    try{
      const source=await sourceManager.getSource(binding.sourceId);
      const detail=await loadSourceDetail(source,binding.mangaId,{hideNsfw:true});
      if(detail.id!==binding.mangaId || classifyContent(detail)!=="SAFE")return null;
      return {sourceId:binding.sourceId,mangaId:binding.mangaId,sourceName:source.name,detail};
    }catch{return null;}
  }))).filter((row):row is {sourceId:string;mangaId:string;sourceName:string;detail:MangaDetail}=>row!==null);
  const primary=available[0];
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-24">
    <CatalogBackButton fallback="/library" />
    <section className="space-y-3 rounded-xl border border-border-subtle bg-surface-raised p-5">
      <h1 className="text-2xl font-bold text-text-primary">{primary?.detail.title??"Katalog belum tersedia"}</h1>
      {primary?<><p className="text-sm text-text-secondary">{primary.detail.author}</p><p className="text-sm text-text-secondary">{primary.detail.description}</p>
      <ReviewedWorkBookmark workId={workId} primary={primary} bindings={available.map(({sourceId,mangaId})=>({sourceId,mangaId}))}/></>:<p className="text-sm text-text-secondary">Belum ada sumber terverifikasi yang dapat dimuat. Data bacaan yang tersimpan tidak berubah.</p>}
    </section>
    <section className="space-y-3" aria-label="Sumber karya">
      <h2 className="text-lg font-semibold">Sumber bacaan</h2>
      {available.map(binding=><Link key={binding.sourceId} prefetch={false} href={getMangaDetailHref(binding.sourceId,binding.mangaId,"/catalog/work/"+encodeURIComponent(workId))} className="block rounded-lg border border-border-subtle p-3 text-text-primary hover:bg-surface-hover">{binding.sourceName}<span className="block text-sm text-text-secondary">{binding.detail.title}</span></Link>)}
      <p className="text-xs text-text-secondary">Posisi membaca tetap terpisah untuk setiap sumber.</p>
    </section>
  </main>;
}
