import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots{
  const origin="https://www.yomirra.web.id";
  return {rules:{userAgent:"*",allow:"/",disallow:["/api/","/admin","/account","/bookmark","/history","/downloads","/settings","/catalog/","/manga/*/read/"]},sitemap:origin+"/sitemap.xml"};
}
