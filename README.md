# Yomirra

**Baca manga, manhwa, dan manhua dari berbagai sumber dalam satu tempat.**

Yomirra adalah reader multi-source yang dirancang supaya pengalaman membaca tetap sederhana meskipun sumber kontennya berbeda-beda.

Cari sekali, pilih sumber yang tersedia, simpan ke library, lalu lanjut baca tanpa harus mengelola banyak situs secara terpisah.

> Yomirra masih aktif dikembangkan. Beberapa sumber dapat berubah, berpindah domain, atau mengalami gangguan sewaktu-waktu.

## Buka Yomirra

https://yomirra.vercel.app

---

## Kenapa Yomirra?

Website manga sering berubah domain, mengubah struktur halaman, atau mengalami gangguan.

Yomirra mencoba memisahkan masalah tersebut dari pengalaman membaca kamu.

Library, riwayat baca, dan progress dibuat agar tidak bergantung penuh pada satu website sumber.

Kalau sebuah judul tersedia di beberapa sumber, Yomirra dapat mengenalinya sebagai judul yang sama dan menyimpan hubungan antar sumber tersebut.

---

## Multi-Source Search

Cari judul dari beberapa sumber sekaligus.

Yomirra akan:

- mencari hanya pada sumber yang kamu pilih
- menjalankan pencarian secara paralel
- menggabungkan hasil yang terdeteksi sebagai judul yang sama
- tetap menampilkan hasil dari sumber sehat meskipun salah satu sumber gagal

Contohnya, satu judul dapat tersedia melalui:

`Shinigami · Komiku II · MangaDex`

tanpa harus memenuhi halaman pencarian dengan beberapa kartu duplikat.

---

## Sources

Yomirra saat ini mendukung:

**Indonesia**
- Shinigami
- Komikindo
- Komiku
- Komiku II
- KomikNesia
- MangaDex Indonesia

**English**
- Asura Scans
- MangaDex English

Ketersediaan setiap sumber dapat berubah mengikuti kondisi layanan aslinya.

---

## Library

Simpan judul yang kamu baca ke dalam satu library.

Satu judul dapat memiliki beberapa sumber yang terhubung sehingga library tidak harus terkunci pada satu website saja.

Yomirra mempertahankan identitas judul secara terpisah dari domain sumbernya.

Artinya, perubahan domain tidak seharusnya membuat judul di library menjadi judul baru.

---

## Progress yang Tetap Aman

Progress membaca adalah data pengguna, bukan milik source.

Saat sumber yang sedang digunakan bermasalah, Yomirra dapat mencari sumber alternatif untuk judul yang sama.

Jika mapping chapter dapat dipastikan, Yomirra dapat membantu melanjutkan dari chapter yang sesuai.

Jika hasilnya ambigu, Yomirra akan meminta konfirmasi daripada menebak.

Yomirra tidak akan sengaja memajukan progress ke chapter yang belum kamu baca.

---

## Source Recovery

Source bisa berubah.

Domain bisa pindah.

API bisa berubah.

Struktur website bisa rusak.

Yomirra memiliki sistem health dan recovery untuk membedakan beberapa kondisi tersebut sehingga satu source yang bermasalah tidak harus membuat seluruh reader ikut gagal.

Untuk source yang punya alternatif valid, Yomirra dapat menawarkan atau menggunakan sumber pengganti dengan tetap menjaga library dan progress.

---

## Reader

Reader Yomirra dibuat untuk pengalaman baca yang bersih dan minim distraksi.

Tersedia pengalaman continuous reading untuk chapter berbasis gambar, dengan state baca yang tetap terhubung ke library dan history.

Konten yang memang terkunci atau premium pada sumber aslinya tetap dihormati sebagai konten terkunci.

---

## Search dan Library Itu Berbeda

**Search** digunakan untuk mencari judul dari berbagai sumber.

**Library Search** hanya mencari koleksi yang sudah kamu simpan.

Yomirra sengaja memisahkan keduanya supaya pencarian library tetap cepat dan tidak melakukan request internet yang tidak diperlukan.

---

## Jika Source Bermasalah

Gangguan pada satu source tidak otomatis berarti Yomirra sedang down.

Sebuah source dapat mengalami:

- perubahan domain
- perubahan route
- perubahan struktur halaman
- API error
- rate limit
- CDN bermasalah
- maintenance atau downtime

Yomirra mencoba mengisolasi kegagalan tersebut supaya source lain tetap bisa digunakan.

---

## Privacy

Yomirra tidak membutuhkan data bacaan pribadi untuk melakukan monitoring kesehatan source.

Monitoring operasional berfokus pada kondisi teknis seperti:

- status source
- latency
- parser/API failure
- domain change
- recovery status

Riwayat bacaan, judul yang sedang dibaca, dan query pencarian pengguna tidak digunakan sebagai telemetry operasional.

---

## Status

Yomirra masih berkembang.

Fokus pengembangan saat ini adalah membuat pengalaman multi-source semakin tahan terhadap perubahan source tanpa mengorbankan library dan progress pengguna.

Beberapa fitur dan source dapat berubah seiring pengembangan.

---

## Disclaimer

Yomirra adalah reader dan aggregator interface independen.

Konten, artwork, manga, manhwa, manhua, serta layanan sumber terkait merupakan milik masing-masing pemegang hak dan penyedianya.

Yomirra tidak mengklaim kepemilikan atas konten yang berasal dari layanan pihak ketiga.