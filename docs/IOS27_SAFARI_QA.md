# Yomirra - Mobile WebKit & iOS Safari Compatibility QA Report

**Branch:** `feat/yomirra-full-uiux-revamp-20261026`  
**Worktree:** _yomirra-worktrees/impl-full-uiux (isolated verification worktree)  
**Date:** 2026-10-27  
**Auditor:** Xyeena Axazeela (Strategic QA & Architecture)  

---

## 1. Executive Summary & Status Boundary

Audit kompatibilitas mobile web dan Safari dilakukan untuk mendiagnosis dan memitigasi diskrepansi antara Chrome viewport emulation dan Safari iOS.

Berdasarkan prinsip **Evidence First**, batasan pengujian dipetakan secara faktual tanpa rekayasa klaim:

| Tier | Lingkungan | Profil / Engine | Status | Catatan Bukti |
| :--- | :--- | :--- | :--- | :--- |
| **Tier A** | **Local Desktop WebKit (Windows)** | WebKit 1.64.1 (Profil iPhone 15 Pro, 393×852 @ 3x DPR, Touch, Mobile Safari UA) | **PASS (Local WebKit)** | 9 rute utama diaudit, 10 pengujian regresi interaktif lolos otomatis. |
| **Tier B** | **BrowserStack Automate (Real iOS)** | Real Device Cloud Playwright (W3C `bstack:options`) | **BLOCKED** | Konfigurasi resmi siap di `playwright.browserstack.config.ts`. Kredensial `BROWSERSTACK_USERNAME` & `BROWSERSTACK_ACCESS_KEY` belum diset di environment. |
| **Tier C** | **Physical Hardware Real iOS Device** | iPhone Fisik (iOS 27 Standalone Add-to-Home-Screen PWA) | **NOT TESTED** | Belum ada perangkat fisik yang terhubung untuk pengujian hardware riil. |

> [!WARNING]
> **Pemisahan Validasi:** Pengujian WebKit lokal pada sistem operasi Windows membuktikan bahwa engine WebKit mengeksekusi CSS, JS, dan interaksi DOM tanpa crash atau overflow. Namun, pengujian ini **BUKAN bukti visual compatibility Safari iOS 27 asli**. Native mobile Safari memiliki perbedaan perilaku hardware (Dynamic Island safe area insets, virtual keyboard viewport resizing, Safari bottom address bar gesture). Real Safari iOS 27 tetap berstatus **NOT TESTED** sampai divalidasi pada perangkat keras fisik.

---

## 2. Profil Perangkat Faktual (Device Profiles)

Pengujian lokal mengoreksi kekeliruan pelabelan profil sebelumnya:

| Parameter | Spesifikasi Faktual | Catatan Kalibrasi |
| :--- | :--- | :--- |
| **Device Model** | **iPhone 15 Pro** (Bukan iPhone 16 Pro) | Layar 6,1 inci, rasio logis 393 × 852 pt. (iPhone 16 Pro menggunakan layar 6,3 inci dengan resolusi logis 402 × 874 pt). |
| **Viewport (Portrait)** | 393 × 852 pt | Device Scale Factor (DPR): 3.0 |
| **Viewport (Landscape)**| 852 × 393 pt | Device Scale Factor (DPR): 3.0 |
| **User Agent** | Standard Mobile Safari UA | Tidak melakukan spoofing artifisial `Version/27.0` untuk mencegah klaim native semu. |
| **Touch & Gestures** | `hasTouch: true`, `isMobile: true` | Input touch diemulasikan pada engine WebKit. |

---

## 3. Discovered Root Causes & Production Fixes

### 1. iOS Safari Viewport Auto-Zoom pada Input Fokus
- **Gejala:** Mengetuk input pencarian atau modal koleksi di Safari iOS menyebabkan viewport otomatis membesar (zoom ~120%), merusak alignment dock navigasi dan sticky header.
- **Root Cause:** Safari iOS secara otomatis memaksakan zoom bila elemen input memiliki `font-size < 16px` (`text-sm` = 14px).
- **Fix Produksi:** Menetapkan `text-base sm:text-sm` (16px pada mobile) di:
  - `src/components/ui/command.tsx` (Command & Search input)
  - `src/components/collection/collection-modals.tsx` (Modal koleksi)
  - `src/components/komik/manga-collection-button.tsx` (Quick collection button)

### 2. Sinkronisasi Dinamis `theme-color` dengan Tema Aktual Yomirra
- **Gejala:** Ketika pengguna memilih mode gelap (Dark) di dalam Yomirra tetapi perangkat OS menggunakan Light Mode, status bar Safari tetap berwarna terang (#f8f6f1) karena meta tag statis hanya membaca media query OS.
- **Root Cause:** Meta tag `theme-color` statis di Next.js layout tidak diperbarui saat pengguna mengubah tema di level aplikasi.
- **Fix Produksi:** Menambahkan komponen `ThemeColorSync` di `src/components/providers/index.tsx` yang memantau `resolvedTheme` dari `next-themes` dan memperbarui meta tag `theme-color` secara dinamis ke `#090a0f` (Dark) atau `#f8f6f1` (Light).

### 3. Text Auto-Inflation pada Landscape Rotation
- **Gejala:** Saat perangkat diputar ke orientasi landscape, WebKit secara sepihak memperbesar ukuran teks paragraf.
- **Root Cause:** Root `html` belum mendeklarasikan `-webkit-text-size-adjust: 100%`.
- **Fix Produksi:** Ditambahkan pada `html` di `src/app/(web)/globals.css`.

### 4. Kalkulasi CSS Variable `--bottom-dock-height` di Paged Reader
- **Gejala:** Pada `paged-reader.tsx`, padding bawah dihitung menggunakan `calc(var(--bottom-dock-height)+var(--safe-bottom))`, namun token `--bottom-dock-height` tidak terdefinisi di CSS.
- **Root Cause:** Variabel CSS tanpa fallback menyebabkan evaluasi invalid saat runtime (0px padding), sehingga konten paged reader menabrak bottom dock / home indicator.
- **Fix Produksi:** Didefinisikan `--bottom-dock-height: var(--bottom-nav-content-height);` (64px) di `src/app/(web)/globals.css`.

### 5. Clamping Reading Progress Bar pada Safe Area 0px
- **Gejala:** Pada orientasi landscape atau tab browser tanpa top inset (safe-top = 0px), progress bar terpotong di posisi `-3px`.
- **Root Cause:** `top-[calc(var(--safe-top,0px)-3px)]` menghasilkan nilai negatif saat safe-top 0px.
- **Fix Produksi:** Menggunakan `top-[max(0px,calc(var(--safe-top,0px)-3px))]` di `src/components/reader/reader-shell.tsx`.

### 6. Drawer Rubber-Banding Defense
- **Gejala:** Scroll pada drawer chapter pembaca tembus ke halaman latar belakang saat mencapai batas atas/bawah.
- **Root Cause:** Kurangnya deklarasi `overscroll-behavior: contain`.
- **Temuan Teknis Penting:** Port WebKit desktop pada Windows tidak mengekspos properti `overscroll-behavior` pada `CSSStyleDeclaration` (mengembalikan `undefined`), sedangkan Safari iOS 16+ asli mendukungnya. Aturan `.overscroll-contain` didefinisikan secara eksplisit di `src/app/(web)/globals.css` dan kontainer drawer untuk perlindungan perangkat nyata.

### 7. Standalone PWA Detection
- **Fix Produksi:** Memperluas deteksi di `src/shared/hooks/use-pwa-install.ts` agar mendukung `display-mode: standalone`, `display-mode: fullscreen`, dan legacy Safari `(navigator as any).standalone`.

---

## 4. Rangkaian Pengujian Interaktif WebKit (`e2e/ios27-safari-regression.spec.ts`)

Pengujian otomatis mencakup 11 skenario interaktif:

1. **Meta Viewport & Theme:** Memverifikasi `viewport-fit=cover` dan keberadaan meta theme-color.
2. **Auto-Zoom Immunity:** Memverifikasi font size input >= 16px serta eksekusi klik dan pengisian query pencarian.
3. **VisualViewport Reduction:** Mensimulasikan keyboard virtual mobile (viewport height menyusut ke 520px) dan memastikan input tetap berada di area tampak tanpa terpotong.
4. **Orientation & Text-Inflation:** Menguji rotasi Portrait (393×852) dan Landscape (852×393), memverifikasi nol horizontal scroll overflow (`scrollWidth <= innerWidth`) dan `-webkit-text-size-adjust: 100%`.
5. **Dock & Header Collision:** Memastikan bottom dock terjangkar di visible viewport dan tidak bertabrakan dengan header sticky.
6. **Toolbar Collapse/Expand:** Menguji adaptasi bottom dock terhadap variasi tinggi viewport Safari (852px down to 732px).
7. **Overscroll Containment Defense:** Memverifikasi keberadaan aturan `overscroll-contain` pada bundle CSS aplikasi.
8. **Theme-Color Synchronization:** Memverifikasi meta tag `theme-color` tersinkronisasi ke nilai tema aktif Yomirra (`#090a0f` atau `#f8f6f1`).
9. **Accessibility Reduced Motion:** Menguji kepatuhan terhadap media query `prefers-reduced-motion: reduce`.
10. **Reader Token Availability:** Memverifikasi ketersediaan token runtime `--bottom-dock-height`.
11. **BrowserStack Cloud Gate:** Memastikan pengujian cloud diskip secara bersih ketika kredensial tidak tersedia di environment.

**Hasil Eksekusi:** `10 passed, 1 skipped` (BrowserStack skipped).

---

## 5. Konfigurasi BrowserStack Real-Device Playwright iOS

Konfigurasi cloud di `playwright.browserstack.config.ts` telah diselaraskan dengan spesifikasi resmi W3C BrowserStack:
- **Capability Object:** Menggunakan namespace resmi `bstack:options` mencakup `userName`, `accessKey`, `realMobile: "true"`, `deviceName`, `osVersion`, dan konfigurasi tunnel `local` / `localIdentifier`.
- **Target Browser:** `safari` dengan endpoint websocket CDP `wss://cdp.browserstack.com/playwright?caps=...`.
- **Credential Gate:** Jika `BROWSERSTACK_USERNAME` atau `BROWSERSTACK_ACCESS_KEY` tidak diset, eksekusi ditahan (`BLOCKED`) tanpa melakukan koneksi palsu.

Untuk mengeksekusi pengujian pada perangkat nyata via BrowserStack:
```bash
$env:BROWSERSTACK_USERNAME = "<bs-user>"
$env:BROWSERSTACK_ACCESS_KEY = "<bs-key>"
$env:BROWSERSTACK_DEVICE = "iPhone 15 Pro"
$env:BROWSERSTACK_OS_VERSION = "17"
npx playwright test --config=playwright.browserstack.config.ts
```

---

## 6. Ringkasan Status Rilis & Verifikasi

- **Local WebKit Emulation:** **DONE** (10 interactive regression tests PASS).
- **TypeScript Typecheck (`npm run typecheck`):** **DONE** (0 diagnostics emitted).
- **ESLint (`npm run lint`):** **DONE** (0 errors).
- **Vitest Full Suite (`npx vitest run`):** **DONE** (203 files passed, 1361/1361 tests passed).
- **Next.js Production Build (`npm run build`):** **DONE** (24 pages compiled, Serwist service worker bundled).
- **Cloud Real iOS (BrowserStack):** **BLOCKED** (Awaiting user credentials).
- **Physical Hardware iOS 27:** **NOT TESTED** (Belum ada pengujian perangkat fisik).
