export interface ReviewSummary{total:number;submitted:number;resolved:number;matched:number;unmatched:number;ambiguous:number;unresolved:number;candidateMatches:number;candidateRecall:number|null;reviewComplete:boolean;independentlyVerified:false;benchmarkPass:false}
export function validateReview(packetPath:string,labelPath:string):Promise<ReviewSummary>;
export function prepareReview(index:string,observations:string,output:string):Promise<{prepared:number;reviewed:number;benchmarkPass:false}>;
