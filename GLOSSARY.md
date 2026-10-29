# Yomirra — Glossary

Bahasa domain Yomirra untuk membedakan karya, sumber konten, katalog penjelajahan, dan data pribadi pengguna.

## Karya dan sumber

**Karya (Work)**:
Satu komik sebagai identitas konseptual yang dapat memiliki entri pada beberapa sumber. Hasil pengelompokan penelusuran tidak otomatis menjadi identitas permanen karya.
_Avoid_: Entri sumber, baris katalog

**Sumber (Source)**:
Penyedia katalog dan chapter yang dapat diakses melalui Yomirra. Keikutsertaan dalam penjelajahan adalah pilihan pengguna dan berbeda dari ketersediaan operasional sumber.
_Avoid_: "Aktif" untuk sekaligus berarti terpilih dan sehat

**Referensi Sumber (SourceRef)**:
Hubungan antara satu karya yang dikenal pengguna dan entri komik pada sumber tertentu. Referensi dapat berubah atau bertambah tanpa mengganti identitas judul yang disimpan pengguna.
_Avoid_: Identitas karya permanen

## Penjelajahan dan koleksi pribadi

**Library**:
Katalog penjelajahan gabungan yang dibentuk dari sumber pilihan pengguna; bukan koleksi judul pribadi yang disimpan.
_Avoid_: Rak Buku, bookmark

**Cari**:
Penelusuran lintas sumber yang memenuhi syarat, termasuk sumber yang tidak dipilih untuk tampil dalam Library.
_Avoid_: Pencarian Library

**Rak Buku**:
Ruang pribadi pengguna untuk judul tersimpan dan keadaan membacanya, terpisah dari katalog penjelajahan.
_Avoid_: Library, katalog umum

## Identitas dan keadaan membaca

**Identitas Judul Tersimpan (SavedTitleId)**:
Identitas stabil milik satu judul yang disimpan pengguna, tidak bergantung pada sumber baca yang sedang dipilih.
_Avoid_: Source ID, manga ID, kunci klaster pencarian

**Progress Baca**:
Posisi baca pengguna pada chapter yang memiliki asal sumber yang diketahui. Pergantian sumber tidak membenarkan pembuatan progress yang tidak dapat dipetakan secara andal.
_Avoid_: Status baca, riwayat penelusuran

**Chapter Selesai Dibaca**:
Keadaan sebuah chapter yang telah dituntaskan melalui tindakan melanjutkan melewati akhir chapter atau penandaan selesai oleh pengguna. Menampilkan halaman terakhir saja belum berarti chapter selesai.
_Avoid_: Halaman terakhir terlihat, sekadar membuka chapter

**Posisi Baca per Chapter**:
Halaman dan posisi terakhir yang sedang dibaca dalam satu chapter tertentu, termasuk posisi baca ulang pada chapter yang secara historis sudah selesai. Mengubah posisi tersebut tidak menurunkan pencapaian tertinggi judul.
_Avoid_: Posisi baca seluruh karya, chapter terbaru

**Pencapaian Membaca Tertinggi**:
Titik kemajuan tertinggi suatu karya yang tetap tercatat sekalipun pengguna membuka atau membaca ulang chapter lebih awal. Aturan detail lintas sumber dan chapter ambigu masih menunggu keputusan lanjutan.
_Avoid_: Chapter paling baru dikunjungi, riwayat aktivitas terakhir


**Riwayat Aktivitas Baca**:
Urutan kunjungan atau sesi membaca pengguna berdasarkan waktu, terpisah dari pencapaian tertinggi judul dan cursor per chapter.
_Avoid_: Lanjut Baca, progress tertinggi


**Preferensi Konten Reader**:
Pilihan membaca yang berhubungan dengan suatu karya, seperti mode baca, arah baca, dan presentasi halaman. Pilihan per judul boleh digunakan kembali pada perangkat lain milik pengguna yang sama.
_Avoid_: Preferensi perangkat, posisi baca

**Preferensi Perangkat Reader**:
Pilihan yang mencerminkan kemampuan dan batas perangkat atau jaringan, seperti tingkat preload dan penghematan data. Ini tidak otomatis dipindahkan ke perangkat lain.
_Avoid_: Preferensi judul, progress baca

## Unduhan

**Unduhan Lengkap**:
Salinan chapter pada perangkat yang seluruh halaman yang diperlukan masih tersedia dan dapat dibaca tanpa jaringan. Status antrean atau catatan unduhan sebelumnya bukan bukti bahwa salinan masih lengkap.
_Avoid_: Pernah diunduh, masuk antrean

## Status sumber

**Sumber Terpilih**:
Sumber yang dipilih pengguna untuk menyumbang konten pada penjelajahan rutinnya, terlepas dari kondisi teknis sumber itu.
_Avoid_: Sumber online, sumber sehat

**Kondisi Sumber**:
Keadaan operasional sumber berdasarkan hasil pemeriksaan yang relevan, terpisah dari apakah pengguna memilih sumber tersebut.
_Avoid_: Status dipilih, toggle Library

## Pemulihan sumber

**Fallback Sementara**:
Penggunaan sumber alternatif untuk melanjutkan membaca tanpa mengubah pilihan sumber permanen pengguna atau identitas karya yang disimpan.
_Avoid_: Migrasi sumber, mengganti sumber utama

**Migrasi Sumber**:
Perubahan hubungan sumber baca utama suatu karya yang disimpan pengguna setelah kecocokan karya dan, bila diperlukan, chapter dinilai cukup pasti.
_Avoid_: Fallback sementara, pencarian sumber alternatif

**Katalog Penjelajahan (Discovery Catalog)**:
Kumpulan judul yang dapat dijelajahi pengguna berdasarkan sumber yang dipilih serta aturan kelayakan katalog. Library adalah nama tampilan produk untuk katalog ini.
_Avoid_: Koleksi pribadi, Saved Titles

**Judul Tersimpan (Saved Title)**:
Judul yang menjadi bagian dari ruang pribadi pengguna dan memiliki identitas stabil terpisah dari entri fisik satu sumber.
_Avoid_: Baris katalog, source entry

**Ruang Data Pribadi**:
Kumpulan judul tersimpan, riwayat, koleksi, dan preferensi yang terkait dengan satu pemilik data, termasuk pemilik lokal tanpa akun.
_Avoid_: Cache katalog, data bersama antar-akun
