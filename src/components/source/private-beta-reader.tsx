"use client";

import { useEffect,useRef,useState } from "react";
import type { User } from "firebase/auth";
import { initFirebase } from "@/shared/lib/firebase";
import { Button } from "@/components/ui/button";

type Detail = {title:string;chapters:{id:string;title:string;readable:boolean}[]};
type Chapter = {title:string;pages:string[]};

async function request(user:User,signal:AbortSignal,body:Record<string,string>) {
  const {auth}=await initFirebase();
  if (!auth || auth.currentUser?.uid!==user.uid) throw new Error("Account changed");
  const token=await user.getIdToken();
  if (signal.aborted || auth.currentUser?.uid!==user.uid) throw new Error("Account changed");
  const response=await fetch("/api/private-beta/reader",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(body),signal,cache:"no-store"});
  if (!response.ok || signal.aborted || auth.currentUser?.uid!==user.uid) throw new Error("Reader unavailable");
  return response;
}

export function PrivateBetaReader({user,source,mangaId,onClose}:{user:User;source:string;mangaId:string;onClose:()=>void}) {
  const [detail,setDetail]=useState<Detail|null>(null);
  const [chapter,setChapter]=useState<Chapter|null>(null);
  const [index,setIndex]=useState(0);
  const [image,setImage]=useState<string|null>(null);
  const [busy,setBusy]=useState(true);
  const [imageBusy,setImageBusy]=useState(false);
  const [failed,setFailed]=useState(false);
  const [retry,setRetry]=useState(0);
  const current=useRef<AbortController|null>(null);

  useEffect(()=>{
    const controller=new AbortController();
    void request(user,controller.signal,{operation:"detail",source,mangaId}).then(r=>r.json()).then(r=>{
      if (!controller.signal.aborted) setDetail(r.data);
    }).catch(()=>{if (!controller.signal.aborted) setFailed(true);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return ()=>{controller.abort();current.current?.abort();};
  },[user,source,mangaId]);

  async function open(id:string){
    current.current?.abort();
    const controller=new AbortController();current.current=controller;
    setBusy(true);setFailed(false);setChapter(null);setImage(null);
    try {
      const data=await (await request(user,controller.signal,{operation:"chapter",source,mangaId,chapterId:id})).json();
      if(!controller.signal.aborted){setIndex(0);setChapter(data.data);}
    } catch {if(!controller.signal.aborted)setFailed(true);}
    finally {if(!controller.signal.aborted)setBusy(false);}
  }
  const ticket=chapter?.pages[index];
  useEffect(()=>{
    if(!ticket)return;
    const controller=new AbortController();
    let objectUrl:string|undefined;
    queueMicrotask(()=>{if(!controller.signal.aborted){setImage(null);setImageBusy(true);setFailed(false);}});
    void request(user,controller.signal,{operation:"image",ticket}).then(r=>r.blob()).then(blob=>{
      if(controller.signal.aborted)return;
      objectUrl=URL.createObjectURL(blob);setImage(objectUrl);
    }).catch(()=>{if(!controller.signal.aborted)setFailed(true);}).finally(()=>{if(!controller.signal.aborted)setImageBusy(false);});
    return ()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[ticket,user,retry]);

  return <div className="space-y-3 rounded-lg border border-border-subtle p-3">
    <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{detail?.title??"Reader beta"}</h3><Button variant="outline" onClick={onClose}>Tutup</Button></div>
    {busy&&<p role="status" className="text-sm text-text-secondary">Memuat data…</p>}
    {failed&&<p role="alert" className="text-sm text-semantic-error">Data belum dapat dibuka. Coba lagi atau pilih chapter lain.</p>}
    {!chapter&&detail&&<div className="max-h-72 space-y-1 overflow-auto">
      {detail.chapters.length===0&&<p className="text-sm text-text-secondary">Belum ada chapter yang terverifikasi.</p>}
      {detail.chapters.map(ch=><Button key={ch.id} variant="outline" className="w-full justify-between" disabled={!ch.readable||busy} onClick={()=>void open(ch.id)}>{ch.title}{!ch.readable&&" · Tidak tersedia"}</Button>)}
    </div>}
    {chapter&&<div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" onClick={()=>{setChapter(null);setImage(null);setFailed(false);}}>Daftar chapter</Button><span className="text-sm font-semibold">{chapter.title}</span><span className="text-sm">{index+1} / {chapter.pages.length}</span></div>
      {imageBusy&&<p role="status" className="text-sm text-text-secondary">Memuat halaman…</p>}
      {image&&!imageBusy&&/* eslint-disable-next-line @next/next/no-img-element */ <img src={image} alt={`Halaman ${index+1}`} className="mx-auto max-w-full rounded-sm" />}
      {failed&&<Button variant="outline" onClick={()=>setRetry(v=>v+1)}>Coba lagi</Button>}
      <div className="flex justify-between gap-2"><Button disabled={index===0||imageBusy} onClick={()=>setIndex(v=>v-1)}>Sebelumnya</Button><Button disabled={index===chapter.pages.length-1||imageBusy} onClick={()=>setIndex(v=>v+1)}>Berikutnya</Button></div>
    </div>}
  </div>;
}
