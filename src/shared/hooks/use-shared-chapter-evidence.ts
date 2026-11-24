"use client";
import {useQuery} from "@tanstack/react-query";
import {useSettingsStore} from "@/shared/store/settings-store";
import {getSourceMetadata} from "@/shared/sources/source-registry";
import type {QualityRef,SharedChapterEvidence} from "@/shared/lib/source-quality";
export function useSharedChapterEvidence(refs:readonly QualityRef[],enabled:boolean):SharedChapterEvidence{
  const languages=useSettingsStore(s=>s.preferredLanguages);
  const dataSaver=useSettingsStore(s=>s.dataSaver);
  // Only request after an explicit source-picker interaction. Never upload
  // library/history arrays, account information, read progress or image URLs.
  const ids=[...new Map(refs.filter(ref=>{
    const source=getSourceMetadata(ref.sourceId);
    return source&&!source.isNsfw&&!source.isDynamic&&source.isEnabled&&ref.mangaId.length<=300;
  }).map(ref=>[JSON.stringify([ref.sourceId,ref.mangaId]),{sourceId:ref.sourceId,mangaId:ref.mangaId}])).entries()]
    .sort(([a],[b])=>a.localeCompare(b)).slice(0,8).map(([,ref])=>ref);
  const {data}=useQuery({
    queryKey:["public-chapter-quality",ids,languages,dataSaver],
    enabled:enabled&&ids.length>=2,
    staleTime:10*60*1000,gcTime:10*60*1000,retry:false,
    refetchOnWindowFocus:false,refetchOnReconnect:false,
    queryFn:async({signal})=>{
      const params=new URLSearchParams({languages:languages.join(","),dataSaver:String(dataSaver)});
      const response=await fetch("/api/sources/quality?"+params,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(ids),signal,cache:"no-store"});
      if(!response.ok)return {};
      const body=await response.json();
      return body.data&&typeof body.data==="object"&&!Array.isArray(body.data)?body.data as SharedChapterEvidence:{};
    }
  });
  return enabled?data??{}:{};
}
