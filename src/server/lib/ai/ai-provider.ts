import { env } from "@/env";
import { logger } from "@/shared/logger";

const DEFAULT_AI_MODEL = "gemini-1.5-flash";
const DEFAULT_TIMEOUT_MS = 12000;
const MAX_PROMPT_CHARS = 10000;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface GenerateVisionOptions {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AiResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export type GeminiPart =
  | { text?: string }
  | { inlineData?: { mimeType: string; data: string } };

export type GeminiResult =
  | { text: string }
  | { error: { code: string; message: string } };

export function isAiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
}

export const isAIConfigured = isAiConfigured;

/**
 * Low-level server-only content generator using Gemini.
 */
export async function callGeminiGenerateContent(
  parts: GeminiPart[],
  options?: {
    systemInstruction?: string;
    maxTokens?: number;
    temperature?: number;
    timeoutMs?: number;
  }
): Promise<GeminiResult> {
  if (!isAiConfigured()) {
    return {
      error: {
        code: "AI_UNCONFIGURED",
        message: "AI provider is not configured on this server.",
      },
    };
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const apiKey = env.GEMINI_API_KEY!;

  try {
    const body: Record<string, unknown> = {
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.3,
      },
    };

    if (options?.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction.slice(0, 1000) }],
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_AI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      logger.warn("AI generation upstream error", { status: response.status, details: errText.slice(0, 200) });
      return {
        error: {
          code: "UPSTREAM_ERROR",
          message: `Upstream AI provider error (${response.status})`,
        },
      };
    }

    const json = (await response.json()) as any;
    const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText || typeof candidateText !== "string") {
      return {
        error: {
          code: "EMPTY_RESPONSE",
          message: "AI provider returned empty response.",
        },
      };
    }

    return { text: candidateText.trim() };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    const errorMessage = isTimeout ? "AI generation request timed out." : "AI service temporarily unavailable.";
    logger.warn("AI generation failed", { error: err instanceof Error ? err.message : String(err) });
    return {
      error: {
        code: isTimeout ? "TIMEOUT" : "UNAVAILABLE",
        message: errorMessage,
      },
    };
  }
}

/**
 * Server-only bounded text generation using Gemini.
 */
export async function generateAiText(options: GenerateTextOptions): Promise<AiResponse> {
  const prompt = options.prompt?.trim();
  if (!prompt) {
    return { success: false, error: "Prompt must not be empty." };
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    return { success: false, error: `Prompt exceeds maximum length of ${MAX_PROMPT_CHARS} characters.` };
  }

  const result = await callGeminiGenerateContent([{ text: prompt }], {
    systemInstruction: options.systemInstruction,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    timeoutMs: options.timeoutMs,
  });

  if ("error" in result) {
    return { success: false, error: result.error.message };
  }

  return { success: true, text: result.text };
}

/**
 * Server-only bounded vision extraction using Gemini Multimodal.
 */
export async function generateAiVision(options: GenerateVisionOptions): Promise<AiResponse> {
  if (!options.imageBase64) {
    return { success: false, error: "Image data is required." };
  }

  const result = await callGeminiGenerateContent(
    [
      {
        inlineData: {
          mimeType: options.mimeType || "image/jpeg",
          data: options.imageBase64,
        },
      },
      { text: options.prompt.slice(0, 2000) },
    ],
    {
      maxTokens: options.maxTokens,
      temperature: 0.2,
      timeoutMs: options.timeoutMs,
    }
  );

  if ("error" in result) {
    return { success: false, error: result.error.message };
  }

  return { success: true, text: result.text };
}
