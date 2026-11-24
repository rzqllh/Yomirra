"use client";
import {Button} from "@/components/ui/button";
import {useLibraryStore} from "@/shared/store/library-store";
import {useMounted} from "@/shared/hooks/use-mounted";
import {getReviewedCatalogWork} from "@/shared/lib/reviewed-catalog";
import type {MangaDetail} from "@/shared/sources/source-types";

type Ref={sourceId:string;mangaId:string};
export function ReviewedWorkBookmark({workId,primary,bindings}:{workId:string;primary:Ref&{detail:MangaDetail};bindings:Ref[]}){
  const mounted=useMounted();
  const items=useLibraryStore(state=>state.items);
  const add=useLibraryStore(state=>state.addToLibrary);
  const work=getReviewedCatalogWork(workId);
  if(!work)return null;
  const refs=work.bindings;
  const saved=Object.values(items).some(item=>item.isBookmarked!==false&&refs.some(ref=>
    (item.sourceId===ref.sourceId&&item.mangaId===ref.mangaId)||
    (item.primarySourceId===ref.sourceId&&item.primaryMangaId===ref.mangaId)||
    item.linkedSources?.some(link=>link.matchConfidence==="CONFIRMED"&&link.sourceId===ref.sourceId&&link.mangaId===ref.mangaId)
  ));
  const save=()=>{
    if(!mounted||saved)return;
    const now=new Date().toISOString();
    add({sourceId:primary.sourceId,mangaId:primary.mangaId,title:primary.detail.title,coverUrl:primary.detail.coverUrl,author:primary.detail.author,isNsfw:false,format:primary.detail.format,status:primary.detail.status,addedAt:now,updatedAt:now,
      linkedSources:bindings.filter(ref=>ref.sourceId!==primary.sourceId&&refs.some(proven=>proven.sourceId===ref.sourceId&&proven.mangaId===ref.mangaId)).map(ref=>({...ref,addedAt:Date.now(),matchConfidence:"CONFIRMED" as const}))
    });
  };
  return <Button type="button" variant="outline" disabled={!mounted||saved} onClick={save}>{saved?"Karya sudah tersimpan":"Simpan karya"}</Button>;
}
