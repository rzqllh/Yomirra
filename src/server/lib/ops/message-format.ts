import { getSourceMetadata } from "@/shared/sources/source-registry";
import type { SourceErrorCode, SourceHealthStage } from "@/server/lib/sources/error";

export function sourceDisplayName(sourceId: string): string {
  return getSourceMetadata(sourceId)?.name || sourceId;
}

export function formatLatency(latencyMs: number): string {
  if (!Number.isFinite(latencyMs) || latencyMs <= 0) return "belum terukur";
  return latencyMs >= 1000
    ? `${(latencyMs / 1000).toFixed(1)}s`
    : `${Math.round(latencyMs)}ms`;
}

export function formatWibTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date) + " WIB";
}

export function formatWibDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function impactForStage(stage?: SourceHealthStage): string {
  switch (stage) {
    case "transport":
      return "Sumber tidak bisa dihubungi.";
    case "search":
      return "Pencarian dari sumber ini bisa gagal.";
    case "detail":
      return "Detail komik bisa gagal dimuat.";
    case "chapters":
      return "Daftar chapter tidak bisa dimuat.";
    case "pages":
      return "Halaman chapter tidak bisa dimuat.";
    case "cdn":
      return "Gambar komik bisa gagal dimuat.";
    default:
      return "Sebagian fungsi sumber bisa terganggu.";
  }
}

export function failureGuidance(
  code: SourceErrorCode | undefined,
  stage?: SourceHealthStage
): { cause: string; action: string } {
  switch (code) {
    case "DOMAIN_CHANGED":
      return {
        cause: "Domain sumber kemungkinan berpindah.",
        action: "Cek domain aktif lalu perbarui konfigurasi source.",
      };
    case "ROUTE_CHANGED":
      return {
        cause: "Endpoint atau path source kemungkinan berubah.",
        action: `Cek route adapter${stage ? ` pada stage ${stage}` : ""}.`,
      };
    case "PARSER_BROKEN":
      return {
        cause: "Struktur halaman kemungkinan berubah dan parser tidak lagi cocok.",
        action: `Cek parser${stage ? ` ${stage}` : ""} pada adapter source.`,
      };
    case "SCHEMA_CHANGED":
      return {
        cause: "Bentuk respons API kemungkinan berubah.",
        action: `Cek schema dan normalizer${stage ? ` untuk stage ${stage}` : ""}.`,
      };
    case "DECRYPT_FAILURE":
      return {
        cause: "Proses decrypt atau ekstraksi key gagal.",
        action: "Cek decryptor dan alur ekstraksi key.",
      };
    case "RATE_LIMITED":
      return {
        cause: "Source sedang membatasi jumlah request.",
        action: "Tunggu lalu recheck. Jangan ubah adapter sebelum ada error lain.",
      };
    case "UPSTREAM_TIMEOUT":
      return {
        cause: "Server source merespons terlalu lambat atau sedang tidak stabil.",
        action: "Recheck beberapa menit lagi sebelum investigasi adapter.",
      };
    case "UPSTREAM_BLOCKED":
      return {
        cause: "Request kemungkinan diblokir proteksi upstream.",
        action: "Cek status upstream, header request, dan proteksi akses source.",
      };
    case "IMAGE_CDN_FAILURE":
      return {
        cause: "CDN atau host gambar tidak merespons dengan benar.",
        action: "Cek host gambar, referer, dan jalur proxy image.",
      };
    case "SOURCE_DOWN":
      return {
        cause: "Server atau domain source sedang tidak bisa dijangkau.",
        action: "Cek situs sumber dan domain aktif, lalu recheck.",
      };
    default:
      return {
        cause: "Penyebab belum bisa dipastikan dari health probe.",
        action: "Jalankan recheck dulu, lalu lihat stage dan detail error jika masih gagal.",
      };
  }
}

export function statusIcon(status: string): string {
  if (status === "HEALTHY") return "🟢";
  if (status === "DEGRADED" || status === "RATE_LIMITED") return "🟠";
  if (status === "UNKNOWN") return "⚪";
  return "🔴";
}
