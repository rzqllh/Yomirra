import { cookies } from "next/headers";

export async function getManifestUrlFromCookie(sourceId: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("yomirra_dynamic_sources_urls");
    if (!cookie?.value) return undefined;
    
    const parsed = JSON.parse(decodeURIComponent(cookie.value));
    return parsed[sourceId];
  } catch (error) {
    return undefined;
  }
}
