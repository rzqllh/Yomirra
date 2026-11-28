// Whitelisted top-level normalized MangaBaka fields only (License §3 & §5).
// Nested third-party payloads under `row.source` are excluded by default per
// License §4 & §5 unless provider-specific provenance permission is verified.
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:undefined;
const clean=v=>typeof v==="string"&&v.trim()&&v.length<=1000?v.trim():undefined;
const TRACKER_KEYS=["anilist","my_anime_list","manga_updates"];
function validTrackerId(key,id){
  return key==="manga_updates"
    ? /^(?=[a-z0-9]{1,32}$)(?=.*[a-z])[a-z0-9]+$/.test(id)
    : /^[1-9][0-9]{0,14}$/.test(id);
}
function extractSecondaryTitles(raw){
  const groups=obj(raw);
  if(!groups)return [];
  const out=[];
  for(const list of Object.values(groups)){
    if(!Array.isArray(list))continue;
    for(const entry of list){
      const name=clean(typeof entry==="string"?entry:obj(entry)?.title);
      if(name){out.push(name);if(out.length>=200)return out;}
    }
  }
  return out;
}
export function parseCatalogRecord(value,allRatings=false,options){
  const row=obj(value);
  if(!row||!Number.isSafeInteger(row.id)||row.id<=0||row.state!=="active")return null;
  if(row.merged_with!==undefined&&row.merged_with!==null)return null;
  const rating=row.content_rating;
  if(rating!=="safe"&&(!allRatings||!["suggestive","erotica","pornographic"].includes(rating)))return null;
  const format=typeof row.type==="string"?row.type.trim().toLowerCase():null;
  if(!["manga","manhwa","manhua"].includes(format))return null;
  const titles=Array.isArray(row.titles)?row.titles.flatMap(v=>{
    const t=obj(v),name=clean(t?.title);
    return name?[{title:name,language:t.language,primary:t.is_primary===true}]:[];
  }):[];
  // Official nightly dumps currently use v1; top-level title fields and
  // secondary_titles are MangaBaka Data (outside `source`) per License §5.
  const legacy=[row.title,row.native_title,row.romanized_title].map(clean).filter(Boolean);
  const secondary=extractSecondaryTitles(row.secondary_titles);
  const preferred=titles.find(t=>t.primary&&t.language==="en")??titles.find(t=>t.primary)??titles[0];
  const title=preferred?.title??legacy[0]??secondary[0];
  if(!title)return null;
  const aliases=[...new Set([...(titles.length?titles.map(t=>t.title):[]),...legacy,...secondary])];
  if(aliases.length>500)return null;
  const creators=[
    ...(Array.isArray(row.authors)?row.authors:[]),
    ...(Array.isArray(row.artists)?row.artists:[]),
  ];
  const authors=[...new Set(creators.map(clean).filter(Boolean))].slice(0,40);
  const description=typeof row.description==="string"&&row.description.length<=12000?row.description.trim():undefined;
  const ids={};
  const conflicts=new Set();
  const addId=(key,id)=>{if(conflicts.has(key))return;if(ids[key]&&ids[key]!==id){delete ids[key];conflicts.add(key);}else ids[key]=id;};
  for(const key of TRACKER_KEYS){
    const raw=row.source_ids?.[key];
    if(typeof raw!=="string"&&!(typeof raw==="number"&&Number.isSafeInteger(raw)))continue;
    const id=String(raw).trim().toLowerCase();
    if(validTrackerId(key,id))addId(key,id);
  }
  for(const link of [...(Array.isArray(row.links)?row.links:[]),...(Array.isArray(row.links_v2)?row.links_v2:[])].slice(0,200)){
    const raw=typeof link==="string"?link:obj(link)?.url;
    if(typeof raw!=="string"||raw.length>2048)continue;
    try{
      const url=new URL(raw);if(url.protocol!=="https:"||url.username||url.password||url.port)continue;
      const host=url.hostname.replace(/^www\./,"");
      let key,match;
      if(host==="anilist.co"){key="anilist";match=/^\/manga\/([1-9]\d{0,14})(?:\/[^/]+)?\/?$/.exec(url.pathname);}
      else if(host==="myanimelist.net"){key="my_anime_list";match=/^\/manga\/([1-9]\d{0,14})(?:\/[^/]+)?\/?$/.exec(url.pathname);}
      else if(host==="mangaupdates.com"){key="manga_updates";match=/^\/series\/((?=[a-z0-9]{1,32}(?:\/|$))(?=[a-z0-9]*[a-z])[a-z0-9]+)(?:\/[^/]+)?\/?$/i.exec(url.pathname);}
      if(key&&match)addId(key,match[1].toLowerCase());
    }catch{/* Ignore untrusted URL shape; never fetch links. */}
  }
  // Never consume `row.source.*.id` unless independent provider permissions
  // are explicitly verified for each provider key.
  const verifiedProviders=Array.isArray(options?.verifiedThirdPartyIdProviders)
    ? new Set(options.verifiedThirdPartyIdProviders)
    : null;
  if(verifiedProviders?.size){
    const nested=obj(row.source);
    for(const key of TRACKER_KEYS){
      if(!verifiedProviders.has(key))continue;
      const raw=obj(nested?.[key])?.id;
      if(typeof raw!=="string"&&!(typeof raw==="number"&&Number.isSafeInteger(raw)))continue;
      const id=String(raw).trim().toLowerCase();
      if(validTrackerId(key,id))addId(key,id);
    }
  }
  return {provider:"mangabaka",externalId:row.id,title,aliases,format,contentRating:rating,
    ...(description?{description}:{}),...(authors.length?{authors}:{}),...(Object.keys(ids).length?{externalWorkIds:ids}:{})};
}
