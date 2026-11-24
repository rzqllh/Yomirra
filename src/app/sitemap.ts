import type {MetadataRoute} from "next";
export default function sitemap():MetadataRoute.Sitemap{
  const origin="https://www.yomirra.web.id";
  return ["/","/help","/library","/popular","/sources"].map(path=>({url:new URL(path,origin).href}));
}
