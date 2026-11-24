"use client";
import {useEffect,useState} from "react";
import {useSettingsStore} from "@/shared/store/settings-store";
import {getSourceMetadata} from "@/shared/sources/source-registry";
import type {QualityRef,SharedChapterEvidence} from "@/shared/lib/source-quality";
export function useSharedChapterEvidence(refs:readonly QualityRef[],enabled:boolean):SharedChapterEvidence{
  const languages=useSettingsStore(s=>s.preferredLanguages);
  const dataSaver=useSettingsStore(s=>s.dataSaver);
  const ids=[...new Map(refs.filter(ref=>{
    const source=getSourceMetadata(ref.sourceId);
    return source&&!source.isNsfw&&!source.isDynamic&&source.isEnabled&&ref.mangaId.length<=300;
  }).map(ref=>[JSON.stringify([ref.sourceId,ref.mangaId]),{sourceId:ref.sourceId,mangaId:ref.mangaId}])).entries()]
    .sort(([a],[b])=>a.localeCompare(b)).slice(0,8).map(([,ref])=>ref);
  const params=new URLSearchParams({languages:languages.join(","),dataSaver:String(dataSaver)}).toString();
  const body=JSON.stringify(ids);
  const key=JSON.stringify([params,body]);
  const [result,setResult]=useState<{key:string;data:SharedChapterEvidence;expiresAt:number}>();
  const eligible=enabled&&new Set(ids.map(ref=>ref.sourceId)).size>=2;
  const fresh=result?.key===key&&result.expiresAt>Date.now();
  useEffect(()=>{
    if(!eligible||fresh)return;
    const controller=new AbortController();
    let active=true;
    void (async()=>{
      try{
        const response=await fetch("/api/sources/quality?"+params,{method:"POST",headers:{"Content-Type":"application/json"},body,signal:controller.signal,cache:"no-store"});
        const value=response.ok?await response.json():null;
        const data=value?.data&&typeof value.data==="object"&&!Array.isArray(value.data)?value.data as SharedChapterEvidence:{};
        if(active)setResult({key,data,expiresAt:Date.now()+10*60*1000});
      }catch{if(active)setResult({key,data:{},expiresAt:Date.now()+10*60*1000});}
    })();
    return ()=>{active=false;controller.abort();};
  },[eligible,fresh,key,params,body]);
  return eligible&&fresh&&result?result.data:{};
}
