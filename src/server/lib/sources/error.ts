/**
 * Normalized machine-readable source failure codes.
 * Separates operational error codes from human-facing UI copy.
 */
export type SourceErrorCode =
  | "SOURCE_DOWN"
  | "DOMAIN_CHANGED"
  | "ROUTE_CHANGED"
  | "PARSER_BROKEN"
  | "SCHEMA_CHANGED"
  | "RATE_LIMITED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_BLOCKED"
  | "DECRYPT_FAILURE"
  | "IMAGE_CDN_FAILURE"
  | "UNKNOWN";

export type SourceHealthStage =
  | "transport"
  | "search"
  | "detail"
  | "chapters"
  | "pages"
  | "cdn";

export interface SourceErrorOptions {
  code: SourceErrorCode;
  sourceId: string;
  stage?: SourceHealthStage;
  statusCode?: number;
  cause?: unknown;
}

export class SourceError extends Error {
  readonly code: SourceErrorCode;
  readonly sourceId: string;
  readonly stage?: SourceHealthStage;
  readonly statusCode?: number;

  constructor(message: string, options: SourceErrorOptions) {
    super(message);
    this.name = "SourceError";
    this.code = options.code;
    this.sourceId = options.sourceId;
    this.stage = options.stage;
    this.statusCode = options.statusCode;
    if (options.cause) {
      this.cause = options.cause;
    }
    Object.setPrototypeOf(this, SourceError.prototype);
  }

  static isSourceError(err: unknown): err is SourceError {
    return err instanceof SourceError;
  }

  /**
   * Classify an arbitrary caught error into a normalized SourceError.
   */
  static classify(err: unknown, sourceId: string, stage?: SourceHealthStage): SourceError {
    if (SourceError.isSourceError(err)) {
      return err;
    }

    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    let code: SourceErrorCode = "UNKNOWN";
    let statusCode: number | undefined;

    // Check status code if present on error object
    if (typeof err === "object" && err !== null && "status" in err && typeof (err as any).status === "number") {
      statusCode = (err as any).status;
    } else if (typeof err === "object" && err !== null && "statusCode" in err && typeof (err as any).statusCode === "number") {
      statusCode = (err as any).statusCode;
    }

    if (statusCode === 429 || msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests")) {
      code = "RATE_LIMITED";
    } else if (
      statusCode === 403 ||
      msg.includes("403") ||
      msg.includes("cloudflare") ||
      msg.includes("access denied") ||
      msg.includes("captcha")
    ) {
      code = "UPSTREAM_BLOCKED";
    } else if (
      statusCode === 404 ||
      msg.includes("404") ||
      msg.includes("not found") ||
      msg.includes("route_changed")
    ) {
      code = stage === "search" || stage === "detail" || stage === "chapters" || stage === "pages"
        ? "ROUTE_CHANGED"
        : "SOURCE_DOWN";
    } else if (
      msg.includes("timeout") ||
      msg.includes("aborted") ||
      msg.includes("timed out") ||
      msg.includes("etimedout")
    ) {
      code = "UPSTREAM_TIMEOUT";
    } else if (
      msg.includes("econnrefused") ||
      msg.includes("enotfound") ||
      msg.includes("fetch failed") ||
      msg.includes("dns error") ||
      msg.includes("cert_has_expired") ||
      statusCode === 502 ||
      statusCode === 504 ||
      statusCode === 521 ||
      statusCode === 522
    ) {
      code = "SOURCE_DOWN";
    } else if (msg.includes("decrypt") || msg.includes("cipher") || msg.includes("aes-256")) {
      code = "DECRYPT_FAILURE";
    } else if (
      msg.includes("parser") ||
      msg.includes("cheerio") ||
      msg.includes("selector") ||
      msg.includes("empty unexpected parse")
    ) {
      code = "PARSER_BROKEN";
    } else if (
      msg.includes("schema") ||
      msg.includes("zod") ||
      msg.includes("unexpected json") ||
      msg.includes("cannot read properties of undefined")
    ) {
      code = "SCHEMA_CHANGED";
    } else if (msg.includes("domain") || msg.includes("moved permanently") || msg.includes("redirect loop")) {
      code = "DOMAIN_CHANGED";
    }

    return new SourceError(err instanceof Error ? err.message : String(err), {
      code,
      sourceId,
      stage,
      statusCode,
      cause: err,
    });
  }
}

/**
 * Normalized user-facing message mapping (Indonesian).
 * Kept strictly decoupled from machine-readable error codes.
 */
export function getFriendlyErrorMessage(codeOrMsg: SourceErrorCode | string): string {
  switch (codeOrMsg) {
    case "UPSTREAM_TIMEOUT":
      return "tidak dapat dijangkau (koneksi lambat/timeout)";
    case "UPSTREAM_BLOCKED":
      return "diblokir perlindungan situs (Cloudflare)";
    case "RATE_LIMITED":
      return "mencapai batas permintaan (rate limited)";
    case "SOURCE_DOWN":
      return "server sumber sedang tidak dapat dihubungi";
    case "DOMAIN_CHANGED":
      return "alamat domain sumber telah berpindah";
    case "ROUTE_CHANGED":
      return "perubahan struktur alamat URL pada sumber";
    case "PARSER_BROKEN":
      return "sedang bermasalah (perubahan struktur situs)";
    case "SCHEMA_CHANGED":
      return "format data sumber telah berubah";
    case "DECRYPT_FAILURE":
      return "gagal mendekripsi respon data dari sumber";
    case "IMAGE_CDN_FAILURE":
      return "server gambar sumber tidak dapat diakses";
    case "UNKNOWN":
    default:
      // Fallback inspection if raw message string was passed
      const lower = String(codeOrMsg).toLowerCase();
      if (lower.includes("timeout") || lower.includes("aborted") || lower.includes("fetch failed")) {
        return "tidak dapat dijangkau (koneksi lambat/putus)";
      }
      if (lower.includes("cloudflare") || lower.includes("403") || lower.includes("503")) {
        return "diblokir perlindungan situs (Cloudflare)";
      }
      if (lower.includes("parser") || lower.includes("cheerio") || lower.includes("selector")) {
        return "sedang bermasalah (perubahan struktur situs)";
      }
      return "gagal dimuat";
  }
}
