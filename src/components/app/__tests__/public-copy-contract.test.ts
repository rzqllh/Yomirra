import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");

describe("public copy contracts", () => {
  it("keeps Home language aligned with the accepted editorial contract", () => {
    const hero = read("src/components/app/home-hero.tsx");

    expect(hero).toContain("LANJUT LAGI DI YOMIRRA");
    expect(hero).toContain("BACAANMU DIMULAI DI SINI");
    expect(hero).toContain("Mau baca apa hari ini?");
    expect(hero).toContain("Cari judul atau kreator…");
  });

  it("does not expose cloud implementation details in the account surface", () => {
    const account = read("src/app/(web)/account/page.tsx");

    expect(account).toContain("Sinkronisasi cloud");
    expect(account).toContain("Tersinkron: bookmark, riwayat baca, koleksi");
    expect(account).not.toContain("Firebase Firestore");
    expect(account).not.toContain("UID:");
  });

  it("describes local data deletion according to the store behavior", () => {
    const settings = read("src/components/settings/settings-view.tsx");

    expect(settings).toContain("Riwayat baca dan bookmark lokal akan dihapus");
    expect(settings).toContain("Unduhan tetap tersimpan");
    expect(settings).not.toContain("cooldown");
    expect(settings).not.toContain("Sembunyikan NSFW");
  });

  it("keeps backup validation feedback user-facing", () => {
    const backup = read("src/components/settings/backup-restore-modal.tsx");

    expect(backup).toContain("Berkas tidak dapat digunakan");
    expect(backup).toContain("Periksa kembali berkas cadangan lalu coba lagi.");
    expect(backup).not.toContain("{err.path}");
    expect(backup).not.toContain("{err.message}");
  });

  it("localizes install metadata and accessibility labels", () => {
    const manifest = read("src/app/manifest.ts");
    const pagination = read("src/components/ui/pagination.tsx");

    expect(manifest).toContain("lang: 'id'");
    expect(manifest).toContain("name: 'Rak Buku'");
    expect(manifest).toContain("url: '/bookmark'");
    expect(pagination).toContain('aria-label="Paginasi"');
    expect(pagination).toContain('aria-label="Ke halaman berikutnya"');
  });

  it("avoids stale storage-limit claims in the offline download warning", () => {
    const warning = read("src/components/download/storage-warning-banner.tsx");

    expect(warning).toContain("Penyimpanan di iPhone/iPad");
    expect(warning).not.toContain("50MB");
  });

  it("keeps source selection and download failures free of internal identifiers", () => {
    const selector = read("src/components/manga/manga-source-selector.tsx");
    const download = read("src/components/manga/chapter-download-button.tsx");

    expect(selector).toContain("Digunakan untuk membaca judul ini");
    expect(selector).toContain("Terverifikasi");
    expect(selector).not.toContain("ID: {mangaId}");
    expect(selector).not.toContain("{linked.matchConfidence}");
    expect(download).toContain("Unduhan belum berhasil");
    expect(download).toContain("Coba lagi beberapa saat.");
    expect(download).not.toContain("Gagal mengunduh: ${msg}");
  });

  it("uses reader-safe fallbacks instead of raw route identifiers", () => {
    const search = read("src/components/search/search-results.tsx");
    const sourcePage = read("src/app/(web)/sources/[sourceId]/page.tsx");
    const recovery = read("src/components/manga/dead-source-recovery.tsx");
    const detailError = read("src/components/manga/manga-detail-error-state.tsx");

    expect(search).not.toContain("source?.name || err.sourceId");
    expect(sourcePage).toContain('const sourceName = sourceInfo?.name || "Sumber"');
    expect(recovery).toContain('?? "Komik ini"');
    expect(detailError).toContain('?? "sumber ini"');
  });
});
