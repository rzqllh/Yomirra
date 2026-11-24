"use client";
import {useEffect,useRef,useState} from "react";
type WidgetApi={
  render:(node:HTMLElement,options:{sitekey:string;action:string;size:"flexible";theme:"auto";callback:(token:string)=>void;"expired-callback":()=>void;"error-callback":()=>void})=>string;
  remove:(id:string)=>void;
  reset:(id:string)=>void;
};
const api=()=>(window as Window & {turnstile?:WidgetApi}).turnstile;
let loading:Promise<WidgetApi>|undefined;
function loadWidget():Promise<WidgetApi>{
  if(api())return Promise.resolve(api()!);
  if(loading)return loading;
  loading=new Promise<WidgetApi>((resolve,reject)=>{
    const script=document.createElement("script");
    script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async=true;
    const timer=setTimeout(()=>fail(),12000);
    function fail(){clearTimeout(timer);script.remove();reject(Error("Verification unavailable"));}
    script.onload=()=>{clearTimeout(timer);const ready=api();if(ready)resolve(ready);else fail()};
    script.onerror=fail;
    document.head.appendChild(script);
  }).catch(error=>{loading=undefined;throw error;});
  return loading;
}
export function ReportTurnstile({siteKey,onToken}:{siteKey:string;onToken:(token:string)=>void}){
  const host=useRef<HTMLDivElement>(null);
  const [failed,setFailed]=useState(false);
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true,id:string|undefined,widget:WidgetApi|undefined;
    onToken("");setFailed(false);
    void loadWidget().then(value=>{
      if(!active||!host.current)return;
      widget=value;
      id=value.render(host.current,{sitekey:siteKey,action:"user_report",size:"flexible",theme:"auto",
        callback:token=>{if(active){setFailed(false);onToken(token)}},
        "expired-callback":()=>{if(active){onToken("");setFailed(true)}},
        "error-callback":()=>{if(active){onToken("");setFailed(true)}}});
    }).catch(()=>{if(active)setFailed(true)});
    return ()=>{active=false;if(id!==undefined)try{widget?.remove(id)}catch{}};
  },[siteKey,onToken,attempt]);
  return <div className="mb-4 space-y-2">
    <div ref={host} aria-label="Verifikasi keamanan"/>
    {failed&&<div role="status" className="text-xs text-text-secondary">Verifikasi belum berhasil. <button type="button" onClick={()=>setAttempt(n=>n+1)} className="min-h-11 underline text-accent">Coba lagi</button></div>}
  </div>;
}
