# Yomirra — UI/UX Redesign Audit & Proposal

> Status: `FINAL AUDIT & PROPOSAL — PENDING EXECUTION PLAN APPROVAL`  
> Implementation: `NOT STARTED (AWAITING APPROVAL TO COMMENCE CODE EDITS)`  
> Reference directory: `redesign-reference/` (13 Visual References inspected)  
> Source of truth: Actual repository code + runtime behavior + PRD/ARCH/DESIGN  
> Date: 16 September 2026  
> Lead Architect: Xyeena Axazeela  

---

# 1. Executive Summary & Final Approved Direction

## 1.1 Status Keputusan Terkunci (Final Locked Direction)
1. **Navigasi Mobile 4 Tab (A-001):**  
   Bottom dock mobile akan dikunci pada 4 pilar inti: **`Beranda`**, **`Library`**, **`Bookmark`**, **`Cari`**. `Settings` akan dikeluarkan dari bottom dock dan dialihkan menjadi aksi sekunder di header/top-level utility.
2. **Domain Koleksi (A-002):**  
   `CollectionManager` akan dipindahkan keluar dari `Settings` menuju domain **`Bookmark`** (tab Koleksi) tanpa menghapus atau mengubah logika fungsional CRUD koleksi yang ada.
3. **Pembersihan Pintasan Navigasi di Settings (A-003):**  
   Seksi statis "Pintasan Navigasi" akan dihapus dari UI halaman Settings. Rute `/updates`, `/popular`, dan `/sources` **tetap dipertahankan** dan akan dialirkan melalui titik masuk kontekstual yang natural di Beranda dan Library.
4. **Pustaka Ikon Kanonikal (A-005):**  
   **`@phosphor-icons/react`** ditetapkan sebagai pustaka ikon tunggal aplikasi. 8 file yang sempat mengimpor `@hugeicons` akan dinormalisasi kembali ke Phosphor. Aturan size, weight, dan seleksi state akan distandardisasi.
5. **Pemisahan Halaman Pengaturan (Settings) & Akun (Account):**  
   - `/settings`: Pusat kontrol preferensi aplikasi (tampilan, pembaca, keamanan, cache, pembaruan).
   - `/account`: Halaman khusus profil, autentikasi Firebase Google, dan status sinkronisasi cloud. *Ketat: Tanpa mengarang fitur yang tidak didukung backend (tanpa 2FA, Discord, atau multi-device manager buatan).*
6. **Reader Control (A-004) — Option A (Compact Navigation-First):**  
   - Tombol Kembali (Back) akan dipindahkan ke Top Chrome bersama judul bab dan metadata halaman.
   - Kontrol bawah akan dikonsolidasikan menjadi satu dock squircle ramping (tinggi ~56px) berisi: `[|< Prev]`, `[≡ Daftar Chapter]`, `[Next >|]`, dan `[⚙ Settings]`.
   - Progres membaca pasif 2px (`ReaderProgress`) tetap independen di bagian atas.
   - Scrubber horizontal besar dari Option B **tidak akan diimplementasikan** guna mencegah screen obstruction dan gesture conflict pada manhwa/webtoon vertikal.
7. **Splash & Onboarding:**  
   - *Splash Screen:* **Tidak akan dibuat** splash screen HTML buatan. Aplikasi akan mengandalkan native PWA launch bawaan OS dan mengoptimalkan kecepatan startup.
   - *Onboarding:* Disetujui sebagai rute terpisah yang ringan, namun **bukan bagian blocking** dari fase redesign core UI. Akan dieksekusi setelah core UI stabil.
8. **Component Showcase:**  
   Akan dibuat rute implementasi nyata di **`/showcase`** menggunakan komponen aktual Yomirra, diperlakukan secara ketat sebagai **internal/development tooling** yang tidak diekspos pada navigasi publik.
9. **Kompatibilitas Rute `/browse`:**  
   Status rute `/browse` diubah menjadi **`DEPRECATE / KEEP REDIRECT`** (tetap me-redirect ke `/sources` demi menjaga kompatibilitas link eksternal dan bookmark lama).

---

# 2. Mental Model Sumber Komik (Source Mental Model)

Redesign ini membedakan secara tegas 3 konsep sumber komik pada UI, label, dan perilakunya:

```
+-----------------------------------------------------------------------------+
|                           SOURCE MENTAL MODEL                               |
+-----------------------------------------------------------------------------+
| 1. ENABLED SOURCE (Sumber Terpasang / Aktif Digunakan)                      |
|    - Ekstensi sumber yang berstatus aktif/terpasang dan siap digunakan.     |
|    - Pengguna dapat memiliki BANYAK sumber yang berstatus Enabled.          |
|    - Dikelola di: Halaman Sources (/sources) via toggle enable/disable.     |
+-----------------------------------------------------------------------------+
| 2. ACTIVE SOURCE (Sumber Terpilih / Katalog Aktif)                          |
|    - SATU sumber tunggal yang saat ini menggerakkan katalog Library.        |
|    - Mengatur filter kategori, urutan, dan rilis bab pada halaman Library.   |
|    - Ditampilkan jelas di: Kartu Sumber Aktif di /library [Ganti Sumber >]. |
+-----------------------------------------------------------------------------+
| 3. MULTI-SOURCE SEARCH (Pencarian Lintas Sumber)                            |
|    - Mesin pencari paralel yang meminta data ke SEMUA Enabled Sources.      |
|    - TIDAK dibatasi oleh Active Source Library saat ini.                     |
|    - Dikelola di: Halaman Cari (/search) dengan source control rail.        |
+-----------------------------------------------------------------------------+
```

---

# 3. Workstream Identitas & Brand Yomirra (App Icon & Visual Mark)

## 3.1 Audit Aset Brand Saat Ini di Repositori
- **File Manifest:** `src/app/manifest.ts` saat ini masih menggunakan sisa tema lama (`background_color: '#000D0F'`, `theme_color: '#000D0F'`).
- **File Ikon Aplikasi Saat Ini:**
  - `src/app/icon.png`, `apple-icon.png`, `favicon.png` (ukuran 1.1MB).
  - `src/logo/icon.png`, `brand.png`, `favicon.png`.
  - `public/icons/`: `icon-192.png`, `icon-192-maskable.png`, `icon-512.png`, `icon-512-maskable.png`, serta 4 shortcut icons.
- **Header Logo & App Shell:** `src/components/app/top-nav.tsx` mengimpor `import Logo from "@/logo/icon.png"`.

## 3.2 Konsep Identitas Brand & App Icon
- **Akar Filosofi:** Nama `Yomirra` berakar secara konseptual dari terminologi membaca dalam bahasa Jepang (*yomu* / *yomimasu*). Namun, identitas brand **TIDAK AKAN** diubah menjadi klise ornamen Jepang secara harfiah.
- **Komunikasi Visual Ikon:**
  1. *Reading (Membaca):* Helaian lembaran buku/cerita yang dinamis.
  2. *Manga / Webtoon Storytelling:* Estetika panel modern dengan kontras tinggi.
  3. *Multi-Source Reading:* Lapisan kaca transparan (*frosted glass layers*) yang menyatu dalam satu antarmuka terpadu.
  4. *Discovery (Penemuan):* Elemen aksen cahaya/sparkle di puncak ikon yang memancarkan eksplorasi judul baru.
- **Status Mockup `icon.png`:** Gambar `redesign-reference/icon.png` diperlakukan secara ketat sebagai **visual reference saja**, bukan aset biner final yang langsung disalin tanpa audit.
- **Ruang Lingkup Aset Brand yang Akan Dihasilkan:**
  1. *Yomirra App Icon Master:* Master SVG / High-Res PNG.
  2. *Favicon & PWA Icon Family:*
     - `favicon.ico` (multi-size: 16x16, 32x32, 48x48)
     - `icon-192.png` (192x192 PNG standar)
     - `icon-192-maskable.png` (192x192 PNG dengan safe margin 20% Android)
     - `icon-512.png` (512x512 PNG splash desktop/PWA)
     - `icon-512-maskable.png` (512x512 PNG Android adaptive icon)
     - `apple-touch-icon.png` (180x180 PNG iOS home screen)
  3. *Logo Mark & Compact Logo:*
     - Full Logo Mark (Ikon + Logotype "Yomirra" dalam tipografi Inter/Outfit semi-bold)
     - Compact Logo Mark (Monogram Squircle Y/Book untuk mobile header)
  4. *Splash / Native Launch Identity:* Integrasi `theme_color` (#000000) dan icon centered di PWA webmanifest untuk launch sequence native OS yang mulus tanpa flash.
  5. *Header / App-Shell Logo Usage:* Standardisasi pemakaian logo di `top-nav.tsx` dan `header.tsx` dengan ukuran fixed 32x32 squircle.
- **Klausul Integritas:** **TIDAK ADA penggantian aset biner gambar yang akan dilakukan sebelum proposal desain brand/ikon final dipresentasikan dan disetujui pengguna.**

---

# 4. Scope & Page Inventory

| Screen / Route | Status Repo | Mobile | Tablet | Desktop | Reference File | Status Rencana |
|---|:---:|:---:|:---:|:---:|---|:---:|
| **Splash Screen** | ❌ (Belum Ada) | ✅ | ✅ | ✅ | `Splash_Screen.png` | **REJECTED (Native PWA Launch)** |
| **Onboarding Flow** | ❌ (Belum Ada) | ✅ | ✅ | ✅ | `Onboarding_Screen.png` | **DEFERRED (Post-Core Phase)** |
| **Beranda** (`/`) | ✅ Ada | ✅ | ✅ | ✅ | `... (1).png` | **REFACTOR (Editorial Squircle)** |
| **Library** (`/library`) | ✅ Ada | ✅ | ✅ | ✅ | `... (2).png` | **REFACTOR (Active Source View)** |
| **Bookmark** (`/bookmark`) | ✅ Ada | ✅ | ✅ | ✅ | `... (3).png` | **REFACTOR (Hub Koleksi Pribadi)** |
| **Cari** (`/search`) | ✅ Ada | ✅ | ✅ | ✅ | `... (4).png` | **REFACTOR (Multi-Source Discovery)** |
| **Sources** (`/sources`) | ✅ Ada | ✅ | ✅ | ✅ | `... (5).png` | **REFACTOR (Domain Manajemen Sumber)** |
| **Manga Detail** (`/manga/[src]/[id]`) | ✅ Ada | ✅ | ✅ | ✅ | `... (6).png` | **REFACTOR (Single Header Action)** |
| **Reader View** (`.../read/[ch]`) | ✅ Ada | ✅ | ✅ | ✅ | `... (8).png` | **REFACTOR (Option A Ramping)** |
| **Reader Settings Sheet** | ✅ Ada | ✅ | ✅ | ✅ | `... (9).png` | **REFACTOR (Squircle Sheet)** |
| **Reader Chapter Drawer** | ✅ Ada | ✅ | ✅ | ✅ | `... (10).png` | **REFACTOR (Squircle Drawer)** |
| **Settings** (`/settings`) | ✅ Ada | ✅ | ✅ | ✅ | `... (7).png` | **RESTRUCTURE (App Control Center)** |
| **Account** (`/account`) | ❌ (Eksis di Settings) | ✅ | ✅ | ✅ | `... (7).png` | **NEW ROUTE (Dedicated Profile & Sync)** |
| **Updates** (`/updates`) | ✅ Ada | ✅ | ✅ | ✅ | Lonceng Header | **KEEP (Contextual Entry)** |
| **Popular** (`/popular`) | ✅ Ada | ✅ | ✅ | ✅ | Seksi Beranda | **KEEP (Contextual Entry)** |
| **Downloads** (`/downloads`) | ✅ Ada | ✅ | ✅ | ✅ | Storage Settings | **KEEP (Contextual Entry)** |
| **Component Showcase** (`/showcase`)| ❌ (Belum Ada) | ✅ | ✅ | ✅ | Design Specs | **NEW DEV ROUTE (Internal Only)** |
| **Browse Redirect** (`/browse`) | ✅ Ada (Dummy) | - | - | - | - | **DEPRECATE / KEEP REDIRECT** |

---

# 5. Global Squircle & Concentric Radius Specification

Aplikasi Yomirra mengadopsi standar sudut **Squircle Konsentris** secara global.

## 5.1 Formula Radius Konsentris
Untuk elemen anak (child) di dalam kontainer induk (parent) yang memiliki inset:
$$R_{\text{child}} = \max(R_{\text{parent}} - \text{inset}, R_{\text{min}})$$

*Aturan Batas Bawah ($R_{\text{min}}$):*  
Nilai $R_{\text{min}} = 6\text{px}$ (`radius-xs`). Jika perhitungan menghasilkan angka di bawah 6px, radius dikunci pada 6px agar sudut tidak berubah menjadi persegi tajam.

## 5.2 Skala Token Radius Yomirra

| Token | Nilai | Contoh Induk (Parent) | Contoh Anak (Child) & Inset | Nilai Terhitung |
|---|:---:|---|---|:---:|
| `--radius-sheet` | `32px` | Vaul Filter Drawer / Reader Sheet | Group card opsi (inset 16px) | $32 - 16 = 16\text{px} \rightarrow$ `rounded-2xl` |
| `--radius-xl` | `26px` | Floating Bottom Dock / Dialog Modal | Active tab indicator pill (inset 6px) | $26 - 6 = 20\text{px} \rightarrow$ `rounded-xl` |
| `--radius-lg` | `20px` | ShelfCard / Segmented Track / Button | Segmented sliding thumb (inset 4px) | $20 - 4 = 16\text{px} \rightarrow$ `rounded-lg` |
| `--radius-md` | `14px` | FilterChip / Input / Cover Grid | Icon badge di dalam chip (inset 4px) | $14 - 4 = 10\text{px} \rightarrow$ `rounded-sm` |
| `--radius-sm` | `10px` | Thumbnail Row / Inner Card Item | Mini rating badge / dot (inset 2px) | $10 - 2 = 8\text{px} \rightarrow$ `rounded-xs` |
| `--radius-xs` | `6px` | Format Badge (`MANHWA`, `18+`, `RAW`) | Teks monospace mikro | - |

## 5.3 Aturan Avatar Pengguna (User Avatar Geometry)
- **Arah Desain:** Avatar pengguna **TIDAK DIKECUALIKAN** dari squircle. Avatar akan menggunakan kontainer **squircle konsentris** (`rounded-2xl` untuk avatar besar 60px, `rounded-xl` untuk avatar header 36px) dengan border halus.
- **Pengecualian Bulat Murni (`rounded-full`):**  
  Hanya dibatasi ketat untuk entitas geometris yang menuntut lingkaran murni:
  1. *Status Online Dot* (`w-2 h-2 rounded-full`)
  2. *Toggle Switch Thumb* (`w-4 h-4 rounded-full`)
  3. *Progress/Scrubber Thumb*
  4. *Circular Loading Spinner*

---

# 6. Kontrak Semantik Visual & Matriks Varian × State Lengkap

Berikut adalah matriks varian × state lengkap untuk **9 Varian Semantik** dan **7 State Interaktif** yang mendefinisikan perilaku visual secara eksplisit, mencegah class hover generik merusak hierarki warna solid.

| Varian | State | Background | Foreground / Teks | Border | Shadow / Elevation | Icon Treatment | Opasitas | Motion Feedback |
|---|---|---|---|---|---|---|:---:|---|
| **1. Primary / Accent** | **Default** | `bg-accent` (`#5856D6` / `#6C6AFA`) | `#FFFFFF` (Solid White) | `border-transparent` | `shadow-xs` | `#FFFFFF regular` | 1.0 | `transition-all duration-150` |
| | **Hover** | `bg-accent-hover` (`#4644B8` / `#8A88FF`) | `#FFFFFF` | `border-transparent` | `shadow-sm` | `#FFFFFF regular` | 1.0 | `brightness-105 duration-150` |
| | **Pressed** | `bg-accent` (`#3E3C9E` / `#5A58D6`) | `#FFFFFF` | `border-transparent` | `shadow-none` | `#FFFFFF regular` | 1.0 | `scale-[0.98] duration-75` |
| | **Focus-Vis** | `bg-accent` | `#FFFFFF` | `ring-2 ring-accent ring-offset-2 ring-offset-background` | `shadow-xs` | `#FFFFFF regular` | 1.0 | `ring-offset-2 transition-shadow` |
| | **Selected** | `bg-accent text-white font-bold` | `#FFFFFF` | `border-transparent` | `shadow-xs` | `#FFFFFF fill` | 1.0 | `stable` |
| | **Disabled** | `bg-accent/40` | `#FFFFFF/70` | `border-transparent` | `shadow-none` | `#FFFFFF/60 regular` | 0.45 | `pointer-events-none` |
| | **Loading** | `bg-accent` | `#FFFFFF` | `border-transparent` | `shadow-none` | `CircleNotch animate-spin` | 0.85 | `cursor-wait` |
|---|---|---|---|---|---|---|:---:|---|
| **2. Secondary** | **Default** | `bg-surface-raised` | `text-text-primary` | `border-border-default` | `shadow-none` | `text-text-secondary regular` | 1.0 | `transition-all duration-150` |
| | **Hover** | `bg-surface-hover` | `text-text-primary` | `border-border-strong` | `shadow-xs` | `text-text-primary regular` | 1.0 | `duration-150` |
| | **Pressed** | `bg-surface-muted` | `text-text-primary` | `border-border-strong` | `shadow-none` | `text-text-primary regular` | 1.0 | `scale-[0.98] duration-75` |
| | **Focus-Vis** | `bg-surface-raised` | `text-text-primary` | `ring-2 ring-accent ring-offset-2 ring-offset-background` | `shadow-none` | `text-text-primary regular` | 1.0 | `transition-shadow` |
| | **Selected** | `bg-surface-hover` | `text-accent font-bold` | `border-accent/40` | `shadow-none` | `text-accent fill` | 1.0 | `stable` |
| | **Disabled** | `bg-surface-raised/40` | `text-text-muted/40` | `border-border-subtle/30` | `shadow-none` | `text-text-muted/30 regular` | 0.4 | `pointer-events-none` |
| | **Loading** | `bg-surface-raised` | `text-text-primary` | `border-border-default` | `shadow-none` | `CircleNotch animate-spin` | 0.7 | `cursor-wait` |
|---|---|---|---|---|---|---|:---:|---|
| **3. Ghost** | **Default** | `bg-transparent` | `text-text-secondary` | `border-transparent` | `shadow-none` | `text-text-secondary regular` | 1.0 | `transition-colors duration-150` |
| | **Hover** | `bg-surface-hover/60` | `text-text-primary` | `border-transparent` | `shadow-none` | `text-text-primary regular` | 1.0 | `duration-150` |
| | **Pressed** | `bg-surface-hover` | `text-text-primary` | `border-transparent` | `shadow-none` | `text-text-primary regular` | 1.0 | `scale-[0.98] duration-75` |
| | **Focus-Vis** | `bg-surface-hover/40` | `text-text-primary` | `ring-2 ring-accent ring-offset-2 ring-offset-background` | `shadow-none` | `text-text-primary regular` | 1.0 | `transition-shadow` |
| | **Selected** | `bg-accent/10` | `text-accent font-bold` | `border-transparent` | `shadow-none` | `text-accent fill` | 1.0 | `stable` |
| | **Disabled** | `bg-transparent` | `text-text-muted/30` | `border-transparent` | `shadow-none` | `text-text-muted/30 regular` | 0.35 | `pointer-events-none` |
| | **Loading** | `bg-transparent` | `text-text-secondary` | `border-transparent` | `shadow-none` | `CircleNotch animate-spin` | 0.7 | `cursor-wait` |
|---|---|---|---|---|---|---|:---:|---|
| **4. Glass / Frosted** | **Default** | `bg-surface-glass backdrop-blur-xl` | `text-text-primary` | `border-border-glass` | `shadow-glass` | `text-text-secondary regular` | 1.0 | `backdrop-blur-xl duration-150` |
| | **Hover** | `bg-surface-glass/90 backdrop-blur-2xl`| `text-text-primary` | `border-border-strong` | `shadow-glass` | `text-text-primary regular` | 1.0 | `duration-150` |
| | **Pressed** | `bg-surface-glass` | `text-text-primary` | `border-border-strong` | `shadow-xs` | `text-text-primary regular` | 1.0 | `scale-[0.98] duration-75` |
| | **Focus-Vis** | `bg-surface-glass` | `text-text-primary` | `ring-2 ring-accent ring-offset-2 ring-offset-background` | `shadow-glass` | `text-text-primary regular` | 1.0 | `transition-shadow` |
| | **Selected** | `bg-accent/20 backdrop-blur-xl` | `text-accent font-bold` | `border-accent/40` | `shadow-xs` | `text-accent fill` | 1.0 | `stable` |
| | **Disabled** | `bg-surface-glass/30` | `text-text-muted/30` | `border-border-glass/30` | `shadow-none` | `text-text-muted/30 regular` | 0.4 | `pointer-events-none` |
| | **Loading** | `bg-surface-glass` | `text-text-primary` | `border-border-glass` | `shadow-glass` | `CircleNotch animate-spin` | 0.7 | `cursor-wait` |
|---|---|---|---|---|---|---|:---:|---|
| **5. Destructive** | **Default** | `bg-semantic-error` (`#DC2626` / `#EF4444`)| `#FFFFFF` | `border-transparent` | `shadow-xs` | `#FFFFFF regular` | 1.0 | `transition-all duration-150` |
| | **Hover** | `bg-semantic-error/90` | `#FFFFFF` | `border-transparent` | `shadow-sm` | `#FFFFFF regular` | 1.0 | `brightness-105 duration-150` |
| | **Pressed** | `bg-semantic-error/80` | `#FFFFFF` | `border-transparent` | `shadow-none` | `#FFFFFF regular` | 1.0 | `scale-[0.98] duration-75` |
| | **Focus-Vis** | `bg-semantic-error` | `#FFFFFF` | `ring-2 ring-semantic-error ring-offset-2 ring-offset-background`| `shadow-xs` | `#FFFFFF regular` | 1.0 | `ring-offset-2 transition-shadow` |
| | **Selected** | `bg-semantic-error font-bold` | `#FFFFFF` | `border-transparent` | `shadow-xs` | `#FFFFFF fill` | 1.0 | `stable` |
| | **Disabled** | `bg-semantic-error/40` | `#FFFFFF/60` | `border-transparent` | `shadow-none` | `#FFFFFF/50 regular` | 0.4 | `pointer-events-none` |
| | **Loading** | `bg-semantic-error` | `#FFFFFF` | `border-transparent` | `shadow-none` | `CircleNotch animate-spin` | 0.8 | `cursor-wait` |
|---|---|---|---|---|---|---|:---:|---|
| **6. Success** | **Default** | `bg-semantic-success/15` | `text-semantic-success` (`#34C759` / `#30D158`) | `border-semantic-success/30` | `shadow-none` | `text-semantic-success regular` | 1.0 | `transition-all duration-150` |
| | **Hover** | `bg-semantic-success/25` | `text-semantic-success` | `border-semantic-success/50` | `shadow-xs` | `text-semantic-success regular` | 1.0 | `duration-150` |
| | **Pressed** | `bg-semantic-success/30` | `text-semantic-success` | `border-semantic-success/60` | `shadow-none` | `text-semantic-success regular` | 1.0 | `scale-[0.98] duration-75` |
| | **Focus-Vis** | `bg-semantic-success/20` | `text-semantic-success` | `ring-2 ring-semantic-success ring-offset-2 ring-offset-background` | `shadow-none` | `text-semantic-success regular` | 1.0 | `transition-shadow` |
| | **Selected** | `bg-semantic-success text-white font-bold` | `#FFFFFF` | `border-transparent` | `shadow-xs` | `#FFFFFF fill` | 1.0 | `stable` |
| | **Disabled** | `bg-semantic-success/10` | `text-semantic-success/40` | `border-semantic-success/15` | `shadow-none` | `text-semantic-success/40 regular` | 0.4 | `pointer-events-none` |
| | **Loading** | `bg-semantic-success/20` | `text-semantic-success` | `border-semantic-success/30` | `shadow-none` | `CircleNotch animate-spin` | 0.7 | `cursor-wait` |
|---|---|---|---|---|---|---|:---:|---|
| **7. Warning** | **Default** | `bg-semantic-warning/15` | `text-semantic-warning` (`#FF9500` / `#FF9F0A`) | `border-semantic-warning/30` | `shadow-none` | `text-semantic-warning regular` | 1.0 | `transition-all duration-150` |
| | **Hover** | `bg-semantic-warning/25` | `text-semantic-warning` | `border-semantic-warning/50` | `shadow-xs` | `text-semantic-warning regular` | 1.0 | `duration-150` |
| | **Pressed** | `bg-semantic-warning/30` | `text-semantic-warning` | `border-semantic-warning/60` | `shadow-none` | `text-semantic-warning regular` | 1.0 | `scale-[0.98] duration-75` |
| | **Focus-Vis** | `bg-semantic-warning/20` | `text-semantic-warning` | `ring-2 ring-semantic-warning ring-offset-2 ring-offset-background` | `shadow-none` | `text-semantic-warning regular` | 1.0 | `transition-shadow` |
| | **Selected** | `bg-semantic-warning text-black font-bold` | `#000000` | `border-transparent` | `shadow-xs` | `#000000 fill` | 1.0 | `stable` |
| | **Disabled** | `bg-semantic-warning/10` | `text-semantic-warning/40` | `border-semantic-warning/15` | `shadow-none` | `text-semantic-warning/40 regular` | 0.4 | `pointer-events-none` |
| | **Loading** | `bg-semantic-warning/20` | `text-semantic-warning` | `border-semantic-warning/30` | `shadow-none` | `CircleNotch animate-spin` | 0.7 | `cursor-wait` |
|---|---|---|---|---|---|---|:---:|---|
| **8. Info** | **Default** | `bg-semantic-info/15` | `text-semantic-info` (`#0A84FF` / `#64D2FF`) | `border-semantic-info/30` | `shadow-none` | `text-semantic-info regular` | 1.0 | `transition-all duration-150` |
| | **Hover** | `bg-semantic-info/25` | `text-semantic-info` | `border-semantic-info/50` | `shadow-xs` | `text-semantic-info regular` | 1.0 | `duration-150` |
| | **Pressed** | `bg-semantic-info/30` | `text-semantic-info` | `border-semantic-info/60` | `shadow-none` | `text-semantic-info regular` | 1.0 | `scale-[0.98] duration-75` |
| | **Focus-Vis** | `bg-semantic-info/20` | `text-semantic-info` | `ring-2 ring-semantic-info ring-offset-2 ring-offset-background` | `shadow-none` | `text-semantic-info regular` | 1.0 | `transition-shadow` |
| | **Selected** | `bg-semantic-info text-white font-bold` | `#FFFFFF` | `border-transparent` | `shadow-xs` | `#FFFFFF fill` | 1.0 | `stable` |
| | **Disabled** | `bg-semantic-info/10` | `text-semantic-info/40` | `border-semantic-info/15` | `shadow-none` | `text-semantic-info/40 regular` | 0.4 | `pointer-events-none` |
| | **Loading** | `bg-semantic-info/20` | `text-semantic-info` | `border-semantic-info/30` | `shadow-none` | `CircleNotch animate-spin` | 0.7 | `cursor-wait` |
|---|---|---|---|---|---|---|:---:|---|
| **9. Neutral / Muted** | **Default** | `bg-surface-muted` | `text-text-muted` | `border-transparent` | `shadow-none` | `text-text-muted regular` | 1.0 | `transition-all duration-150` |
| | **Hover** | `bg-surface-hover` | `text-text-secondary` | `border-border-subtle` | `shadow-none` | `text-text-secondary regular` | 1.0 | `duration-150` |
| | **Pressed** | `bg-surface-hover/80` | `text-text-primary` | `border-border-subtle` | `shadow-none` | `text-text-primary regular` | 1.0 | `scale-[0.98] duration-75` |
| | **Focus-Vis** | `bg-surface-muted` | `text-text-primary` | `ring-2 ring-text-muted ring-offset-2 ring-offset-background` | `shadow-none` | `text-text-primary regular` | 1.0 | `transition-shadow` |
| | **Selected** | `bg-surface-raised font-bold` | `text-text-primary` | `border-border-default` | `shadow-xs` | `text-text-primary fill` | 1.0 | `stable` |
| | **Disabled** | `bg-surface-muted/30` | `text-text-muted/20` | `border-transparent` | `shadow-none` | `text-text-muted/20 regular` | 0.3 | `pointer-events-none` |
| | **Loading** | `bg-surface-muted` | `text-text-muted` | `border-transparent` | `shadow-none` | `CircleNotch animate-spin` | 0.6 | `cursor-wait` |

---

# 7. Information Architecture Definitif: Settings vs Account

```
[HEADER PROFILE / TOP NAV AVATAR]
├── (Klik Foto / Nama Profil) ──► [/account] PUSAT AKUN & SINKRONISASI
│                                 ├── Profile Box: Foto Squircle, Display Name, Email
│                                 ├── Status Sinkronisasi Real-time (useSync)
│                                 ├── Tombol Aksi "Sinkronkan Sekarang"
│                                 └── Tombol Keluar (Sign Out) Akun
│
└── (Klik Ikon Gear) ───────────► [/settings] PUSAT KONTROL APLIKASI
                                  ├── Quick Settings Grid (4 Squircle Tiles: Tema, Hemat Data, WakeLock, Notifikasi)
                                  ├── Kartu Ringkasan Akun (Tautan "Kelola Akun >" ke /account)
                                  ├── Preferensi Tampilan (Theme Segmented: Terang, Gelap, Sistem)
                                  ├── Preferensi Pembaca (Default Mode: Continuous Vertical / Paged)
                                  ├── Pembaruan & Notifikasi (Interval Scan Library Cooldown)
                                  ├── Konten & Keamanan (Filter NSFW 18+ Toggle)
                                  ├── Data & Penyimpanan (Cache Bar Visual, Bersihkan Cache, Backup & Restore)
                                  └── Tentang Yomirra (Versi Build & Info Komunitas)
```

---

# 8. Reader Ergonomics Option A (Terpilih)

1. **Top Chrome Overlay:**
   - Tombol Kembali (Back Squircle `h-10 w-10`) di pojok kiri atas.
   - Judul Bab dan Jumlah Halaman di tengah (`text-sm font-bold`).
   - Tombol Bookmark komik di pojok kanan atas.
   - Dilindungi soft gradient scrim `h-24` absolut dari titik `top: 0` untuk proteksi Dynamic Island iOS.
2. **Bottom Control Dock:**
   - Floating squircle dock tunggal (`h-14`, tinggi 56px, `rounded-[22px]`).
   - 4 Tombol navigasi discrete:
     - `[|< Prev]` (Bab Sebelumnya)
     - `[≡ Ch. List]` (Daftar Bab — Tombol Pusat Lebar)
     - `[Next >|]` (Bab Berikutnya)
     - `[⚙]` (Pengaturan Pembaca)
   - Jarak aman bawah: `bottom: max(env(safe-area-inset-bottom), 12px)`.
3. **Progres Membaca:**
   - Garis 2px pasif `ReaderProgress` di batas atas tetap independen, melacak `scrollYProgress` tanpa membebani kontrol sentuh bawah.

---

# 9. Internal Component Showcase (`/showcase`)

Akan dibuat rute pengujian internal di `src/app/(web)/showcase/page.tsx` yang mendemonstrasikan varian nyata komponen Yomirra:
- `Button` (Primary, Secondary, Ghost, Glass, Destructive, Success, Warning, Info, Muted, Loading, Disabled)
- `IconButton` (Squircle varian)
- `SearchInput` (Squircle `rounded-2xl`)
- `SegmentedControl` (Squircle container + concentric thumb)
- `ToggleSwitch`
- `FilterChip` (Active vs Inactive)
- `SourceCard` & `LeaderboardRow`
- `Dialog` (Modal konfirmasi & destructive delete)
- `Bottom Sheet` (FilterDrawer via Vaul)
- `Toasts` & `Empty States`

Rute ini **tidak akan dimasukkan** ke dalam navigasi publik maupun sitemap produksi.

---

# STOP CONDITION

Audit dan proposal ini telah diperbarui secara menyeluruh dan telah mengunci seluruh keputusan pengguna.  
**Tidak ada kode produksi yang diedit sebelum Implementation Plan disetujui.**