/** Map machine-readable errors to safe user guidance, never raw upstream content. */
export function getCatalogErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    && typeof error.code === "string" ? error.code : "UNKNOWN";

  switch (code) {
    case "UPSTREAM_BLOCKED":
      return "Situs sumber menolak akses dari server Yomirra. Coba sumber lain sementara; mengulang permintaan belum tentu berhasil.";
    case "UPSTREAM_TIMEOUT":
      return "Situs sumber terlalu lama merespons. Coba lagi nanti atau pilih sumber lain.";
    case "SOURCE_DOWN":
      return "Server sumber sedang bermasalah. Coba lagi nanti atau pilih sumber lain.";
    case "RATE_LIMITED":
      return "Batas permintaan sumber sedang tercapai. Jangan coba berulang kali; tunggu sebelum memuat ulang.";
    case "PARSER_BROKEN":
    case "SCHEMA_CHANGED":
    case "ROUTE_CHANGED":
      return "Struktur katalog sumber berubah dan belum kompatibel. Adapter perlu diperbarui.";
    case "CONTENT_RESTRICTED":
      return "Sumber dibatasi oleh pengaturan konten.";
    case "SOURCE_DISABLED":
      return "Sumber ini tidak tersedia karena dinonaktifkan pengelola.";
    default:
      return "Data dari sumber ini belum bisa dimuat. Coba lagi sebentar.";
  }
}
