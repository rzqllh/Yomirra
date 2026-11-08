# Bantuan dan pemecahan masalah

[Dokumentasi](README.md) · [Panduan pembaca](USER_GUIDE.md) · [Data dan cadangan](READING_DATA.md)

Mulai dari langkah yang mempertahankan data: periksa koneksi, catat pesan, lalu coba setelah jeda. Ekspor cadangan sebelum menghapus data situs, memulihkan dengan mode ganti, atau mereset perangkat.

## Sumber atau pencarian tidak tersedia

Periksa **Sumber**. Toggle penjelajahan tidak membuat sumber maintenance menjadi sehat. Search global memakai sumber yang tersedia terlepas dari toggle Beranda/Library/Populer.

Jika satu sumber gagal tetapi yang lain bekerja, coba sumber lain atau judul alternatif. Jika hasil kosong, kurangi filter dan periksa bahasa/ejaan. Tidak semua sumber mendukung filter atau menyediakan judul yang sama. Saat akses dibatasi, tunggu; hindari request cepat berulang atau upaya melewati pembatasan sumber.

Jika judul tersimpan kehilangan sumber, gunakan [pemulihan sumber](USER_GUIDE.md#saat-sumber-berhenti-bekerja). Periksa identitas dan chapter kandidat sebelum menghubungkannya.

## Gambar Reader kosong atau chapter salah

Periksa chapter lain pada sumber yang sama. Jika hanya satu chapter gagal, masalah dapat berasal dari gambar atau data chapter sumber. Jika seluruh sumber gagal, periksa statusnya. Muat ulang sekali saat online; hindari reset data sebagai langkah pertama.

Setelah pindah sumber, periksa bahasa, edisi, dan penomoran chapter. Posisi dan milestone tidak selalu dapat dipetakan lintas sumber; pilih chapter secara manual bila perlu. Sertakan judul/chapter, sumber, serta pesan yang tampil dalam laporan.

## Unduhan tidak muncul atau gagal dibuka offline

- **Yang terunduh ZIP:** aplikasi dibuka pada tab browser biasa. Buka ikon PWA standalone untuk memakai antrean aplikasi.
- **Masih antre/jeda/gagal:** sambungkan jaringan dan lanjutkan atau periksa unduhan; belum semua gambar tersimpan.
- **Halaman Unduhan tidak terbuka offline:** buka halaman itu sekali saat online, lalu coba lagi.
- **Meminta verifikasi konten:** buka chapter melalui Reader saat online. Pembacaan lokal memerlukan klasifikasi aman terverifikasi dan sumber non-NSFW.
- **Dulu selesai, sekarang gambar hilang:** browser mungkin membuang cache. Hubungkan jaringan dan unduh ulang; JSON cadangan tidak berisi gambar.

Periksa ruang kosong perangkat. PWA, Service Worker, dan penyimpanan bergantung pada browser. [Panduan offline](USER_GUIDE.md#unduhan-pemasangan-pwa-dan-offline) menjelaskan uji sebelum bepergian.

## Sinkronisasi gagal atau data berbeda

1. Ekspor cadangan di perangkat yang masih memiliki data benar.
2. Periksa koneksi dan akun Google pada kedua perangkat. Muat ulang aplikasi agar keduanya memakai versi terbaru.
3. Buka **Akun & Sinkronisasi**, periksa domain/status gagal, lalu pilih **Sinkronkan sekarang** setelah koneksi pulih.
4. Periksa beberapa judul, progres, dan koleksi. Jika masih berbeda, catat domain yang terdampak dan waktu kejadian tanpa membagikan identitas akun.

Jangan menghapus data perangkat untuk memaksa sinkronisasi. Progres lokal tetap disimpan saat cloud gagal, tetapi menutup aplikasi dapat menghentikan request tertunda. Status baca dan gambar unduhan tidak ikut cloud sync. Pemulihan lokal atau penghapusan bookmark lokal tidak berarti seluruh data cloud diganti/dihapus.

## Cadangan ditolak

Gunakan JSON hasil ekspor Yomirra, bukan ZIP chapter atau cadangan aplikasi lain. Batas berkas 10 MB dan schema yang diterima 1–3. Jika pratinjau menolak berkas, pertahankan berkas asli dan jangan mengeditnya secara acak. Coba ekspor baru bila perangkat asal tersedia; laporkan pesan validasi tanpa melampirkan cadangan pribadi.

## FAQ

**Perlu akun?** Tidak untuk membaca dan menyimpan data lokal. Akun diperlukan untuk sinkronisasi cloud yang didukung.

**Semua chapter bisa offline?** Tidak. Unduhan harus selesai, gambar masih tersimpan, dan pembacaan lokal harus memenuhi klasifikasi konten. Membuka chapter online bukan mengunduhnya.

**Cadangan mencakup seluruh riwayat detail?** Riwayat menyimpan 512 detail chapter terbaru dan ringkasan posisi terakhir/milestone per judul. Ini bukan arsip lengkap setiap chapter yang pernah dibaca.

**AI wajib?** Tidak. Pencarian leksikal dan rekomendasi utama berjalan tanpa AI. Semantic ranking opsional pada deployment yang mengonfigurasinya.

**Fitur sama persis dengan reader lain?** Panduan ini mencakup web/PWA Yomirra. Referensi Mihon dan Tachimanga tidak menjanjikan extension, format cadangan, fitur native, atau kesetaraan fitur.

## Melaporkan bug

Cari laporan yang sudah ada di [GitHub Issues](https://github.com/rzqllh/Yomirra/issues). Untuk bug baru, buka issue umum dan sertakan:

- langkah bernomor dari halaman awal hingga masalah;
- hasil yang diharapkan, hasil aktual, dan pesan yang terlihat;
- sumber, judul, chapter, dan URL halaman jika aman dibagikan;
- perangkat, versi OS/browser, dan tab browser atau PWA standalone;
- waktu beserta zona waktu, kondisi online/offline, dan versi aplikasi bila tersedia di Pengaturan;
- screenshot yang disunting atau cuplikan log minimal bila membantu.

Issue GitHub publik. Hapus email, foto profil, token, cookie, header authorization, nilai environment, signed URL/query sensitif, dan data bacaan pribadi. Jangan lampirkan `.env`, backup pribadi, seluruh console dump, HAR, atau rekaman jaringan tanpa meninjau isinya. Jika diagnosis membutuhkan data rahasia, tunggu jalur privat yang disediakan pengelola.

**Kerentanan keamanan** mengikuti [Security Policy](../SECURITY.md), bukan issue publik. **Hak konten** mengikuti [formulir dan panduan hak konten](CONTENT_RIGHTS_REPORTING.md). Kanal laporan tidak menetapkan jaminan waktu respons.
