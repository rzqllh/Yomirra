import { callGeminiGenerateContent } from "./ai-provider";

export interface AISummaryRequest {
  title: string;
  synopsis?: string;
  genres?: string[];
  language?: string; // e.g. "id" or "en"
}

export interface AISummaryResponse {
  success: boolean;
  summary?: string;
  error?: string;
  code?: string;
}

/**
 * Generate a concise, spoiler-free manga summary/hook for reader discovery.
 */
export async function generateTitleSummary(
  params: AISummaryRequest
): Promise<AISummaryResponse> {
  const lang = params.language || "id";
  const languagePrompt =
    lang === "en"
      ? "Respond in natural English."
      : "Jawab dalam Bahasa Indonesia yang alami, menarik, dan informatif.";

  const prompt = `Anda adalah asisten kurasi komik Yomirra.
Buat ringkasan singkat dan menarik (maksimal 3 paragraf pendek atau 120 kata) tanpa spoiler untuk judul manga berikut.
${languagePrompt}

Judul: ${params.title}
Genre: ${params.genres ? params.genres.join(", ") : "Umum"}
Sinopsis asli: ${params.synopsis || "Tidak tersedia."}
`;

  const result = await callGeminiGenerateContent([{ text: prompt }]);

  if ("error" in result) {
    return {
      success: false,
      code: result.error.code,
      error: result.error.message,
    };
  }

  return {
    success: true,
    summary: result.text,
  };
}
