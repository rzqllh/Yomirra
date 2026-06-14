# YOMIRRA PHASE 2 ROADMAP (WEBTOON-FIRST)

Berdasarkan keputusan arsitektur terbaru, Yomirra akan **dikunci** menjadi *Webtoon-first reader* secara eksklusif. Pendekatan ini menghilangkan kompleksitas yang tidak perlu dari LTR/RTL/Horizontal Snap dan memfokuskan seluruh upaya *engineering* untuk mencapai *vertical scrolling* yang paling *fluid* dan immersif.

---

## Aturan Inti (The Golden Rules)
- **Vertical continuous scroll only**.
- **No LTR / No RTL**.
- **No horizontal paging / CSS scroll snap horizontal**.
- **No left/right tap navigation** (hanya center tap untuk toggle toolbar).

---

## Rincian Fase Pengembangan

### Phase 2.1 — Webtoon Reader Core
*Fokus: Membangun fondasi reader vertikal murni tanpa jeda.*
- Melakukan **safe migration** dari state `readingMode` lawas di Zustand (`reader-store.ts`) ke `readerPreferences` yang baru.
- Hapus semua *code paths* atau referensi untuk mode Paged / Horizontal di `reader-store.ts`, imports, komponen, maupun UI controls di `reader-settings-drawer.tsx`.
- Ganti konsep "Reading Mode" menjadi **Reader Preferences**:
  - `imageFit: 'width' | 'contained'`
  - `pageGap: 'none' | 'small' | 'comfortable'` (Default: `none` / `block` elemen).
  - `background: 'black' | 'deepLagoon' | 'mist'`
  - `toolbarBehavior: 'auto-hide' | 'always-visible'`
  - `preloadIntensity: 'light' | 'balanced' | 'aggressive'`
  - `showPageProgress: boolean`
  - `keepScreenAwake: boolean` *(opsional)*
- Memastikan tidak ada *descender space* (garis putih) di antara gambar.

### Phase 2.2 — Reader Progress, Resume, and History
*Fokus: Melacak posisi baca secara presisi menggunakan Scroll, bukan index.*
- Implementasi `IntersectionObserver` untuk mendeteksi *current visible image*.
- Progress dan resume tracking **harus di-key berdasarkan** `sourceId + mangaId + chapterId`.
- Menyimpan *progress* menggunakan 2 metrik: **current image index** dan **scroll offset/progress percent**.
- **Scroll restoration** wajib menunggu sampai *image layout* stabil (semua elemen telah terender sebelum memosisikan ulang *scroll*).
- Kembali ke scroll terakhir jika di *chapter* yang sama, mulai dari atas jika *chapter* baru.

### Phase 2.3 — Image Preload and Rendering Stability
*Fokus: Preload cerdas berbasis URL tanpa membebani memori.*
- Menggunakan `Map<string, HTMLImageElement>` (Key = URL) bukan index agar tahan terhadap reorder.
- Preload adaptif berdasarkan `preloadIntensity`:
  - `light`: 2 ahead / 1 behind
  - `balanced` (default): 3 ahead / 1 behind
  - `aggressive`: 5 ahead / 2 behind
- Error handling: Retry image, skip broken image, blur placeholder saat *loading*.
- Tidak menggunakan *virtualization* di tahap awal untuk menghindari *scroll jump*.

### Phase 2.4 — Reader Controls and End-of-Chapter UX
*Fokus: Navigasi intuitif dan transisi antar chapter yang mulus.*
- **Auto-hide Chrome**: Sesuai dengan setting `toolbarBehavior`. Jika `auto-hide`, *scroll down* = hide, *scroll up* = show, *tap center* = toggle.
- **End-of-chapter Experience**: Trigger *mark-as-read* harus terjadi di kisaran **90–95% progress** atau di area *end section*, bukan terlalu awal.
- Transisi mulus di akhir halaman dengan Next Chapter CTA, dan daftar *chapter* terbaru.

### Phase 2.5 — PWA/Image Cache Foundation
*Fokus: Membangun layer proxy dan caching Service Worker yang solid sebelum Download Manager.*
- Secara spesifik akan mencakup implementasi dan audit **Serwist / Service Worker**.
- Pembuatan *Image Proxy*, strategi **Cache API**, dan *manifest* berbasis **IndexedDB**.
- Mengelola *cleanup* cache usang menggunakan mekanisme **LRU / Expiration**.

### Phase 2.6 — Download Manager
*Fokus: UI/UX untuk mengontrol antrian unduhan manga (berbasis dari fondasi Phase 2.5).*

### Phase 2.7 — Source/Extension Manager
*Fokus: UI Modular untuk manajemen ekstensi pencarian (Installed vs Available).*

### Phase 2.8 — External Metadata Enrichment
*Fokus: Menarik rating/skor MAL tanpa OAuth.*
