import {create} from "zustand";
import type { Chapter } from "@/shared/sources/source-types";
import {chapterQualityEvidence,qualityKey,type QualitySnapshot,type QualitySample} from "@/shared/lib/source-quality";

const MAX_KEYS=180,MAX_SAMPLES=32;
interface QualityState{
  evidence:QualitySnapshot;
  record:(sourceId:string,mangaId:string|undefined,sample:QualitySample)=>void;
  recordChapters:(sourceId:string,mangaId:string,chapters:Chapter[])=>void;
}
/** Session-local and bounded; no telemetry upload, polling or extra API calls.
 * Do not store raw image URLs, auth tokens or private beta history. */
export const useSourceQualityStore=create<QualityState>((set)=>({
  evidence:{},
  record:(sourceId,mangaId,sample)=>set(state=>{
    if(!sourceId || !Number.isFinite(sample.ms) || sample.ms<0 || !sample.key ||
       (typeof navigator!=="undefined"&&navigator.onLine===false))return state;
    const evidence={...state.evidence};
    for(const key of [qualityKey(sourceId),...(mangaId?[qualityKey(sourceId,mangaId)]:[])]){
      const previous=evidence[key];
      const samples=(previous?.samples??[]).filter(s=>s.key!==sample.key || s.kind!==sample.kind);
      delete evidence[key];
      evidence[key]={...previous,samples:[...samples,sample].slice(-MAX_SAMPLES)};
    }
    while(Object.keys(evidence).length>MAX_KEYS)delete evidence[Object.keys(evidence)[0]];
    return {evidence};
  }),
  recordChapters:(sourceId,mangaId,chapters)=>set(state=>{
    const observed=chapterQualityEvidence(chapters,mangaId);
    const key=qualityKey(sourceId,mangaId);
    const evidence={...state.evidence};
    const previous=evidence[key];
    delete evidence[key];
    evidence[key]={samples:previous?.samples??[],chapters:observed};
    while(Object.keys(evidence).length>MAX_KEYS)delete evidence[Object.keys(evidence)[0]];
    return {evidence};
  }),
}));
