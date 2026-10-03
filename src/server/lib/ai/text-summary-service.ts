import { generateAiText } from "./ai-provider";

export interface SummaryResult {
  summary: string;
  source: "ai" | "fallback";
  cached?: boolean;
}

export async function summarizeMangaMetadata(
  mangaId: string,
  title: string,
  synopsis?: string
): Promise<SummaryResult> {
  const fallbackSynopsis = synopsis || "Tidak ada sinopsis.";

  if (!title) {
    return {
      summary: fallbackSynopsis,
      source: "fallback",
      cached: false,
    };
  }

  const prompt = `Anda adalah asisten kurasi komik Yomirra. Buat ringkasan cerita singkat dan menarik tanpa spoiler dalam Bahasa Indonesia untuk manga berikut:
Judul: ${title}
Sinopsis asli: ${fallbackSynopsis}`;

  const res = await generateAiText({ prompt });
  if (res.success && res.text) {
    return {
      summary: res.text,
      source: "ai",
      cached: false,
    };
  }

  return {
    summary: fallbackSynopsis,
    source: "fallback",
    cached: false,
  };
}
