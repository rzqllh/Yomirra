import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/chrome/header";
import { ContentLane, PageContainer, YomirraSurface } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Pusat Bantuan | Yomirra",
  description: "Panduan singkat untuk pencarian, sumber komik, Reader, unduhan dan penyimpanan data Yomirra.",
};

const topics = [
  {
    title: "Sumber komik gagal dimuat",
    answer: "Sumber bisa menolak permintaan atau sedang tidak tersedia. Hasil dari sumber lain tetap dapat digunakan. Coba lagi nanti atau pilih sumber berbeda. Pesan 403/429 berasal dari pembatasan akses sumber; Yomirra tidak menjamin setiap sumber selalu aktif.",
    link: "/sources",
    linkLabel: "Periksa daftar sumber",
  },
  {
    title: "Judul yang sama muncul di beberapa sumber",
    answer: "Satu karya dapat tersedia melalui beberapa penyedia. Jika Yomirra sudah mengenali hubungan antarsumbernya, kartu komik dapat menampilkan pilihan sumber. Jika belum, beberapa kartu mungkin masih terlihat. Jangan menganggap setiap chapter dari sumber berbeda pasti setara.",
    link: "/search",
    linkLabel: "Cari komik",
  },
  {
    title: "Progres membaca atau bookmark belum tersinkron",
    answer: "Progres dapat disimpan di perangkat lebih dahulu, sedangkan sinkronisasi akun membutuhkan koneksi dan proses yang berhasil. Jika jaringan bermasalah, jangan menghapus data situs sebelum membuat cadangan. Periksa status akun dan gunakan opsi pencadangan yang tersedia di Pengaturan.",
    link: "/settings",
    linkLabel: "Buka Pengaturan",
  },
  {
    title: "Chapter yang diunduh tidak terbuka offline",
    answer: "Tidak semua halaman selalu berhasil diunduh. Periksa apakah seluruh halaman tersedia sebelum keluar dari jaringan. Penyimpanan browser juga dapat dibersihkan oleh perangkat ketika ruang terbatas; cadangan progres terpisah dari file gambar unduhan.",
    link: "/bookmark",
    linkLabel: "Buka Library",
  },
  {
    title: "Konten dewasa dan rating belum terverifikasi",
    answer: "Pengaturan konten dewasa menyembunyikan sumber atau judul yang sudah diklasifikasikan sebagai dewasa. Klasifikasi yang belum tersedia tidak membuktikan sebuah judul aman. Periksa informasi dan peringatan pada judul sebelum membukanya.",
    link: "/settings",
    linkLabel: "Atur preferensi konten",
  },
  {
    title: "Kontrol Reader, zoom dan navigasi",
    answer: "Jika posisi baca terasa berubah, pastikan mode baca dan chapter yang dibuka sesuai dengan riwayat terakhir. Pengaturan Reader dapat bergantung pada perangkat. Gunakan navigasi kembali ke Detail atau Beranda untuk berpindah tanpa kehilangan konteks.",
    link: "/",
    linkLabel: "Kembali ke Beranda",
  },
] as const;

export default function HelpPage() {
  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <PageContainer variant="management" hasMobileHeader>
        <PageHeader
          title="Pusat Bantuan"
          subtitle="Panduan singkat saat mencari, membaca dan menyimpan komik."
          showBack
          backHref="/"
        />
        <ContentLane variant="focused" className="space-y-6 pb-24 md:pb-0">
          <section className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary md:text-2xl">Ada yang tidak berjalan semestinya?</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              Buka topik di bawah untuk mengetahui langkah yang dapat dilakukan. Informasi kesehatan sumber dapat berubah, sehingga status terakhir bukan jaminan semua chapter tersedia.
            </p>
          </section>
          <section aria-labelledby="help-topics" className="space-y-3">
            <h2 id="help-topics" className="text-base font-bold text-text-primary">Masalah yang sering ditemui</h2>
            {topics.map((topic) => (
              <details
                key={topic.title}
                className="group overflow-hidden rounded-lg border border-border-subtle bg-surface-raised"
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                  {topic.title}
                  <span aria-hidden="true" className="shrink-0 text-text-muted group-open:rotate-180">⌄</span>
                </summary>
                <div className="space-y-3 border-t border-border-subtle px-4 py-3">
                  <p className="text-sm leading-relaxed text-text-muted">{topic.answer}</p>
                  <Link
                    href={topic.link}
                    className="inline-flex min-h-11 items-center rounded-md font-semibold text-sm text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {topic.linkLabel}
                  </Link>
                </div>
              </details>
            ))}
          </section>
          <p className="text-xs leading-relaxed text-text-muted">
            Jika masalah berulang, catat judul, sumber, chapter, waktu kejadian dan perangkat. Jangan bagikan kata sandi, token atau tautan login pribadi.
          </p>
        </ContentLane>
      </PageContainer>
    </YomirraSurface>
  );
}
