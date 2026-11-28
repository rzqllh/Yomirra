import {test,expect} from "./fixtures";
import Redis from "ioredis";
import {randomUUID} from "node:crypto";
import {redisKeyNamespace} from "../src/server/lib/cache/redis-key-scope";

test.use({serviceWorkers:"block",reducedMotion:"reduce"});
// Reader acceptance must pass on the first attempt, not hide a WebKit race.
test.describe.configure({retries:0});
// Solid 80x120 PNG, matching declared chapter metadata. A 1x1 image
// changes the measured virtual page height on decode and moves the scroll anchor.
const fixtureImage=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAFAAAAB4AQAAAABNlUhbAAAAGklEQVR42mP8zwADTAyjzFHmKHOUOcrEYAIAkioB78sU6ikAAAAASUVORK5CYII=","base64");
// Exercise the actual ReaderView/ReaderShell with disposable CI Redis
// fixtures. No upstream requests, public user data or production cache writes.
for(const [background,appTheme,width,mode,paletteTransition] of [
  ["mist","dark",320,"paged",false],
  ["black","light",393,"paged",false],
  ["deepLagoon","light",1440,"paged",false],
  ["black","dark",393,"vertical",false],
  ["mist","dark",320,"paged",true],
] as const){
  test("reader chrome contrast: "+background+" / "+width+" / "+mode+(paletteTransition?" / palette transition":""),async({page,baseURL})=>{
    const redisUrl=process.env.REDIS_URL;
    const host=redisUrl?new URL(redisUrl).hostname:"";
    test.skip(process.env.CI!=="true"||process.env.E2E_PRODUCTION_BUILD!=="1"||
      !baseURL||new URL(baseURL).hostname!=="localhost"||!["redis","localhost","127.0.0.1"].includes(host),
      "Requires isolated production-build CI Redis fixture");
    test.setTimeout(60000);
    if(paletteTransition) await page.emulateMedia({reducedMotion:"no-preference"});
    const redis=new Redis(redisUrl!,{
      maxRetriesPerRequest:1,
      connectTimeout:2000,
      ...(redisKeyNamespace?{keyPrefix:redisKeyNamespace}:{}),
    });
    const id=randomUUID(),chapter=randomUUID(),before=randomUUID(),after=randomUUID();
    const title="Reader contrast fixture";
    const entries=[{id:after,mangaId:id,title:"Chapter 3",number:3,date:"2026-01-01",isLocked:false},{id:chapter,mangaId:id,title:"Chapter 2",number:2,date:"2026-01-01",isLocked:false},{id:before,mangaId:id,title:"Chapter 1",number:1,date:"2026-01-01",isLocked:false}];
    const detail={id,title,format:"manga",contentRating:"safe",isNsfw:false,coverUrl:"",description:"Fixture",genres:[],status:"ONGOING"};
    const pages={chapterId:chapter,pages:Array.from({length:mode==="vertical"?8:2},(_,index)=>({index:index+1,url:"https://example.test/fixture-"+index+".png",width:80,height:120}))};
    const nextPages={...pages,chapterId:after};
    const scope=JSON.stringify({safety:"safe-v2",languages:["id","en"],dataSaver:false});
    const key=(op:string,params:string)=>"source:mangadex:"+op+":content-v2:"+scope+":"+params;
    try{
      for(const [k,data] of [[key("manga",id),detail],[key("chapters",id),entries],[key("pages",JSON.stringify([id,chapter])),pages],[key("pages",JSON.stringify([id,after])),nextPages]] as const)
        await redis.setex(k,300,JSON.stringify({data,expiresAt:Date.now()+300000}));
    }finally{await redis.quit();}
    await page.setViewportSize({width,height:width>=768?900:720});
    await page.context().addCookies([{name:"yomirra-source-languages",value:"id,en",url:baseURL!},{name:"yomirra-data-saver",value:"false",url:baseURL!}]);
    await page.addInitScript(({bg,theme,readingMode})=>{
      localStorage.setItem("theme",theme);
      localStorage.setItem("yomirra-onboarding",JSON.stringify({state:{hasCompletedOnboarding:true,_hasHydrated:true},version:0}));
      localStorage.setItem("manga-reader-settings",JSON.stringify({state:{preferences:{background:bg,readingMode,keepScreenAwake:false,showPageProgress:true},isDesktopPanelOpen:false},version:0}));
    },{bg:background,theme:appTheme,readingMode:mode});
    await page.route("**/api/proxy/image?**",route=>route.fulfill({contentType:"image/png",body:fixtureImage}));
    await page.route("**/api/sources/mangadex/manga/"+id+"/chapters/"+chapter+"/pages?**",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({data:pages})}));
    await page.route("**/api/sources/mangadex/manga/"+id+"/chapters/"+after+"/pages?**",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({data:nextPages})}));
    await page.route("https://example.test/**",route=>route.fulfill({contentType:"image/png",body:fixtureImage}));
    await page.goto("/manga/mangadex/"+id+"/read/"+chapter);
    const reader=page.getByRole("main").locator(".reader-contrast-scope");
    const header=reader.locator("header.reader-chrome-surface");
    const dock=reader.getByRole("group",{name:"Kontrol pembaca"});
    await expect(header.getByText(title,{exact:true})).toBeVisible({timeout:20000});
    await expect(dock).toBeVisible();
    await expect(dock.getByRole("button",{name:"Chapter berikutnya"})).toBeEnabled();
    const measurements=async(switchPalette=false)=>reader.evaluate(async(root,switchPalette)=>{
      function rgb(value:string){
        const c=document.createElement("canvas");c.width=c.height=1;
        const ctx=c.getContext("2d")!;ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);
        return Array.from(ctx.getImageData(0,0,1,1).data);
      }
      function lum(v:number[]){const a=v.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];}
      function ratio(a:number[],b:number[]){return (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);}
      const items=Array.from(root.querySelectorAll("header.reader-chrome-surface,.yomirra-reader-dock"));
      if(switchPalette){
        if(!matchMedia("(prefers-reduced-motion: no-preference)").matches || !root.classList.replace("light","dark")){
          throw new Error("Palette regression requires normal motion and an initially light reader");
        }
        // Settle the dark starting palette even when the original CSS transitions are present.
        for(const item of items) item.getBoundingClientRect();
        const paletteElements=items.flatMap(item=>[item,...item.querySelectorAll(".reader-chrome-control")]);
        await Promise.all(paletteElements.flatMap(el=>el.getAnimations().map(animation=>animation.finished)));
        if(!root.classList.replace("dark","light")) throw new Error("Dark reader palette changed before sampling");
        // Read the first light styles in this callback, before another frame can advance transitions.
      }
      return items.map(el=>{
        const style=getComputedStyle(el),bg=rgb(style.backgroundColor),rect=el.getBoundingClientRect();
        const text=[...el.querySelectorAll(".reader-chrome-primary,.reader-chrome-muted")].map(x=>({
          name:x.textContent?.trim(),
          ratio:ratio(rgb(getComputedStyle(x).color),bg),
        }));
        const controls=[...el.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")].map(x=>{
          const s=getComputedStyle(x),b=rgb(s.backgroundColor),r=x.getBoundingClientRect();
          return {name:x.getAttribute("aria-label") ?? x.textContent?.trim(),ratio:ratio(rgb(s.color),b[3]===255?b:bg),width:r.width,height:r.height};
        });
        return {alpha:bg[3],filter:style.backdropFilter||"none",left:rect.left,right:rect.right,text,controls,viewport:innerWidth};
      });
    },switchPalette);
    if(paletteTransition){
      const values=await measurements(true);
      expect(values).toHaveLength(2);
      const [headerValues,dockValues]=values;
      const titleContrast=headerValues.text.find(entry=>entry.name===title);
      expect(titleContrast?.ratio,"Reader title contrast on the palette switch").toBeGreaterThanOrEqual(4.5);
      for(const [surface,names] of [
        [headerValues,["Simpan ke Library"]],
        [dockValues,["Chapter sebelumnya","Daftar chapter","Chapter berikutnya","Pengaturan pembaca"]],
      ] as const){
        for(const name of names){
          const control=surface.controls.find(entry=>entry.name===name);
          expect(control?.ratio,name+" contrast on the palette switch").toBeGreaterThanOrEqual(4.5);
        }
      }
      return;
    }
    for(const backdrop of ["#000000","#ffffff"]){
      // The real chrome is rendered above this controlled image/canvas
      // backdrop; no claim that a provider image is being fetched live.
      await reader.evaluate((el,color)=>(el as HTMLElement).style.backgroundColor=color,backdrop);
      const values=await measurements();expect(values).toHaveLength(2);
      for(const v of values){
        expect(v.alpha).toBe(255);expect(v.filter).toBe("none");
        expect(v.left).toBeGreaterThanOrEqual(0);expect(v.right).toBeLessThanOrEqual(v.viewport+1);
        for(const entry of v.text)expect(entry.ratio).toBeGreaterThanOrEqual(4.5);
        for(const c of v.controls){expect(c.ratio).toBeGreaterThanOrEqual(4.5);expect(c.width).toBeGreaterThanOrEqual(43.5);expect(c.height).toBeGreaterThanOrEqual(43.5);}
      }
    }
    await header.getByRole("button",{name:"Simpan ke Library"}).click();
    await expect(header.getByRole("button",{name:"Hapus dari Library"})).toHaveAttribute("aria-pressed","true");
    for(const v of await measurements())for(const c of v.controls)expect(c.ratio).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    await page.screenshot({path:test.info().outputPath("reader-"+background+"-"+mode+".png")});
    if(mode==="paged"){
      const tap=reader.getByRole("button",{name:"Buka kontrol menu"});
      await tap.click();await expect(header).toHaveCount(0);await expect(dock).toHaveCount(0);
      await tap.click();await expect(header).toBeVisible();await expect(dock).toBeVisible();
    }else{
      const end=reader.locator("[data-reader-end-controls]");
      await expect.poll(()=>reader.locator(".reader-page-container img").first().evaluate((img:HTMLImageElement)=>[img.naturalWidth,img.naturalHeight])).toEqual([80,120]);
      await end.scrollIntoViewIfNeeded();await expect(end).toBeInViewport();await expect(dock).toHaveCount(0);
      await expect(reader.getByTestId("reader-page-scrubber")).toHaveCount(0);
      // Settle the actual virtual layout before starting another movement.
      // WebKit may defer compensation of virtual row measurements.
      const position=()=>end.evaluate(async card=>{
        const read=()=>({y:window.scrollY,top:card.getBoundingClientRect().top,height:document.documentElement.scrollHeight});
        const first=read();
        // Observe a quiet 200ms window, not just two frames in the middle of momentum.
        await new Promise<void>(resolve=>setTimeout(resolve,200));
        const last=read();
        return {...last,stable:Math.abs(first.y-last.y)<=1&&Math.abs(first.top-last.top)<=1&&first.height===last.height};
      });
      await expect.poll(async()=>{const p=await position();return p.stable&&p.y>60;},{message:"End-card layout must settle before header intent"}).toBe(true);
      // Explicit keyboard toggle must still expose header at chapter end.
      if(!await header.isVisible())await page.keyboard.press("m");
      await expect(header).toBeVisible();await expect(dock).toHaveCount(0);
      await expect.poll(async()=>{
        const origin=await position();
        return {stable:origin.stable,scrolled:origin.y>60,headerVisible:await header.isVisible()};
      },{timeout:5000,message:"Chapter-end origin must settle with the header visible"}).toEqual({stable:true,scrolled:true,headerVisible:true});
      // Exercise actual upward scroll and verify the viewport moved before
      // checking chrome. A failed navigation is not mislabeled as a chrome bug.
      await page.evaluate(()=>window.scrollTo(0,0));
      await expect.poll(async()=>{const p=await position();return p.stable&&p.y<=1&&p.top>=await page.evaluate(()=>innerHeight);},{message:"Return to top must move and settle outside the end card"}).toBe(true);
      await expect(end).not.toBeInViewport();
      await expect(header).toHaveCount(0);await expect(dock).toHaveCount(0);
      await page.mouse.click(width/2,Math.floor((await page.viewportSize())!.height/2));
      await expect(header).toBeVisible();await expect(dock).toBeVisible();
      await page.mouse.click(width/2,Math.floor((await page.viewportSize())!.height/2));
      await expect(header).toHaveCount(0);await expect(dock).toHaveCount(0);
    }
  });
}
