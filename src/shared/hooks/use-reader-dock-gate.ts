import {useEffect,useState,type RefObject} from "react";
import {useReaderStore} from "@/shared/store/reader-store";

/** Only the bottom controls yield to actual end-of-chapter actions.
 * Never force the header visible or hidden. Leaving the end card does not
 * restore the dock until a subsequent explicit overlay-show intent. */
export function useReaderDockGate(root:RefObject<HTMLDivElement|null>,chapterKey:string,mode:string){
  const [gate,setGate]=useState({key:chapterKey,visible:false,awaiting:false});
  useEffect(()=>{
    const el=root.current;if(!el)return;
    let target:Element|null=null,visible=false,awaiting=false;
    let frame:number|null=null;
    const publish=()=>setGate(old=>old.key===chapterKey&&old.visible===visible&&old.awaiting===awaiting?old:{key:chapterKey,visible,awaiting});
    const measure=()=>{
      const rect=target?.getBoundingClientRect();
      const next=!!rect&&rect.height>0&&rect.bottom>0&&rect.top<window.innerHeight;
      if(next)awaiting=true;
      visible=next;publish();
    };
    const schedule=()=>{if(frame===null)frame=requestAnimationFrame(()=>{frame=null;measure();});};
    const intersection=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(schedule):null;
    const bind=()=>{
      const current=el.querySelector("[data-reader-end-controls]");
      if(target!==current){
        if(target)intersection?.unobserve(target);
        target=current;
        if(target)intersection?.observe(target);
      }
      measure();
    };
    const mutations=new MutationObserver(bind);
    mutations.observe(el,{childList:true,subtree:true});
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule);
    const unsubscribe=useReaderStore.subscribe((state,prior)=>{
      if(state.isOverlayVisible&&!prior.isOverlayVisible&&!visible){awaiting=false;publish();}
    });
    bind();
    return()=>{mutations.disconnect();intersection?.disconnect();unsubscribe();window.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);if(frame!==null)cancelAnimationFrame(frame);};
  },[root,chapterKey,mode]);
  return gate.key===chapterKey?{endVisible:gate.visible,dockAwaitingTap:gate.awaiting}:{endVisible:false,dockAwaitingTap:false};
}
