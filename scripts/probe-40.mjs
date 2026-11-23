import http from "node:http";
import https from "node:https";

const sources = [
  // 9 Built-ins
  { id: "shinigami", name: "Shinigami", type: "built-in", url: "https://api.shngm.io/v1/manga/list?page=1&page_size=1" },
  { id: "komikindo", name: "Komikindo", type: "built-in", url: "https://komikindo.ch" },
  { id: "mangadex", name: "MangaDex", type: "built-in", url: "https://api.mangadex.org/manga?limit=1" },
  { id: "komiku", name: "Komiku", type: "built-in", url: "https://komiku.org" },
  { id: "komiku-ii", name: "Komiku II", type: "built-in", url: "https://01.komiku.asia/api/v2/comics?page=1" },
  { id: "asurascans", name: "Asura Scans", type: "built-in", url: "https://api.asurascans.com/api/series?page=1" },
  { id: "komiknesia", name: "KomikNesia", type: "built-in", url: "https://api-be.komiknesia.my.id/api/contents?page=1&limit=1" },
  { id: "doujindesu", name: "Doujindesu", type: "built-in", url: "https://doujin.desu.xxx/api/manga?limit=1" },
  { id: "westmanga", name: "WestManga", type: "built-in", url: "https://data.mantweh.online/api/framework/config" },

  // 31 Candidates
  { id: "ainzscansid", name: "Ainz Scans ID", type: "candidate", url: "https://v3.ainzscans01.com" },
  { id: "akuma", name: "Akuma", type: "candidate", url: "https://akuma.moe" },
  { id: "astral-scans", name: "Astral Scans", type: "candidate", url: "https://astralscans.site" },
  { id: "cosmicscans", name: "CosmicScans", type: "candidate", url: "https://04.cosmicscans.to" },
  { id: "crotpedia", name: "CrotPedia", type: "candidate", url: "https://crotpedia.net" },
  { id: "dojing-net", name: "Dojing.net", type: "candidate", url: "https://dojing.net" },
  { id: "doujinku", name: "Doujinku", type: "candidate", url: "https://doujinku.org" },
  { id: "dreamteams-scans", name: "DreamTeams Scans", type: "candidate", url: "https://dreamteams.space" },
  { id: "hentai-crot", name: "Hentai Crot", type: "candidate", url: "https://hentaicrot.com" },
  { id: "hentaihand", name: "HentaiHand", type: "candidate", url: "https://hentaihand.com" },
  { id: "izanamiscans", name: "Izanami Scans", type: "candidate", url: "https://izanamiscans.my.id" },
  { id: "kiryuu", name: "Kiryuu", type: "candidate", url: "https://v7.kiryuu.to" },
  { id: "komikindoid", name: "KomikIndoID", type: "candidate", url: "https://komikindo.ch" },
  { id: "kumapoi", name: "KumaPoi", type: "candidate", url: "https://kumapoi.info" },
  { id: "manga-plus-by-shueisha", name: "MANGA Plus by SHUEISHA", type: "candidate", url: "https://jumpg-webapi.tokyo-cdn.com/api" },
  { id: "mangasusu", name: "Mangasusu", type: "candidate", url: "https://mangasusuku.com" },
  { id: "mangatoon-limited", name: "MangaToon (Limited)", type: "candidate", url: "https://mangatoon.mobi/api" },
  { id: "manhuarm", name: "Manhuarm", type: "candidate", url: "https://manhuarmtl.com" },
  { id: "manhwa-indo", name: "Manhwa Indo", type: "candidate", url: "https://www.manhwaindo.my" },
  { id: "manhwa-list", name: "Manhwa List", type: "candidate", url: "https://m1.manhwalist.my.id" },
  { id: "manhwadesu", name: "ManhwaDesu", type: "candidate", url: "https://manhwadesu.wiki" },
  { id: "manhwaland-mom", name: "ManhwaLand.mom", type: "candidate", url: "https://02.manhwaland.land" },
  { id: "mihentai", name: "Mihentai", type: "candidate", url: "https://mihentai.net" },
  { id: "mikoroku", name: "MikoRoku", type: "candidate", url: "https://mikoroku.com" },
  { id: "pix-hentai", name: "Pix Hentai", type: "candidate", url: "https://pixhentai.com" },
  { id: "ryukomik", name: "Ryukomik", type: "candidate", url: "https://ryukomik.my.id" },
  { id: "sekte-doujin", name: "Sekte Doujin", type: "candidate", url: "https://sektedoujin.cc" },
  { id: "shiro-doujin", name: "Shiro Doujin", type: "candidate", url: "https://shirodoujin.com" },
  { id: "soul-scans", name: "Soul Scans", type: "candidate", url: "https://v1.soulscans.org" },
  { id: "tooncubus", name: "Tooncubus", type: "candidate", url: "https://www.tooncubus.top" },
  { id: "webcomics", name: "Webcomics", type: "candidate", url: "https://webcomicsapp.com" },
];

async function probe(s) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(s.url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/json,*/*",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    const latency = Date.now() - start;
    const server = res.headers.get("server") || "";
    const isCloudflare = server.toLowerCase().includes("cloudflare");
    const cfRay = res.headers.get("cf-ray");
    let statusText = `${res.status} ${res.statusText}`;
    if (res.status === 403 && (isCloudflare || cfRay)) {
      statusText = "403 (Cloudflare WAF/Challenge)";
    }
    return { id: s.id, name: s.name, type: s.type, status: res.status, statusText, latency: `${latency}ms`, ok: res.ok };
  } catch (err) {
    const latency = Date.now() - start;
    let msg = err.message || "Unknown error";
    if (err.name === "AbortError") msg = "TIMEOUT (>6000ms)";
    return { id: s.id, name: s.name, type: s.type, status: 0, statusText: msg, latency: `${latency}ms`, ok: false };
  }
}

async function run() {
  console.log("PROBING 40 SOURCES...");
  const results = [];
  // Bounded concurrency 4
  for (let i = 0; i < sources.length; i += 4) {
    const chunk = sources.slice(i, i + 4);
    const chunkRes = await Promise.all(chunk.map(probe));
    results.push(...chunkRes);
  }
  console.log(JSON.stringify(results, null, 2));
}

run();
