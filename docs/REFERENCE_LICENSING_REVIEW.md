# Yomirra — Tinjauan Lisensi dan Batasan Hak Mandiri

**Status Dokumen:** Kebijakan lisensi produk independen dan tata kelola kode bersih (clean-room). Dokumen ini menguraikan batasan lisensi kode, independensi arsitektur, dan kepatuhan hak konten tanpa ketergantungan pada produk lain.

---

## 1. Arsitektur Bersih & Lisensi Mandiri (Clean-room Implementation)

Yomirra dikembangkan secara independen sebagai aplikasi web/PWA pembaca komik modern dengan prinsip **Clean-room implementation**:
- **Lisensi Proyek**: Kode sumber Yomirra didistribusikan di bawah lisensi terbuka [Apache-2.0](../LICENSE).
- **Independensi Kode**: Seluruh implementasi komponen UI, state store, pembaca (reader engine), dan service worker ditulis secara mandiri mengikuti standar web terbuka (Next.js, React 19, TypeScript, Serwist), tanpa mengadopsi atau menyalin basis kode aplikasi native eksternal.
- **Netralitas Antarmuka**: Yomirra tidak berafiliasi dengan, tidak didukung oleh, dan tidak bertindak sebagai port resmi dari aplikasi pembaca pihak ketiga mana pun.

---

## 2. Pemisahan Hak Kode dan Hak Konten

Lisensi terbuka **Apache-2.0** pada repositori ini secara ketat **hanya mencakup kode sumber aplikasi**, dan tidak memberikan hak cipta atau lisensi atas materi pihak ketiga:
1. **Bukan Penyedia atau Pemilik Konten**: Yomirra tidak menghosting, menerbitkan, atau mendistribusikan chapter komik, pindaian, gambar sampul, terjemahan, atau logo pihak ketiga.
2. **Kepatuhan Sumber**: Interaksi dengan sumber katalog dilakukan melalui adaptor publik atau dynamic manifest yang terisolasi. Ketersediaan konten sepenuhnya tunduk pada ketentuan layanan dan hak cipta pemilik konten asli.
3. **Kanal Pelaporan**: Yomirra menyediakan saluran pelaporan hak konten di [CONTENT_RIGHTS_REPORTING.md](CONTENT_RIGHTS_REPORTING.md) bagi pemegang hak cipta yang ingin meminta peninjauan atau pemblokiran domain sumber.

---

## 3. Privasi Data & Penyimpanan Lokal

1. **Prioritas Penyimpanan Lokal**: Pengaturan membaca, riwayat chapter, dan koleksi komik tersimpan secara lokal di peramban pengguna (LocalStorage & Cache Storage).
2. **Sinkronisasi Opsional**: Sinkronisasi cloud hanya aktif jika pengguna secara eksplisit menghubungkan akun autentikasi mereka. Data cadangan JSON yang diekspor pengguna tidak menyertakan kredensial rahasia atau informasi pelacak invasif.
3. **Kepatuhan Privasi**: Yomirra dirancang tanpa pelacak iklan komersial atau pengumpulan data telemetri yang tidak transparan.

---

## 4. Standar Dokumentasi Publik

| Dokumen | Ruang Lingkup | Ketentuan Pembuktian |
|---|---|---|
| `README.md` | Gambaran umum Yomirra, kapabilitas web/PWA, quickstart, dan referensi lisensi | Klaim selaras dengan perilaku nyata yang teruji |
| `LICENSE` | Berkas lisensi resmi Apache-2.0 | Mempertahankan integritas teks lisensi resmi tanpa modifikasi |
| `docs/FEATURE_PARITY.md` | Matriks kapabilitas fitur web/PWA, batasan teknis platform, dan status nyata | Verifikasi fungsional nyata melalui pengujian unit dan kontrak |
| `docs/ADDING_A_SOURCE.md` | Panduan penambahan adapter sumber data terisolasi | Kepatuhan kebijakan keamanan outbound dan batasan SSRF |
| `docs/READING_DATA.md` | Kontrak skema data bacaan, cadangan JSON, dan sinkronisasi | Validasi skema Zod dan migrasi data mundur kompatibel |

---

## 5. Ringkasan Kepatuhan

Seluruh kontribusi kode di repositori ini wajib memenuhi standar integritas kode mandiri: tidak menyalin kode berlisensi non-kompatibel (misalnya GPL yang viral), menjaga atribusi dependensi pihak ketiga di `package.json`, dan memastikan Yomirra tetap menjadi platform web-first mandiri yang bersih dan terpercaya.
