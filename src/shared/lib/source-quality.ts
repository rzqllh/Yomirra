import type { Chapter } from "@/shared/sources/source-types";
import { chapterNavigationLabel, readChapterNumberEvidence } from "./alternate-chapter-mapping";

export type QualityRef = {sourceId:string;mangaId:string;language?:string};
export type QualitySample = {at:number;ok:boolean;ms:number;kind:"api"|"image";key:string};
export type QualityChapters = {at:number;labels:string[]};
export type QualityEvidence = {samples:QualitySample[];chapters?:QualityChapters};
export type QualitySnapshot = Record<string,QualityEvidence>;
export type QualityMetric = "reliability"|"reader"|"speed"|"completeness"|"freshness";
export const QUALITY_WEIGHTS:Record<QualityMetric,number>={reliability:30,reader:25,speed:20,completeness:15,freshness:10};
const MAX_AGE=24*60*60*1000;
const MIN_SAMPLES=5;
export const qualityKey=(sourceId:string,mangaId?:string)=>JSON.stringify([sourceId,mangaId??null]);
function recent(at:number,now:number){return Number.isFinite(at)&&at>0&&at<=now&&now-at<=MAX_AGE}
function percentage(n:number,d:number){return Math.round(100*n/d)}
export function chapterQualityEvidence(chapters:readonly Chapter[],mangaId:string,now=Date.now()):QualityChapters|undefined{
  if(!Array.isArray(chapters)||chapters.length>10000)return undefined;
  const labels=new Set<string>();
  for(const chapter of chapters){
    if(!chapter || chapter.mangaId!==mangaId || chapter.isLocked!==false)continue;
    const label=chapterNavigationLabel(chapter);
    if(!label)continue;
    labels.add(label);
  }
  return labels.size?{at:now,labels:[...labels]}:undefined;
}
export function calculateSourceQuality(evidence:QualityEvidence|undefined,peers:readonly QualityChapters[]=[],now=Date.now()){
  const samples=(evidence?.samples??[]).filter(s=>recent(s.at,now)&&Number.isFinite(s.ms)&&s.ms>=0);
  const metrics:Partial<Record<QualityMetric,number>>={};
  const api=samples.filter(s=>s.kind==="api"),images=samples.filter(s=>s.kind==="image");
  if(api.length>=MIN_SAMPLES)metrics.reliability=percentage(api.filter(s=>s.ok).length,api.length);
  if(images.length>=MIN_SAMPLES)metrics.reader=percentage(images.filter(s=>s.ok).length,images.length);
  const successful=samples.filter(s=>s.ok).map(s=>s.ms).sort((a,b)=>a-b);
  if(successful.length>=MIN_SAMPLES){
    // Device-observed median response/decode time, not a CDN benchmark.
    const median=successful[Math.floor(successful.length/2)];
    metrics.speed=Math.round(100*Math.min(1,500/Math.max(500,median)));
  }
  const own=evidence?.chapters;
  const comparable=peers.filter(p=>recent(p.at,now)&&p.labels.length>0);
  if(own&&recent(own.at,now)&&own.labels.length&&comparable.length>=2){
    // Measured coverage against observed comparable peers, never assumed
    // total published chapter count. Mixed volume conventions are unscored.
    const all=[...new Set(comparable.flatMap(p=>p.labels))];
    const parsed=all.map(readChapterNumberEvidence);
    if(parsed.every(p=>p&&p.volume===undefined)){
      const ownSet=new Set(own.labels);
      metrics.completeness=percentage(all.filter(l=>ownSet.has(l)).length,all.length);
      const newest=Math.max(...parsed.map(p=>p!.number));
      const ownNewest=Math.max(...own.labels.map(l=>readChapterNumberEvidence(l)?.number??-1));
      if(newest>=0 && ownNewest>=0)metrics.freshness=newest===0?100:Math.round(100*Math.min(1,ownNewest/newest));
    }
  }
  const coverage=Object.entries(metrics).reduce((sum,[key])=>sum+QUALITY_WEIGHTS[key as QualityMetric],0);
  const weighted=Object.entries(metrics).reduce((sum,[key,value])=>sum+value*QUALITY_WEIGHTS[key as QualityMetric],0);
  return {metrics,coverage,score:coverage?Math.round(weighted/coverage):null,samples:samples.length};
}
export function rankQualityRefs<T extends QualityRef>(refs:readonly T[],snapshot:QualitySnapshot,options:{
  preferred?:string|null;languages?:readonly string[];chapterLabel?:string;verifiedGroup?:boolean;now?:number
}={}){
  const now=options.now??Date.now();
  const peerEvidence=options.verifiedGroup?refs.flatMap(ref=>{
    const c=snapshot[qualityKey(ref.sourceId,ref.mangaId)]?.chapters;
    return c&&recent(c.at,now)?[c]:[];
  }):[];
  const ranked=refs.map((ref,index)=>{
    const title=snapshot[qualityKey(ref.sourceId,ref.mangaId)];
    const source=snapshot[qualityKey(ref.sourceId)];
    // Use title-specific samples where available, otherwise provider-level
    // evidence is explicitly identified as the fallback, not title proof.
    const titleQuality=calculateSourceQuality(title,peerEvidence,now);
    const providerQuality=calculateSourceQuality(source,[],now);
    const quality=titleQuality.score!==null?titleQuality:providerQuality;
    const language=(options.languages??[]).indexOf(ref.language??"");
    const chapterMatch=Boolean(options.chapterLabel && title?.chapters && recent(title.chapters.at,now) && title.chapters.labels.includes(options.chapterLabel));
    return {ref,index,quality,scope:titleQuality.score!==null?"title" as const:"source" as const,language:language<0?999:language,chapterMatch};
  });
  return ranked.sort((a,b)=>
    Number(b.ref.sourceId===options.preferred)-Number(a.ref.sourceId===options.preferred) ||
    Number(b.chapterMatch)-Number(a.chapterMatch) || a.language-b.language ||
    // Scores with different coverage are not directly interchangeable.
    (b.quality.coverage-a.quality.coverage) ||
    (b.quality.score??-1)-(a.quality.score??-1) || a.index-b.index);
}
