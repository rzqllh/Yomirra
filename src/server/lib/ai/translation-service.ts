import { callGeminiGenerateContent } from "./ai-provider";

export interface TranslationRequest {
  text: string;
  targetLanguage?: string; // e.g. "id" or "en"
  sourceLanguage?: string; // e.g. "ja", "ko", "zh", "en"
}

export interface TranslationResponse {
  success: boolean;
  originalText: string;
  translatedText?: string;
  targetLanguage: string;
  error?: string;
  code?: string;
}

/**
 * Translate extracted manga text into Indonesian or target language.
 * Preserves comic tone and dialogue flow without inventing missing text.
 */
export async function translateMangaText(
  params: TranslationRequest
): Promise<TranslationResponse> {
  const cleanText = params.text.trim();
  const targetLang = params.targetLanguage || "id";

  if (!cleanText) {
    return {
      success: false,
      originalText: "",
      targetLanguage: targetLang,
      code: "EMPTY_TEXT",
      error: "Teks yang akan diterjemahkan tidak boleh kosong.",
    };
  }

  const targetLangName =
    targetLang === "en"
      ? "English"
      : targetLang === "id"
        ? "Bahasa Indonesia"
        : targetLang;

  const prompt = `Anda adalah penerjemah komik / manga / manhwa profesional ke ${targetLangName}.
Pedoman penerjemahan:
1. Terjemahkan dialog dan narasi berikut ke dalam ${targetLangName} yang natural, luwes, dan sesuai konteks baca komik.
2. Jangan mengarang narasi tambahan atau mengubah arti dialog.
3. Pertahankan baris dan format percakapan jika teks berisi dialog multi-baris.
4. Kembalikan HANYA hasil terjemahannya saja, tanpa komentar pembuka atau penutup.

Teks sumber:
${cleanText}
`;

  const result = await callGeminiGenerateContent([{ text: prompt }]);

  if ("error" in result) {
    return {
      success: false,
      originalText: cleanText,
      targetLanguage: targetLang,
      code: result.error.code,
      error: result.error.message,
    };
  }

  return {
    success: true,
    originalText: cleanText,
    translatedText: result.text,
    targetLanguage: targetLang,
  };
}
