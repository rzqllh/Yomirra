/** Map machine-readable errors to safe user guidance, never raw upstream content. */
export function getCatalogErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    && typeof error.code === "string" ? error.code : "UNKNOWN";

  switch (code) {
    case "UPSTREAM_BLOCKED":
      return "Sumber ini menolak permintaan Yomirra. Pilih sumber lain untuk sementara.";
    case "UPSTREAM_TIMEOUT":
      return "Sumber terlalu lama merespons. Coba lagi nanti.";
    case "SOURCE_DOWN":
      return "Katalog sumber sedang bermasalah. Coba lagi nanti.";
    case "RATE_LIMITED":
      return "Batas permintaan tercapai. Coba lagi nanti.";
    case "PARSER_BROKEN":
    case "SCHEMA_CHANGED":
    case "ROUTE_CHANGED":
      return "Format data sumber berubah. Katalog belum bisa ditampilkan.";
    case "CONTENT_RESTRICTED":
      return "Konten ini hanya tersedia untuk akun dengan usia terverifikasi.";
    case "SOURCE_DISABLED":
      return "Sumber sedang dinonaktifkan. Pilih sumber lain.";
    default:
      return "Katalog belum bisa dimuat. Coba lagi nanti.";
  }
}
