import {deflateRawSync,inflateRawSync} from "node:zlib";
const MAX_BYTES=64*1024;
/** Bounded row compression. JSON text remains readable for schema-1 snapshots. */
export function encodeCatalogPayload(value){
  const raw=Buffer.from(JSON.stringify(value),"utf8");
  if(raw.length>MAX_BYTES)throw Error("Normalized record exceeds byte limit");
  return deflateRawSync(raw,{level:6});
}
export function decodeCatalogPayload(value){
  let text;
  if(typeof value==="string"&&Buffer.byteLength(value)<=MAX_BYTES)text=value;
  else if(value instanceof Uint8Array&&value.byteLength<=MAX_BYTES)text=inflateRawSync(value,{maxOutputLength:MAX_BYTES}).toString("utf8");
  else throw Error("Invalid catalog payload");
  const work=JSON.parse(text);
  if(!work||work.provider!=="mangabaka"||!Number.isSafeInteger(work.externalId)||work.externalId<=0||
     typeof work.title!=="string"||!work.title.trim()||!Array.isArray(work.aliases)||!work.aliases.every(x=>typeof x==="string")||
     !["manga","manhwa","manhua"].includes(work.format)||
     !["safe","suggestive","erotica","pornographic"].includes(work.contentRating)||
     (work.authors!==undefined&&(!Array.isArray(work.authors)||!work.authors.every(x=>typeof x==="string"))))throw Error("Invalid catalog record");
  return work;
}
