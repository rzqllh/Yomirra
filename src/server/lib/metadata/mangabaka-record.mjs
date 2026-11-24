// Whitelisted top-level normalized MangaBaka fields only.
// No raw third-party payloads, third-party images, account data or HTML.
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:undefined;
const clean=v=>typeof v==="string"&&v.trim()&&v.length<=1000?v.trim():undefined;
export function parseCatalogRecord(value,allRatings=false){
  const row=obj(value);
  if(!row||!Number.isSafeInteger(row.id)||row.id<=0||row.state!=="active")return null;
  const rating=row.content_rating;
  if(rating!=="safe"&&(!allRatings||!["suggestive","erotica","pornographic"].includes(rating)))return null;
  const format=typeof row.type==="string"?row.type.trim().toLowerCase():null;
  if(!["manga","manhwa","manhua"].includes(format))return null;
  const titles=Array.isArray(row.titles)?row.titles.flatMap(v=>{
    const t=obj(v),name=clean(t?.title);
    return name?[{title:name,language:t.language,primary:t.is_primary===true}]:[];
  }):[];
  // Official nightly dumps currently use v1; its top-level title fields
  // remain a compatibility fallback if the v2 titles array is absent.
  const legacy=[row.title,row.native_title,row.romanized_title].map(clean).filter(Boolean);
  const preferred=titles.find(t=>t.primary&&t.language==="en")??titles.find(t=>t.primary)??titles[0];
  const title=preferred?.title??legacy[0];
  if(!title)return null;
  const aliases=[...new Set([...(titles.length?titles.map(t=>t.title):[]),...legacy])];
  if(aliases.length>500)return null;
  const authors=Array.isArray(row.authors)?[...new Set(row.authors.map(clean).filter(Boolean))].slice(0,40):[];
  const description=typeof row.description==="string"&&row.description.length<=12000?row.description.trim():undefined;
  const ids={};
  for(const key of ["anilist","my_anime_list","manga_updates"]){
    const raw=row.source_ids?.[key];
    if(typeof raw!=="string"&&!(typeof raw==="number"&&Number.isSafeInteger(raw)))continue;
    const id=String(raw).trim().toLowerCase();
    if(key==="manga_updates"?/^(?=[a-z0-9]{1,32}$)(?=.*[a-z])[a-z0-9]+$/.test(id):/^[1-9][0-9]{0,14}$/.test(id))ids[key]=id;
  }
  return {provider:"mangabaka",externalId:row.id,title,aliases,format,contentRating:rating,
    ...(description?{description}:{}),...(authors.length?{authors}:{}),...(Object.keys(ids).length?{externalWorkIds:ids}:{})};
}
