// @vitest-environment node
import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const css=readFileSync(resolve(process.cwd(),"src/app/(web)/globals.css"),"utf8");
function palette(mode:string){
  const block=css.split(".reader-contrast-scope."+mode+" {")[1].split("}")[0];
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6});/gi)].map(m=>[m[1],m[2]]));
}
function luminance(hex:string){
  const values=hex.slice(1).match(/../g)!.map(s=>parseInt(s,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  return .2126*values[0]+.7152*values[1]+.0722*values[2];
}
function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
describe("reader chrome contrast palette",()=>{
  for(const mode of ["dark","light"])it(mode+" text, controls, focus and track meet target ratios",()=>{
    const p=palette(mode);
    for(const foreground of ["--text-primary","--text-muted","--text-secondary"])
      for(const surface of ["--surface-overlay","--surface-raised","--surface-hover"])
        expect(contrast(p[foreground],p[surface]),foreground+" on "+surface).toBeGreaterThanOrEqual(4.5);
    for(const accent of ["--color-accent","--color-accent-hover"])
      expect(contrast(p["--text-on-accent"],p[accent])).toBeGreaterThanOrEqual(4.5);
    for(const key of ["--reader-chrome-edge","--reader-chrome-track","--reader-chrome-focus","--color-accent"])
      expect(contrast(p[key],p["--surface-overlay"]),key).toBeGreaterThanOrEqual(3);
    expect(contrast(p["--reader-chrome-focus"],p["--surface-hover"])).toBeGreaterThanOrEqual(3);
  });
});
