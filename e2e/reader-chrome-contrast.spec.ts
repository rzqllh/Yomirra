import {test,expect} from "./fixtures";
import Redis from "ioredis";
import {randomUUID} from "node:crypto";

test.use({serviceWorkers:"block",reducedMotion:"reduce"});
// Reader acceptance must pass on the first attempt, not hide a WebKit race.
test.describe.configure({retries:0});
// Solid 80x120 PNG, matching declared chapter metadata. A 1x1 image
// changes the measured virtual page height on decode and moves the scroll anchor.
const fixtureImage=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAFAAAAB4AQAAAABNlUhbAAAAGklEQVR42mP8zwADTAyjzFHmKHOUOcrEYAIAkioB78sU6ikAAAAASUVORK5CYII=","base64");
// Exercise the actual ReaderView/ReaderShell with disposable CI Redis
// fixtures. No upstream requests, public user data or production cache writes.
for(const [background,appTheme,width,mode] of [["mist","dark",320,"paged"],["black","light",393,"paged"],["deepLagoon","light",1440,"paged"],["black","dark",393,"vertical"]] as const){
  test("reader chrome contrast: "+background+" / "+width+" / "+mode,async({page,baseURL})=>{
    const redisUrl=process.env.REDIS_URL;
    const host=redisUrl?new URL(redisUrl).hostname:"";
    test.skip(process.env.CI!=="true"||process.env.E2E_PRODUCTION_BUILD!=="1"||
      !baseURL||new URL(baseURL).hostname!=="localhost"||!["redis","localhost","127.0.0.1"].includes(host),
      "Requires isolated production-build CI Redis fixture");
    test.setTimeout(60000);
    const redis=new Redis(redisUrl!,{maxRetriesPerRequest:1,connectTimeout:2000});
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
    const header=page.locator(".reader-contrast-scope header.reader-chrome-surface");
    const dock=page.getByRole("group",{name:"Kontrol pembaca"});
    await expect(header.getByText(title,{exact:true})).toBeVisible({timeout:20000});
    await expect(dock).toBeVisible();
    await expect(dock.getByRole("button",{name:"Chapter berikutnya"})).toBeEnabled();
    const measurements=async()=>page.evaluate(()=>{
      function rgb(value:string){
        const c=document.createElement("canvas");c.width=c.height=1;
        const ctx=c.getContext("2d")!;ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);
        return Array.from(ctx.getImageData(0,0,1,1).data);
      }
      function lum(v:number[]){const a=v.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];}
      function ratio(a:number[],b:number[]){return (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);}
      const items=Array.from(document.querySelectorAll(".reader-contrast-scope header.reader-chrome-surface,.reader-contrast-scope .yomirra-reader-dock"));
      return items.map(el=>{
        const style=getComputedStyle(el),bg=rgb(style.backgroundColor),rect=el.getBoundingClientRect();
        const text=[...el.querySelectorAll(".reader-chrome-primary,.reader-chrome-muted")].map(x=>ratio(rgb(getComputedStyle(x).color),bg));
        const controls=[...el.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")].map(x=>{
          const s=getComputedStyle(x),b=rgb(s.backgroundColor),r=x.getBoundingClientRect();
          return {ratio:ratio(rgb(s.color),b[3]===255?b:bg),width:r.width,height:r.height};
        });
        return {alpha:bg[3],filter:style.backdropFilter||"none",left:rect.left,right:rect.right,text,controls,viewport:innerWidth};
      });
    });
    for(const backdrop of ["#000000","#ffffff"]){
      // The real chrome is rendered above this controlled image/canvas
      // backdrop; no claim that a provider image is being fetched live.
      await page.locator(".reader-contrast-scope").evaluate((el,color)=>(el as HTMLElement).style.backgroundColor=color,backdrop);
      const values=await measurements();expect(values).toHaveLength(2);
      for(const v of values){
        expect(v.alpha).toBe(255);expect(v.filter).toBe("none");
        expect(v.left).toBeGreaterThanOrEqual(0);expect(v.right).toBeLessThanOrEqual(v.viewport+1);
        for(const ratio of v.text)expect(ratio).toBeGreaterThanOrEqual(4.5);
        for(const c of v.controls){expect(c.ratio).toBeGreaterThanOrEqual(4.5);expect(c.width).toBeGreaterThanOrEqual(43.5);expect(c.height).toBeGreaterThanOrEqual(43.5);}
      }
    }
    await header.getByRole("button",{name:"Simpan ke Library"}).click();
    await expect(header.getByRole("button",{name:"Hapus dari Library"})).toHaveAttribute("aria-pressed","true");
    for(const v of await measurements())for(const c of v.controls)expect(c.ratio).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    await page.screenshot({path:test.info().outputPath("reader-"+background+"-"+mode+".png")});
    if(mode==="paged"){
      const tap=page.getByRole("button",{name:"Buka kontrol menu"});
      await tap.click();await expect(header).toHaveCount(0);await expect(dock).toHaveCount(0);
      await tap.click();await expect(header).toBeVisible();await expect(dock).toBeVisible();
    }else{
      const end=page.locator("[data-reader-end-controls]");
      await expect.poll(()=>page.locator(".reader-page-container img").first().evaluate((img:HTMLImageElement)=>[img.naturalWidth,img.naturalHeight])).toEqual([80,120]);
      await end.scrollIntoViewIfNeeded();await expect(end).toBeInViewport();await expect(dock).toHaveCount(0);
      await expect(page.getByTestId("reader-page-scrubber")).toHaveCount(0);
      // Explicit keyboard toggle must still expose header at chapter end.
      if(!await header.isVisible())await page.keyboard.press("m");
      await expect(header).toBeVisible();await expect(dock).toHaveCount(0);
      expect(await page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
      await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
      await expect(header).toHaveCount(0);await expect(dock).toHaveCount(0);
      await expect(end).not.toBeInViewport();
      // Await actual scroll settlement across two animation frames. WebKit
      // may apply the programmatic scroll asynchronously.
      await expect.poll(()=>page.evaluate(async()=>{
        const before=window.scrollY;
        await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
        return Math.abs(before-window.scrollY)<=1&&window.scrollY<=1;
      })).toBe(true);
      await page.mouse.click(width/2,Math.floor((await page.viewportSize())!.height/2));
      await expect(header).toBeVisible();await expect(dock).toBeVisible();
      await page.mouse.click(width/2,Math.floor((await page.viewportSize())!.height/2));
      await expect(header).toHaveCount(0);await expect(dock).toHaveCount(0);
    }
  });
}
