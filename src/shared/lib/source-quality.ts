import type { Chapter } from "@/shared/sources/source-types";
import { chapterNavigationLabel, readChapterNumberEvidence } from "./alternate-chapter-mapping";

export type QualityRef = {sourceId:string;mangaId:string;language?:string};
export type QualitySample = {at:number;ok:boolean;ms:number;kind:"api"|"image";key:string};
export type QualityChapters = {at:number;labels:string[]};
export type QualityEvidence = {samples:QualitySample[];chapters?:QualityChapters};
export type QualitySnapshot = Record<string,QualityEvidence>;
export type SharedChapterEvidence = Record<string,QualityChapters>;

/** Only public, cache-backed chapter observations. Never merge user samples
 * into global state or compare providers without a verified work group. */
export function mergeSharedChapterEvidence(local:QualitySnapshot,shared:SharedChapterEvidence,now=Date.now()):QualitySnapshot{
  const merged={...local};
  for(const [key,chapters] of Object.entries(shared)){
    if(!chapters||!recent(chapters.at,now)||!Array.isArray(chapters.labels)||!chapters.labels.length||
       chapters.labels.length>10000||!chapters.labels.every(label=>typeof label==="string"&&label.length<=100&&readChapterNumberEvidence(label)))continue;
    const previous=local[key];
    if(previous?.chapters&&recent(previous.chapters.at,now)&&previous.chapters.at>=chapters.at)continue;
    merged[key]={samples:previous?.samples??[],chapters};
  }
  return merged;
}
export type SharedHealthEvidence={checkedAt?:string;uptime:string;p95Latency?:string;sampleCount?:number;hasSufficientData?:boolean};
export type SharedQualityEvidence=Record<string,SharedHealthEvidence>;
export type QualitySort="quality"|"speed"|"completeness"|"freshness";
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
    const middle=Math.floor(successful.length/2);
    const median=successful.length%2?successful[middle]:successful[middle-1]+(successful[middle]-successful[middle-1])/2;
    metrics.speed=Math.round(100*Math.min(1,500/Math.max(500,median)));
  }
  const own=evidence?.chapters;
  const comparable=peers.filter(p=>recent(p.at,now)&&p.labels.length>0);
  if(own&&recent(own.at,now)&&own.labels.length&&comparable.length>=2){
    // Measured coverage against observed comparable peers, never assumed
    // total published chapter count. Mixed volume conventions are unscored.
    const all=[...new Set(comparable.flatMap(p=>p.labels))];
    const parsed=all.map(readChapterNumberEvidence);
    const ownParsed=own.labels.map(readChapterNumberEvidence);
    const global=parsed.every(p=>p&&p.volume===undefined)&&ownParsed.every(p=>p&&p.volume===undefined);
    const volumeLocal=parsed.every(p=>p&&p.volume!==undefined)&&ownParsed.every(p=>p&&p.volume!==undefined);
    if(global||volumeLocal){
      const ownSet=new Set(own.labels);
      metrics.completeness=percentage(all.filter(l=>ownSet.has(l)).length,all.length);
      if(global){
        const newest=Math.max(...parsed.map(p=>p!.number));
        const ownNewest=Math.max(...ownParsed.map(p=>p!.number));
        if(newest>=0 && ownNewest>=0)metrics.freshness=newest===0?100:Math.round(100*Math.min(1,ownNewest/newest));
      }else{
        // No arbitrary numeric volume-to-chapter multiplier. Measure relative
        // progress in the ordered union of actually observed releases.
        const ordered=parsed.map(p=>p!).sort((a,b)=>a.volume!-b.volume!||a.number-b.number);
        const latest=ownParsed.map(p=>p!).sort((a,b)=>b.volume!-a.volume!||b.number-a.number)[0];
        const through=ordered.filter(p=>p.volume!<latest.volume!||p.volume===latest.volume&&p.number<=latest.number).length;
        metrics.freshness=percentage(through,ordered.length);
      }
    }
  }
  const coverage=Object.entries(metrics).reduce((sum,[key])=>sum+QUALITY_WEIGHTS[key as QualityMetric],0);
  const weighted=Object.entries(metrics).reduce((sum,[key,value])=>sum+value*QUALITY_WEIGHTS[key as QualityMetric],0);
  return {metrics,coverage,score:coverage?Math.round(weighted/coverage):null,samples:samples.length};
}
export function sharedProbeQuality(evidence:SharedHealthEvidence|undefined,now=Date.now()){
  const metrics:Partial<Record<QualityMetric,number>>={};
  const checked=Date.parse(evidence?.checkedAt??"");
  if(!evidence?.hasSufficientData||!recent(checked,now)||!Number.isInteger(evidence.sampleCount)||evidence.sampleCount!<MIN_SAMPLES)return {metrics,coverage:0,score:null,samples:0};
  const uptime=/^(\d+(?:\.\d+)?)%$/.exec(evidence.uptime);
  const latency=/^(\d+(?:\.\d+)?)ms$/.exec(evidence.p95Latency??"");
  const percent=uptime?Number(uptime[1]):-1;
  if(percent>=0&&percent<=100)metrics.reliability=Math.round(percent);
  if(latency&&Number(latency[1])>0)metrics.speed=Math.round(100*Math.min(1,500/Math.max(500,Number(latency[1]))));
  const coverage=Object.keys(metrics).reduce((n,key)=>n+QUALITY_WEIGHTS[key as QualityMetric],0);
  return {metrics,coverage,score:coverage?Math.round(Object.entries(metrics).reduce((n,[k,v])=>n+v*QUALITY_WEIGHTS[k as QualityMetric],0)/coverage):null,samples:evidence.sampleCount!};
}
export function rankQualityRefs<T extends QualityRef>(refs:readonly T[],snapshot:QualitySnapshot,options:{
  preferred?:string|null;languages?:readonly string[];chapterLabel?:string;verifiedGroup?:boolean;now?:number;shared?:SharedQualityEvidence;sharedChapters?:SharedChapterEvidence;sort?:QualitySort
}={}){
  const now=options.now??Date.now();
  if(options.sharedChapters)snapshot=mergeSharedChapterEvidence(snapshot,options.sharedChapters,now);
  // Different language entries of one provider/work are not independent
  // observations. Exclude ambiguous multiple work identities per provider.
  const peerWorks=new Map<string,Set<string>>();
  if(options.verifiedGroup)for(const ref of refs){
    const works=peerWorks.get(ref.sourceId)??new Set<string>();
    works.add(ref.mangaId);peerWorks.set(ref.sourceId,works);
  }
  const peerEvidence=[...peerWorks].flatMap(([sourceId,works])=>{
    if(works.size!==1)return [];
    const mangaId=[...works][0];
    const c=snapshot[qualityKey(sourceId,mangaId)]?.chapters;
    return c&&recent(c.at,now)?[c]:[];
  });
  const ranked=refs.map((ref,index)=>{
    const title=snapshot[qualityKey(ref.sourceId,ref.mangaId)];
    const source=snapshot[qualityKey(ref.sourceId)];
    // Use title-specific samples where available, otherwise provider-level
    // evidence is explicitly identified as the fallback, not title proof.
    const titleQuality=calculateSourceQuality(title,peerWorks.get(ref.sourceId)?.size===1?peerEvidence:[],now);
    const providerQuality=calculateSourceQuality(source,[],now);
    const shared=sharedProbeQuality(options.shared?.[ref.sourceId],now);
    const quality=titleQuality.score!==null?titleQuality:providerQuality.score!==null?providerQuality:shared;
    const language=(options.languages??[]).indexOf(ref.language??"");
    const chapterMatch=Boolean(options.chapterLabel && title?.chapters && recent(title.chapters.at,now) && title.chapters.labels.includes(options.chapterLabel));
    return {ref,index,quality,scope:titleQuality.score!==null?"title" as const:providerQuality.score!==null?"source" as const:"monitor" as const,language:language<0?999:language,chapterMatch};
  });
  const metric=options.sort&&options.sort!=="quality"?options.sort:undefined;
  // Shrink partial observations toward a neutral midpoint for ordering only.
  // The displayed measured score and coverage remain unchanged; unmeasured
  // sources sort last rather than receiving an invented observed score.
  const orderingScore=(quality:{score:number|null;coverage:number})=>quality.score===null?-1:
    50+(quality.score-50)*quality.coverage/100;
  return ranked.sort((a,b)=>
    Number(b.ref.sourceId===options.preferred)-Number(a.ref.sourceId===options.preferred) ||
    Number(b.chapterMatch)-Number(a.chapterMatch) || a.language-b.language ||
    (metric?((b.quality.metrics[metric]??-1)-(a.quality.metrics[metric]??-1)):0) ||
    orderingScore(b.quality)-orderingScore(a.quality) ||
    (b.quality.coverage-a.quality.coverage) ||
    a.index-b.index);
}
