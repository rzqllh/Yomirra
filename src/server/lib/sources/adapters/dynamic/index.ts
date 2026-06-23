import { MangaSource, MangaPageResult, MangaDetail, Chapter, ChapterPages, FilterList, SourceMetadata } from "@/shared/sources/source-types";
import { MihonSourceManifest } from "@/shared/sources/dynamic-source-registry";

export class DynamicSourceAdapter implements MangaSource {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly language?: string;
  public readonly baseUrl?: string;
  public readonly icon?: string;
  public readonly version?: string;
  public readonly isEnabled: boolean = true;
  public readonly isInstalled: boolean = true;
  public readonly capabilities: SourceMetadata["capabilities"];
  public readonly isNsfw: boolean;
  public readonly manifestUrl?: string;

  private manifest: MihonSourceManifest;

  constructor(manifest: MihonSourceManifest) {
    this.manifest = manifest;
    this.id = manifest.id;
    this.name = manifest.name;
    this.language = manifest.lang;
    this.baseUrl = manifest.baseUrl;
    this.icon = manifest.icon;
    this.version = manifest.version;
    this.isNsfw = manifest.nsfw;
    this.manifestUrl = manifest.manifestUrl;
    this.capabilities = {
      popular: manifest.capabilities.includes("popular"),
      latest: manifest.capabilities.includes("latest"),
      search: manifest.capabilities.includes("search"),
      detail: manifest.capabilities.includes("detail"),
      chapters: manifest.capabilities.includes("chapters"),
      pages: manifest.capabilities.includes("pages"),
    };
  }

  private async fetchApi<T>(endpoint: string | undefined, replacements: Record<string, string | number>): Promise<T> {
    if (!endpoint) {
      throw new Error("Endpoint not supported by this source.");
    }
    
    let url = endpoint;
    for (const [key, value] of Object.entries(replacements)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
    
    const fullUrl = url.startsWith("http") ? url : `${this.manifest.baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
    
    const res = await fetch(fullUrl);
    if (!res.ok) {
      throw new Error(`Custom source API error: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    if (!this.capabilities.popular) throw new Error("Not supported");
    return this.fetchApi<MangaPageResult>(this.manifest.endpoints?.popular, { page });
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    if (!this.capabilities.latest) throw new Error("Not supported");
    return this.fetchApi<MangaPageResult>(this.manifest.endpoints?.latest, { page });
  }

  async search(query: string, page: number, filters?: Record<string, string | string[]>): Promise<MangaPageResult> {
    if (!this.capabilities.search) throw new Error("Not supported");
    // We only pass {q} and {page} for now to the simple replacement logic. 
    // If the API requires filter params, they need to be appended.
    let url = this.manifest.endpoints?.search;
    if (!url) throw new Error("Not supported");
    
    // Replace standard params
    url = url.replace("{q}", encodeURIComponent(query)).replace("{page}", String(page));
    
    // Append extra filters
    if (filters && Object.keys(filters).length > 0) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (Array.isArray(v)) {
          v.forEach(val => sp.append(k, val));
        } else {
          sp.set(k, v);
        }
      }
      url += (url.includes("?") ? "&" : "?") + sp.toString();
    }
    
    const fullUrl = url.startsWith("http") ? url : `${this.manifest.baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return await res.json();
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    if (!this.capabilities.detail) throw new Error("Not supported");
    return this.fetchApi<MangaDetail>(this.manifest.endpoints?.detail, { id: mangaId });
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    if (!this.capabilities.chapters) throw new Error("Not supported");
    return this.fetchApi<Chapter[]>(this.manifest.endpoints?.chapters, { id: mangaId });
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    if (!this.capabilities.pages) throw new Error("Not supported");
    return this.fetchApi<ChapterPages>(this.manifest.endpoints?.pages, { id: chapterId });
  }

  getFilters(): FilterList {
    return {
      genres: [],
      formats: [],
      statuses: [],
      sorts: [],
    };
  }
}
