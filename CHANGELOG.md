# Changelog

Perubahan penting Yomirra dicatat di sini. Changelog hanya memuat fitur dan perubahan yang sudah masuk ke repository; eksperimen internal dan rencana masa depan tidak diperlakukan sebagai fitur rilis.

## [Unreleased]

Belum ada perubahan yang dijadwalkan untuk rilis berikutnya.

## [2.2.0] — 2026-09-29

Rilis ini berfokus pada search lintas source, rekomendasi yang lebih berguna, Rak Buku, dan perapihan runtime.

### Search dan source

- Search sekarang memahami `#tag`, alias Indonesia/English, typo ringan, dan lexical/fuzzy matching.
- Filter canonical dipetakan ke nilai yang didukung masing-masing source, lalu tetap diperlakukan sebagai hard filter.
- Hasil dari source berbeda dapat digabung ke satu identitas canonical ketika match cukup kuat.
- Search global tetap independen dari toggle source di Library/Populer; source yang unavailable tetap dikeluarkan.
- Optional semantic ranking tersedia melalui Gemini embedding. Tanpa API key, search biasa tetap berfungsi.
- Catalog search di Redis hanya diisi dari metadata source yang dipercaya dan tidak menerima data private user.
- Post-merge hardening memperbaiki negative genre token, unresolved hashtag, current-title exclusion, dan batas endpoint embedding.

### Rekomendasi dan Rak Buku

- Rekomendasi utama sekarang deterministic dan tidak membutuhkan Gemini/GPT.
- Ranking mempertimbangkan source, format, rating, status, dan reading history yang sudah ada.
- Judul yang sedang dibuka, sudah disimpan, atau sudah dibaca tidak diprioritaskan sebagai rekomendasi baru.
- Rak Buku mendapat Smart Collections berbasis derived state: Lanjut Dibaca, Belum Dibaca, Baru Ditambahkan, Rating Tinggi, Lama Tidak Dibuka, Tamat tapi Belum Selesai, Manga, Manhwa, dan Manhua.
- Smart Collections tidak membuat membership baru di storage dan tetap memahami linked source dari judul yang sama.
- Filter otomatis dipisahkan dari koleksi buatan user agar keduanya tidak saling membingungkan.

### UI, reader, dan navigasi

- Header mobile dan chrome utama dibuat lebih konsisten antar halaman.
- Search dan Library memakai filter drawer yang sama secara visual, dengan snap point compact sebelum diperluas.
- Reader header/dock diselaraskan dengan bahasa visual aplikasi.
- Chapter drawer dibuat lebih compact dan membuka posisi chapter yang sedang dibaca.
- Status-bar blur dan progress layer dirapikan agar tidak bocor ke konten.
- Notification bell membuka quick dropdown sebelum menuju halaman Pembaruan.
- Cache/query defaults dan route transition disesuaikan untuk mengurangi refetch yang tidak perlu saat berpindah halaman.

### Operasional dan runtime

- Format laporan Telegram ops dirapikan menjadi masalah, dampak, kemungkinan penyebab, tindakan, lalu detail teknis.
- Health, recovery, daily digest, user report, dan command bot memakai copy Indonesia yang lebih ringkas tanpa AI diagnosis.
- Preview deployment tidak lagi crash hanya karena `IMAGE_PROXY_SECRET` belum diset. Signed proxy tetap digunakan saat secret tersedia; tanpa secret, cover dapat fallback ke direct URL.
- CI tetap menjalankan typecheck, lint, tests, dan production build.

## [2.1.0] — 2026-09-27

Rilis ini menyatukan identitas multi-source dan merapikan struktur navigasi utama.

### Multi-source identity dan recovery

- Judul yang sama dari beberapa source dapat tampil sebagai satu hasil canonical.
- Library, bookmark, history, dan source recovery memakai identitas judul yang lebih tahan terhadap perpindahan source.
- Original title, alternate title, Unicode, dan author dipakai untuk memperkuat matching.
- Source picker hanya menawarkan source yang layak dipakai untuk membaca.
- Relink source mempertahankan progress lama dan tidak memindahkan chapter ambigu secara otomatis.
- Recovery diperluas ke error detail/reader tanpa menganggap semua 404 sebagai source mati.

### UI dan navigasi

- `PageHeader` menjadi pola header utama untuk destination page.
- Settings menjadi route mandiri, bukan modal yang menumpuk di atas halaman lain.
- Search, Library, Rak Buku, Populer, Sources, Downloads, Manga Detail, dan Reader mendapat penyelarasan loading, spacing, dan mobile navigation.
- Notification bell mendapat quick popover dan seen state.
- Route transition dan skeleton route dibuat lebih konsisten.
- Toast dan area yang disentuh mulai dibersihkan dari palette/glow lama.

### Reliability

- Teks dari source disanitasi sebelum masuk ke kartu dan detail.
- Per-source failure di search tidak membatalkan hasil dari source lain.
- Source disabled/unavailable tidak dipakai sebagai kandidat recovery.
- Tidak ada dependency baru untuk canonical multi-source flow.

## [1.1.0] — 2026-09-20

Rilis ini membentuk fondasi reader Yomirra yang sekarang.

### Ditambahkan

- multi-source search dan discovery;
- Library, collections, custom reading status, history, dan Continue Reading;
- chapter update tracking;
- Download Manager dan offline reading;
- Backup & Restore;
- source health handling;
- PWA support;
- reader preferences dan reading controls.

### Diperbaiki

- reader mobile dan progress persistence;
- image loading dan URL handling untuk beberapa source;
- handling source yang unavailable atau gagal sebagian;
- lifecycle `blob:` / `data:` image pada offline reader;
- cleanup object URL sementara;
- partial/missing downloaded chapter handling;
- loading, empty, dan error state di beberapa halaman.

### Internal

- source-specific behavior mulai dipisahkan dari UI;
- Library, History, Downloads, dan reader state dibuat local-first;
- state reader dan navigation dikurangi ketergantungannya pada response source langsung.
