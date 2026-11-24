import type { MangaItem } from "@/shared/sources/source-types";
import { extendCatalogEvidence } from "./catalog-evidence";

export interface LabeledCatalogObservation {
  sourceId:string;
  manga:MangaItem;
  /** Independently reviewed ground truth, not a model-predicted label. */
  expectedWorkId:string;
}
export function evaluateCatalogEvidence(rows:readonly LabeledCatalogObservation[]){
  const refs=rows.map(row=>JSON.stringify([row.sourceId,row.manga.id]));
  if(new Set(refs).size!==rows.length||rows.some(row=>!row.expectedWorkId.trim()))throw new Error("Benchmark requires unique provider references and reviewed labels");
  const predicted=extendCatalogEvidence(rows);
  let tp=0,fp=0,fn=0,tn=0;
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
    if(rows[i].sourceId===rows[j].sourceId)continue;
    const expected=rows[i].expectedWorkId===rows[j].expectedWorkId;
    const a=predicted.get(refs[i]),b=predicted.get(refs[j]);
    const match=Boolean(a&&b&&a===b);
    if(expected&&match)tp++;else if(match)fp++;else if(expected)fn++;else tn++;
  }
  return {observations:rows.length,labeledWorks:new Set(rows.map(row=>row.expectedWorkId)).size,
    matchedObservations:predicted.size,truePositives:tp,falsePositives:fp,falseNegatives:fn,trueNegatives:tn,
    precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,coverage:rows.length?predicted.size/rows.length:null};
}
