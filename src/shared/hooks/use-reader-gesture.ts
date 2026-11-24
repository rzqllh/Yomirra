import { useEffect, type RefObject } from "react";
import { useReaderStore } from "@/shared/store/reader-store";

/** Fallback shell only. Paged and continuous reader own their tap zones. */
export function useReaderGesture(root:RefObject<HTMLDivElement|null>) {
  const toggleOverlay=useReaderStore(state=>state.toggleOverlay);
  useEffect(()=>{
    const el=root.current;if(!el)return;
    let start:{id:number;x:number;y:number;at:number;scrollY:number}|null=null;
    const ignored=(target:EventTarget|null)=>!(target instanceof Element)||!!target.closest("button,a,input,select,textarea,[role=button],[role=dialog],[data-interactive=true],[data-reader-tap-owner],[data-reader-end-controls],.pointer-events-auto");
    const cancel=()=>{start=null;};
    const down=(e:PointerEvent)=>{
      cancel();if(!e.isPrimary||e.button!==0||ignored(e.target))return;
      start={id:e.pointerId,x:e.clientX,y:e.clientY,at:Date.now(),scrollY:window.scrollY};
    };
    const move=(e:PointerEvent)=>{if(start&&(Math.abs(e.clientX-start.x)>10||Math.abs(e.clientY-start.y)>10))cancel();};
    const up=(e:PointerEvent)=>{
      const p=start;cancel();
      if(!p||p.id!==e.pointerId||!e.isPrimary||ignored(e.target)||Date.now()-p.at>350||Math.abs(e.clientX-p.x)>10||Math.abs(e.clientY-p.y)>10||Math.abs(window.scrollY-p.scrollY)>10)return;
      const rect=el.getBoundingClientRect(),ratio=(e.clientX-rect.left)/rect.width;
      if(ratio>=.3&&ratio<=.7)toggleOverlay();
    };
    el.addEventListener("pointerdown",down);el.addEventListener("pointermove",move);
    el.addEventListener("pointerup",up);el.addEventListener("pointercancel",cancel);
    return()=>{el.removeEventListener("pointerdown",down);el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",cancel);};
  },[root,toggleOverlay]);
}
