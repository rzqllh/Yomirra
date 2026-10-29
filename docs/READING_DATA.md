# Riwayat, sinkronisasi, dan cadangan

Yomirra menyimpan posisi baca di perangkat. Akun yang terhubung dapat menyinkronkan data itu ke cloud. Penyimpanan perangkat dan keberhasilan sinkronisasi adalah dua kondisi berbeda.

## Apa yang disimpan

Riwayat menyimpan paling banyak 512 entri chapter dengan detail lengkap. Di luar batas itu, tiap judul mempertahankan ringkasan posisi baca terakhir dan chapter tertinggi yang pernah dicapai. Jika keduanya menunjuk chapter yang sama, cukup satu catatan ringkas. Jumlah total catatan dapat melebihi 512 karena ringkasan tidak ikut dibuang.

Ringkasan menyimpan identitas judul dan sumber, chapter, posisi halaman, waktu baca, serta informasi yang dibutuhkan untuk menentukan milestone. Membaca ulang chapter lama tidak seharusnya menghapus milestone yang lebih tinggi. Data chapter lain di luar jendela detail dapat diringkas; ini bukan arsip lengkap seluruh chapter yang pernah dibaca.

Progres ringkas tidak kedaluwarsa berdasarkan umur. Aturan penghapusan setelah tiga bulan belum diaktifkan karena definisi ketidakaktifan akun atau judul belum diputuskan. Tindakan penghapusan oleh pengguna tetap berlaku.

## Saat jaringan bermasalah

Perubahan progres diterapkan ke state dan penyimpanan lokal lebih dulu. Penulisan posisi scroll ke cloud digabungkan dengan jeda 1,5 detik, dengan penundaan maksimum 5 detik saat membaca terus-menerus. Saat halaman ditinggalkan, aplikasi mencoba mengirim posisi tertunda. Browser tetap dapat menghentikan permintaan jaringan ketika aplikasi ditutup.

Kegagalan cloud tidak mengembalikan seluruh riwayat ke snapshot lama. Data lokal tetap tersedia untuk sinkronisasi berikutnya, termasuk ketika koneksi kembali. Penulisan riwayat terikat ke akun asal; operasi lama tidak boleh berpindah ke akun lain setelah pengguna berganti akun. Penghapusan yang gagal hanya memulihkan entri terkait, tanpa menimpa progres baru.

Penyimpanan browser tetap bergantung pada ruang tersedia dan kebijakan perangkat. Menghapus data situs, memakai mode privat, atau kehilangan perangkat dapat menghilangkan data yang belum dicadangkan atau disinkronkan.

## Rekonsiliasi cloud

Sinkronisasi penuh menggabungkan data lokal dan cloud sebelum menerapkan batas detail. Ringkasan tetap berupa catatan history yang dapat dibaca aplikasi. Chapter lama yang sudah tidak dibutuhkan untuk posisi terakhir atau milestone diganti dengan marker `_compacted`, bukan penanda penghapusan pengguna. Marker tidak ditampilkan sebagai riwayat dan mencegah detail lama muncul lagi dari snapshot yang lebih tua.

Batas 512 berlaku setelah rekonsiliasi, bukan sebagai kuota database yang langsung berlaku pada setiap penulisan dari semua perangkat. Marker lama tidak dihapus otomatis. Klien versi lama belum memahami marker ini; muat ulang aplikasi pada semua perangkat sebelum mengandalkan perilaku retensi baru.

## Ekspor dan pemulihan

Cadangan JSON menyertakan library, hubungan sumber, posisi baca, milestone, koleksi, status baca, dan preferensi yang masuk daftar ekspor. Konten NSFW tetap dikecualikan sesuai kebijakan penyimpanan yang sudah berlaku. Gambar unduhan dan kredensial tidak disertakan.

Format ekspor tetap schema 3 dengan field progres tambahan yang opsional. Impor menerima schema 1, 2, dan 3. Tidak ada batas 1.000 judul untuk library; batas ukuran berkas tetap 10 MB dan berlaku juga saat ekspor. Batas domain lain, seperti jumlah koleksi, tetap mengikuti schema. Aplikasi memakai versi package saat mencatat versi ekspor.

Mode gabung membandingkan data berdasarkan identitas judul tetap dan timestamp. Memulihkan cadangan yang sama berulang kali tidak boleh menambah salinan judul. Mode ganti memulihkan library dengan kunci identitas yang sama sehingga referensi koleksi tetap terhubung. Riwayat hasil impor mengikuti kebijakan 512 detail dan ringkasan progres.

Pemulihan cadangan mengubah data lokal. Itu bukan bukti bahwa perubahan sudah tersimpan ke cloud. Verifikasi hasil pemulihan sebelum menjalankan sinkronisasi; mode ganti lokal tidak menghapus seluruh isi akun cloud.

## Unduhan offline

Engine memeriksa keberadaan respons gambar di Cache Storage ketika melanjutkan unduhan. Halaman dengan metadata `cached` tetapi gambar hilang harus diunduh ulang. Chapter baru ditandai selesai setelah seluruh halaman memiliki respons gambar yang valid di cache. Browser masih dapat membuang cache setelah pemeriksaan; cadangan JSON tidak memulihkan gambar tersebut.

## Batas verifikasi

Tes otomatis mencakup retensi, identitas backup, pemulihan berulang, kegagalan cloud, dan cache yang hilang. Uji Firebase dua perangkat nyata serta iPhone/iPad dengan PWA terpasang tetap merupakan pemeriksaan terpisah. Lihat [Testing](TESTING.md) dan [tracker parity](YOMIRRA_FULL_PARITY_EXECUTION.md).
