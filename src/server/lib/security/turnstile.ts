import {createHash} from "node:crypto";
import {isRedisConfigured,isRedisCommandAllowed,redis} from "@/server/lib/cache/redis";
import {readBoundedJson} from "./bounded-json";

type Verdict="ok"|"invalid"|"unavailable";
export async function verifyReportChallenge(token:string|undefined,appUrl:string):Promise<Verdict>{
  const key=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secret=process.env.TURNSTILE_SECRET_KEY?.trim();
  const required=process.env.YOMIRRA_REPORT_TURNSTILE_REQUIRED==="yes"||Boolean(key||secret);
  if(!required)return "ok";
  if(!key||!secret||!isRedisConfigured||!isRedisCommandAllowed())return "unavailable";
  if(typeof token!=="string"||!token.trim()||token.length>2048)return "invalid";
  try{
    const hostname=new URL(appUrl).hostname;
    const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
      method:"POST",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(4000),
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({secret,response:token})
    });
    if(!response.ok)return "unavailable";
    const result=await readBoundedJson(response,16384) as {success?:boolean;hostname?:string;action?:string;challenge_ts?:string}|null;
    const at=Date.parse(result?.challenge_ts??"");
    const now=Date.now();
    if(result?.success!==true||result.hostname!==hostname||result.action!=="user_report"||
       !Number.isFinite(at)||at>now+10000||now-at>300000)return "invalid";
    // Cloudflare redemption is eventually consistent; local atomic NX avoids
    // simultaneous replay across instances. Store only a digest, not the token.
    const digest=createHash("sha256").update(token).digest("hex");
    return await redis.set("yomirra:turnstile:report:"+digest,"1","EX",310,"NX")==="OK"?"ok":"invalid";
  }catch{return "unavailable";}
}
