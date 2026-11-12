# Panduan pembaca

[Dokumentasi](README.md) · [Bantuan](TROUBLESHOOTING.md) · [Data dan cadangan](READING_DATA.md)

Panduan ini mengikuti fitur di repository. Tampilan dan ketersediaan sumber dapat berubah sesuai versi deployment dan kondisi layanan pihak ketiga.

## Cari dan simpan bacaan pertama

1. Buka [Yomirra](https://www.yomirra.web.id/) dan cari judul dari Beranda atau Search. Coba judul alternatif bila hasil belum sesuai. Tag diawali `#` membantu memilih genre, format, atau status yang didukung.
2. Periksa judul, cover, bahasa, dan sumber. Judul mirip belum tentu karya atau edisi yang sama; hasil lintas sumber tidak selalu dapat digabungkan.
3. Buka detail komik dan pilih chapter yang tersedia. Chapter terkunci atau belum tersedia tetap mengikuti pembatasan sumber.
4. Gunakan tombol bookmark untuk menyimpan judul ke **Rak Buku**. Rating atau koleksi tidak otomatis membuat bookmark.

**Library** menampilkan katalog sumber, sedangkan **Rak Buku** menampung bacaan pribadi. Koleksi buatan sendiri membantu mengelompokkan judul; Smart Collections seperti Lanjut Dibaca dihitung dari data Library pribadi dan riwayat, tanpa membuat salinan judul baru.

## Pilih sumber dan bahasa

Buka **Sumber** untuk melihat layanan dan preferensi penjelajahan. Toggle penjelajahan mengubah Beranda, Library, dan Populer. Search global tetap mencari di sumber yang tersedia, termasuk sumber yang toggle penjelajahannya dimatikan.

**Under Maintenance** menandakan sumber sedang dijeda dari katalog dan pencarian default setelah kegagalan. Memilih sumber tidak memperbaiki layanan yang gagal. Tautan judul tersimpan masih dapat dibuka jika layanan sumber mengizinkan.

Di **Pengaturan → Bahasa utama**, pilih prioritas bahasa chapter. Ini hanya memengaruhi sumber yang mendukung preferensi bahasa; pilihan tersebut tidak menerjemahkan halaman komik.

## Atur Reader dan lanjutkan progres

Buka kontrol Reader dan **Pengaturan pembaca**. Pilih cakupan **Khusus judul ini** atau **Semua komik** sebelum menyesuaikan latar belakang, ukuran gambar, jarak antar halaman, arah baca, kontrol pembaca, dan muat awal gambar. Mode vertikal mengikuti scroll; arah LTR/RTL memakai navigasi halaman.

Posisi halaman disimpan secara lokal. Kembali ke Beranda dan periksa **Lanjut Baca**, atau buka bacaan dari Rak Buku. Posisi terakhir dan milestone chapter tertinggi adalah catatan berbeda: membaca ulang chapter lama tidak seharusnya menghapus milestone lebih tinggi. Membuka chapter saja bukan bukti seluruh chapter sudah dibaca.

Pilih tema **Terang**, **Gelap**, atau **Sistem** di Pengaturan. Animasi yang mendukungnya mengikuti preferensi pengurangan gerakan sistem. Zoom mengikuti browser/perangkat. Bila kontrol, fokus keyboard, atau pembaca layar bermasalah, [laporkan konteks dan langkahnya](TROUBLESHOOTING.md#melaporkan-bug); panduan ini bukan klaim sertifikasi aksesibilitas.

## Saat sumber berhenti bekerja

1. Periksa status di **Sumber** dan coba lagi setelah jeda. Hindari request berulang saat sumber membatasi akses.
2. Pada layar pemulihan judul, pilih **Cari Sumber Alternatif** bila tersedia.
3. Bandingkan judul, penulis, bahasa/edisi, dan chapter kandidat. Pilih **Gunakan Sumber Ini** setelah cocok.
4. Periksa chapter dan progres setelah pindah sumber. Jika penomoran berbeda, pilih chapter secara manual; pemetaan otomatis tidak dijamin.

Relink menghubungkan sumber baru ke identitas judul tersimpan. Unduhan lama tetap terikat pada chapter asal dan tidak otomatis menjadi unduhan sumber baru. Jika alternatif belum tersedia, pertahankan cadangan data dan tunggu perbaikan atau laporkan masalah sumber.

## Unduhan, pemasangan PWA, dan offline

| Cara membuka aplikasi | Hasil tombol unduh chapter |
| --- | --- |
| Tab browser biasa | Berkas ZIP diunduh ke perangkat; bukan entri offline di halaman Unduhan aplikasi |
| PWA terpasang yang dibuka dalam mode standalone | Chapter masuk antrean aplikasi dan menyimpan gambar ke penyimpanan browser |

Untuk mencoba pembacaan offline di aplikasi:

1. Gunakan menu pemasangan aplikasi browser jika tersedia. Pada Safari iOS, gunakan menu berbagi lalu opsi penambahan ke Layar Utama. Nama menu mengikuti bahasa dan versi browser.
2. Buka Yomirra dari ikon aplikasi terpasang, lalu unduh chapter saat online.
3. Buka **Unduhan** saat online agar shell halaman tersedia. Tunggu hingga chapter selesai; antrean yang baru dimulai belum berarti semua gambar tersimpan.
4. Matikan jaringan, kembali ke **Unduhan**, lalu buka chapter selesai. Pembacaan lokal tersedia untuk unduhan dengan klasifikasi aman terverifikasi pada sumber non-NSFW.
5. Jika unduhan lama meminta verifikasi konten, buka chapter melalui Reader saat online, kemudian periksa lagi. Jika gambar hilang, sambungkan jaringan dan periksa atau unduh ulang.

Pemasangan PWA tidak menyimpan seluruh katalog atau semua halaman yang pernah dibaca. Tidak semua chapter dapat dibuka offline. Browser dapat membuang cache saat ruang menipis atau data situs dihapus; mode privat tidak cocok untuk penyimpanan jangka panjang. Cadangan JSON dan cloud sync tidak menyertakan gambar. Uji satu chapter pada perangkat yang akan dipakai sebelum mengandalkan offline saat bepergian.

## Akun dan sinkronisasi

Membaca dan menyimpan data lokal dapat dilakukan tanpa akun. Buka **Pengaturan → Kelola akun & sinkronisasi** atau **Buka akun**, lalu **Masuk dengan Google** untuk sinkronisasi opsional. Tinjau pilihan penggabungan bila ditampilkan; simpan cadangan sebelum mengganti data.

Di **Akun & Sinkronisasi**, periksa status dan pilih **Sinkronkan sekarang** bila perlu. Pastikan aplikasi melaporkan selesai, lalu periksa beberapa judul pada perangkat lain dengan akun sama. Login saja tidak membuktikan seluruh data tersinkron.

Domain yang didukung mencakup Library/bookmark, riwayat/progres, preferensi sumber, dan koleksi. Status baca masih lokal; gambar unduhan tidak ikut sinkron. Jika gagal, pertahankan data perangkat dan ikuti [bantuan sinkronisasi](TROUBLESHOOTING.md#sinkronisasi-gagal-atau-data-berbeda).

## Cadangkan dan pulihkan data

1. Buka **Pengaturan → Ekspor / pulihkan cadangan data → Ekspor cadangan**. Simpan JSON di tempat pribadi yang aman.
2. Untuk memulihkan, pilih **Pulihkan dari cadangan**, lalu pilih cadangan Yomirra.
3. Periksa pratinjau validasi dan konflik. **Gabungkan** menggabungkan data; **Ganti data saat ini** menimpa data lokal yang dipulihkan. Ekspor data perangkat lebih dulu sebelum mode ganti.
4. Pilih **Pulihkan data**, lalu periksa Rak Buku, koleksi, dan beberapa posisi baca. Sinkronisasi cloud adalah langkah terpisah; pemulihan lokal tidak menghapus seluruh akun cloud.

Batas berkas 10 MB; schema cadangan Yomirra 1–3 diterima. Berkas cadangan dirancang spesifik untuk format data internal Yomirra dan tidak menjamin kompatibilitas dengan aplikasi pihak ketiga. Gambar unduhan dan kredensial tidak disertakan; konten NSFW dikecualikan sesuai kebijakan ekspor. Cadangan mengandung informasi bacaan pribadi: jangan unggah ke issue publik. [Kontrak data bacaan](READING_DATA.md) menjelaskan retensi dan konflik.

## Membersihkan perangkat

Pengaturan memisahkan **Bersihkan cache gambar sementara**, **Hapus semua bab offline**, **Hapus riwayat & bookmark lokal**, dan **Bersihkan untuk perangkat bersama**. Baca dialog konfirmasi karena dampaknya berbeda. Penghapusan lokal bukan penghapusan cloud; data cloud dapat muncul lagi setelah sinkronisasi.

Untuk perangkat bersama, ekspor cadangan bila diperlukan lalu gunakan pembersihan perangkat bersama. Opsi itu keluar dari akun dan mencoba menghapus data baca lokal, unduhan, serta cache. Jika aplikasi melaporkan gagal, ulangi dan periksa hasil sebelum menyerahkan perangkat.
