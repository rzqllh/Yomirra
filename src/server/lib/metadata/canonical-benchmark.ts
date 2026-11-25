import type {MangaItem} from "@/shared/sources/source-types";
import {matchCanonicalMetadata,type MetadataWork} from "@/shared/lib/metadata-catalog";

export type ReviewedDecision={decision:"match";canonicalId:number}|{decision:"no-match"|"ambiguous"|"unresolved";canonicalId?:null};
export interface BenchmarkRow{
  item:MangaItem;
  label:ReviewedDecision;
}
export function measureCanonicalMatcher(rows:readonly BenchmarkRow[],lookup:(item:MangaItem)=>MetadataWork[]|null){
  let reviewed=0,expectedMatches=0,predictedMatches=0,correctMatches=0,wrongIdentity=0,falseMatch=0,
      correctAbstentions=0,missedMatches=0,unresolved=0,ambiguous=0,ambiguousMatched=0,unavailable=0,restrictedPredictions=0;
  for(const {item,label} of rows){
    if(label.decision==="unresolved"){unresolved++;continue;}
    reviewed++;
    if(label.decision==="match")expectedMatches++;
    if(label.decision==="ambiguous")ambiguous++;
    const candidates=lookup(item);
    if(candidates===null){unavailable++;continue;}
    const work=matchCanonicalMetadata(item,candidates);
    if(work){
      predictedMatches++;
      if(work.contentRating!=="safe")restrictedPredictions++;
      if(label.decision==="match"){
        if(work.externalId===label.canonicalId)correctMatches++;
        else wrongIdentity++;
      }else{
        falseMatch++;
        if(label.decision==="ambiguous")ambiguousMatched++;
      }
    }else if(label.decision==="match")missedMatches++;
    else correctAbstentions++;
  }
  // A wrong ID is both a false positive and a missed true match. An
  // unavailable lookup is never counted as a correct abstention.
  return {total:rows.length,reviewed,expectedMatches,predictedMatches,correctMatches,wrongIdentity,falseMatch,
    correctAbstentions,missedMatches,unresolved,ambiguous,ambiguousMatched,unavailable,restrictedPredictions,
    precision:predictedMatches?correctMatches/predictedMatches:null,
    recall:expectedMatches?correctMatches/expectedMatches:null,
    coverage:rows.length?(reviewed-unavailable)/rows.length:null,
    independentlyVerified:false,benchmarkPass:false};
}
