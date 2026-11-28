import {test,expect} from "./fixtures";
test.use({serviceWorkers:"block",reducedMotion:"reduce"});
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAFAAAAB4AQAAAABNlUhbAAAAGklEQVR42mP8zwADTAyjzFHmKHOUOcrEYAIAkioB78sU6ikAAAAASUVORK5CYII=","base64");
for(const [width,theme] of [[320,"dark"],[1440,"light"]] as const){
  test("source icon and health evidence at "+width+" / "+theme,async({page},info)=>{
    await page.setViewportSize({width,height:900});
    await page.addInitScript(theme=>{
      localStorage.setItem("theme",theme);
      localStorage.setItem("yomirra-onboarding",JSON.stringify({state:{hasCompletedOnboarding:true},version:0}));
    },theme);
    const base={language:"id",description:"Fixture",baseUrl:"https://example.test",version:"1.0.0",isEnabled:true,isInstalled:true,isDynamic:false,isNsfw:false,status:"unknown",capabilities:{popular:true,latest:true,search:true,detail:true,chapters:true,pages:true}};
    const sources=[
      {...base,id:"mangadex",name:"MangaDex Fixture",icon:"https://example.test/fixture-icon.png"},
      {...base,id:"komiku",name:"Komiku Fixture",icon:"https://example.test/missing-icon.png"},
      {...base,id:"asurascans",name:"Staged Fixture",status:"in-dev",icon:""}
    ];
    await page.route("**/api/sources",route=>route.fulfill({json:{data:sources}}));
    await page.route("**/api/sources/health",route=>route.fulfill({json:{data:{
      mangadex:{status:"online",coverage:"catalog",latency:"100 ms",uptime:"100%",checkedAt:new Date().toISOString(),message:"Fixture"},
      komiku:{status:"degraded",latency:"-",uptime:"-",checkedAt:new Date().toISOString(),message:"Fixture probe failed"},
      asurascans:{status:"online",coverage:"page-references",latency:"100 ms",uptime:"100%",checkedAt:new Date().toISOString(),message:"Fixture"}
    }}}));
    await page.route("https://example.test/fixture-icon.png",route=>route.fulfill({contentType:"image/png",body:png}));
    await page.route("https://example.test/missing-icon.png",route=>route.fulfill({status:404,body:""}));
    await page.goto("/sources",{waitUntil:"domcontentloaded"});
    const good=page.locator("article").filter({has:page.getByRole("heading",{name:"MangaDex Fixture"})});
    const bad=page.locator("article").filter({has:page.getByRole("heading",{name:"Komiku Fixture"})});
    await expect(good.getByText("Katalog teruji; reader belum diuji")).toBeVisible();
    await expect(good.locator("img")).toHaveCSS("opacity","1");
    await expect.poll(()=>good.locator("img").evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
    await expect(bad.getByText("KF",{exact:true})).toBeVisible();
    await expect(bad.locator("img")).toHaveCount(0);
    await expect(bad.getByText("Fixture probe failed")).toBeVisible();
    const report=bad.getByRole("button",{name:"Laporkan"});
    await expect(report).toBeVisible();
    expect((await report.boundingBox())?.height).toBeGreaterThanOrEqual(43.5);
    const staged=page.locator("article").filter({has:page.getByRole("heading",{name:"Staged Fixture",exact:true})});
    await expect(staged.getByText("Dalam pengembangan",{exact:true})).toBeVisible();
    await expect(staged.getByText("Belum tersedia",{exact:true})).toBeVisible();
    await expect(staged.getByRole("checkbox")).toBeDisabled();
    await expect(staged.getByRole("checkbox")).not.toBeChecked();
    await expect(staged.getByRole("button",{name:"Buka Jelajah"})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({path:info.outputPath("source-health-icons.png"),animations:"disabled"});
  });
}
