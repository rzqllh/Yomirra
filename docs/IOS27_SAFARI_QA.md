# Yomirra — iOS 27 Safari Compatibility & PWA QA Report

**Branch:** `feat/yomirra-full-uiux-revamp-20261026`  
**Worktree:** `C:\\Users\\Hafizh Rizqullah\\Documents\\Code\\_active\\_yomirra-worktrees\\impl-full-uiux`  
**Date:** 2026-10-27  
**Auditor:** Xyeena Axazeela (Strategic QA & Architecture)  

---

## 1. Executive Summary

Audit kompatibilitas iOS 27 Safari dan Progressive Web App (PWA) dilakukan langsung pada aplikasi Yomirra aktual (bukan prototipe terisolasi) untuk menyelesaikan diskrepansi antara Chrome viewport emulation dan iPhone fisik pada iOS 27.

Tiga tingkat pengujian dieksekusi:
1. **Tier A (Playwright WebKit Lokal di Windows):** **VERIFIED & COMPLETED**. Menjalankan engine WebKit aktual dengan profil perangkat iPhone 16 Pro class (393×852, DPR 3, touch, mobile Safari UA).
2. **Tier B (BrowserStack Automate + Real iOS 27 Safari):** **BLOCKED (Awaiting Credentials)**. Konfigurasi Playwright BrowserStack telah disiapkan (`playwright.browserstack.config.ts`). Environment variables `BROWSERSTACK_USERNAME` dan `BROWSERSTACK_ACCESS_KEY` belum diset di sistem pengguna.
3. **Tier C (Real-Device PWA Physical Validation):** **PENDING / NOT TESTED**. Sesuai aturan kejujuran bukti (*Evidence First*), mode Add-to-Home-Screen standalone pada iPhone fisik tidak diklaim lolos tanpa bukti perangkat riil.

---

## 2. Test Environments & Device Profiles

| Environment | OS / Version | Engine / Browser | Viewport / DPR | Safe Area (T/B/L/R) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier A: Local WebKit (Portrait)** | iOS 27-like Profile | WebKit 1.64.1 (Safari 27 UA) | 393 × 852 @ 3x | 0 / 0 / 0 / 0 (Desktop WebKit runtime) | **PASSED** |
| **Tier A: Local WebKit (Landscape)**| iOS 27-like Profile | WebKit 1.64.1 (Safari 27 UA) | 852 × 393 @ 3x | 0 / 0 / 0 / 0 (Desktop WebKit runtime) | **PASSED** |
| **Tier B: BrowserStack Real iOS** | iOS 27 | Real Mobile Safari | Real iPhone / iPad | Dynamic Island / Notch insets | **BLOCKED** (No cloud credentials) |
| **Tier C: Physical Device PWA** | iOS 27 | WebKit Standalone PWA | Physical Screen | Hardware insets (59px top / 34px bottom) | **PENDING** (No physical device) |

---

## 3. Discovered Root Causes & Production Fixes

### Issue 1: iOS Auto-Zoom pada Input Fokus
- **Gejala:** Saat mengetuk field pencarian, command menu, atau modal nama koleksi di iPhone Safari, viewport otomatis membesar (zoom ~120%), merusak alignment dock bawah dan header sticky.
- **Root Cause:** Input memiliki kelas Tailwind `text-sm` (14px) pada layar mobile (`< 640px`). Safari iOS mewajibkan font-size minimal 16px untuk mencegah automatic viewport scaling.
- **Fix:**
  - `src/components/ui/command.tsx`: Ubah kelas input dari `text-sm sm:text-base` menjadi `text-base sm:text-sm`.
  - `src/components/collection/collection-modals.tsx`: Ubah input dari `text-sm` menjadi `text-base sm:text-sm`.
  - `src/components/komik/manga-collection-button.tsx`: Ubah input dari `text-sm` menjadi `text-base sm:text-sm`.

### Issue 2: Missing Safe-Area Variable `--bottom-dock-height` di CSS
- **Gejala:** Paged reader menghitung padding bawah menggunakan `pb-[calc(var(--bottom-dock-height)+var(--safe-bottom))]`, namun variabel CSS `--bottom-dock-height` tidak pernah didefinisikan di `globals.css`.
- **Root Cause:** Properti `calc()` dengan CSS variable tak terdefinisi tanpa fallback menghasilkan *invalid at computed-value time*, menyebabkan padding bawah bernilai 0px dan konten menabrak home indicator iPhone.
- **Fix:** Definisikan `--bottom-dock-height: var(--bottom-nav-content-height);` (64px) di `src/app/(web)/globals.css`.

### Issue 3: Top Reading Progress Bar Terpotong di Safe-Area 0px
- **Gejala:** Pada orientasi landscape atau saat browser toolbar Safari menutupi safe area (top inset = 0px), progress bar pembaca menghilang.
- **Root Cause:** `top-[calc(var(--safe-top,0px)-3px)]` menghasilkan `top: -3px` saat `--safe-top` bernilai 0px, menempatkan elemen setinggi 3px sepenuhnya di luar batas atas viewport (`-3px` sampai `0px`).
- **Fix:** Tambahkan pembatas aman `top-[max(0px,calc(var(--safe-top,0px)-3px))]` di `src/components/reader/reader-shell.tsx`.

### Issue 4: Text Size Auto-Inflation pada Rotasi Landscape
- **Gejala:** Saat iPhone diputar ke landscape, Safari iOS secara sepihak memperbesar ukuran teks paragraf.
- **Root Cause:** `-webkit-text-size-adjust: 100%` belum dideklarasikan di level root `html`.
- **Fix:** Tambahkan `-webkit-text-size-adjust: 100%` pada `html` di `src/app/(web)/globals.css`.

### Issue 5: iOS Safari Dynamic Theme-Color untuk Status Bar
- **Gejala:** Pada transisi light mode / dark mode, status bar Safari iOS berkedip atau menampilkan warna latar netral yang tidak menyatu dengan background Washi/Ink Yomirra.
- **Root Cause:** `themeColor` belum didefinisikan dalam `export const viewport: Viewport` di `src/app/(web)/layout.tsx`.
- **Fix:** Daftarkan adaptif `themeColor`: `#f8f6f1` (light mode) dan `#090a0f` (dark mode).

### Issue 6: Drawer Overscroll Chaining pada iOS Touch Gestures
- **Gejala:** Menarik drawer chapter pembaca ke bawah menyebabkan seluruh halaman canvas pembaca di belakangnya ikut bergeser (rubber-banding).
- **Root Cause:** Kontainer scroll drawer tidak memiliki `overscroll-behavior: contain`.
- **Fix:** Tambahkan `overscroll-contain` pada kontainer `src/components/reader/reader-chapter-drawer.tsx`.

### Issue 7: Standalone PWA Detection pada iOS Home Screen
- **Gejala:** PWA yang diluncurkan via Add to Home Screen terkadang gagal dideteksi sebagai mode standalone.
- **Root Cause:** Hook `usePWAInstall` hanya memeriksa `matchMedia('(display-mode: standalone)')`, padahal iOS Safari historis menggunakan `window.navigator.standalone === true` dan manifest Yomirra mengizinkan `display: fullscreen`.
- **Fix:** Dukung deteksi kombinasi `display-mode: standalone`, `display-mode: fullscreen`, dan `(navigator as any).standalone` di `src/shared/hooks/use-pwa-install.ts`.

---

## 4. Route Coverage & Audit Matrix

| Route | Tested Surface | Viewport Checked | Visual Result | Evidence Artifact |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Beranda (Hero, Feed, Rails) | Portrait & Landscape | **Valid** — tidak ada horizontal overflow | `ios27_safari_home_portrait.png`, `ios27_safari_home_landscape.png` |
| `/library` | Rak Buku & Riwayat Baca | Portrait 393×852 | **Valid** — padding dock bawah 114px bersih | `ios27_safari_library_portrait.png` |
| `/search` | Toolbar Cari & Filter Tags | Portrait 393×852 | **Valid** — input 16px, tidak zoom | `ios27_safari_search_portrait.png`, `ios27_safari_search_input_focused.png` |
| `/popular` | Grid Populer & Filter Drawer | Portrait 393×852 | **Valid** — kartu adaptif | `ios27_safari_popular_portrait.png` |
| `/updates` | Notifikasi & Timeline Rilis | Portrait 393×852 | **Valid** — sticky date header aman | `ios27_safari_updates_portrait.png` |
| `/sources` | Direktori Katalog Sumber | Portrait 393×852 | **Valid** — status badge & toggle | `ios27_safari_sources_portrait.png` |
| `/account` | Profil & Sinkronisasi Cloud | Portrait 393×852 | **Valid** — panel autentikasi rapi | `ios27_safari_account_portrait.png` |
| `/downloads` | Offline Storage Manager | Portrait 393×852 | **Valid** — progress meter akurat | `ios27_safari_downloads_portrait.png` |
| `/settings` | Preferensi Tema & Pembaca | Portrait 393×852 | **Valid** — switch & slider responsif | `ios27_safari_settings_portrait.png` |

---

## 5. Automated Regression Test Architecture

Untuk menjaga kestabilan jangka panjang tanpa magic numbers:
1. **Playwright Config:** `playwright.config.ts` menambahkan project:
   - `webkit-mobile-safari` (Local WebKit engine dengan iPhone 16 Pro profile)
   - `chromium-mobile` (Chrome mobile emulation sebagai pembanding)
   - `browserstack-ios27` (Executable Cloud spec untuk real iOS 27)
2. **Regression Spec:** `e2e/ios27-safari-regression.spec.ts` menguji:
   - Font-size input >= 16px di viewport mobile
   - Keberadaan meta `viewport-fit=cover` dan `theme-color`
   - Zero horizontal overflow (`scrollWidth <= innerWidth`)
   - Bounding rect dock bawah selalu berada di visible viewport
   - Safe-area CSS variables valid di DOM runtime

---

## 6. Parity & Release Gate Status

- **Q1–Q175 Decisions:** Seluruh keputusan arsitektur dan reader behavior (Q50, Q52, Q63) dipertahankan utuh.
- **Main Worktree Integrity:** 11 staged files di branch `main` tidak tersentuh.
- **Design Worktree Integrity:** Worktree `p2-beranda-adaptive` tidak tersentuh.
- **Verification Boundary:**
  - TypeScript compilation (`tsc --noEmit`): Passed.
  - Vitest Unit & Contract Suite (`npx vitest run`): Passed.
  - WebKit Mobile Playwright Automation: Passed.
  - Real Cloud iOS 27: BLOCKED menunggu kredensial pemilik proyek.