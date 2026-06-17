# UX Guidelines

> Extend file — referenced from `AGENTS.md`.
> Baca ini sebelum task apapun yang involve user flow, interaksi, layout, atau behavior.
> Untuk detail gesture model reader, lihat `docs/ux-architecture.md`.

---

## Responsive Strategy

**Approach:** Mobile-first — base styles untuk mobile, gunakan breakpoint untuk screen lebih besar.

| Breakpoint | Min Width | Target                                       |
| ---------- | --------- | -------------------------------------------- |
| `base`     | 0px       | Mobile (default) — primary target            |
| `sm`       | 640px     | Large mobile / small tablet                  |
| `md`       | 768px     | Tablet — layout bifurcation point            |
| `lg`       | 1024px    | Desktop — full nav + sidebar reader          |
| `xl`       | 1280px    | Large desktop                                |
| `2xl`      | 1536px    | Extra large                                  |

**Primary target device:** Mobile (Web App, PWA-capable)
**Minimum supported screen width:** 320px
**Layout approach:**
- Mobile: Single column, `YomirraBottomDock` navigation, reader in fullscreen
- Desktop: TopNav, grid layout, reader with sidebar settings panel (`md:pr-[320px]`)
**Layout breakpoint:** `md` (768px) — `hidden md:flex` / `hidden md:block` untuk switching nav

---

## Browser & Device Support

| Browser        | Min Version | Notes                               |
| -------------- | :---------: | ----------------------------------- |
| Chrome         | 111+        | View Transitions API support        |
| Safari         | 15+         | `dvh` + safe area support           |
| Firefox        | 110+        | Partial View Transitions (fallback) |
| Edge           | 111+        | Chromium-based, full support        |
| Safari iOS     | 15+         | PWA safe area handling              |
| Chrome Android | 111+        | WakeLock API support                |

**Known quirks yang harus di-handle:**
- Safari: gunakan `min-h-screen` (100dvh fallback) — sudah di-handle via `globals.css`
- Safari iOS: tambahkan `overscroll-behavior: none` di reader agar tidak mengganggu scroll snap
- iOS PWA: gunakan `env(safe-area-inset-bottom)` untuk bottom padding — sudah via `--bottom-nav-height` token
- Firefox: `::view-transition` tidak didukung sepenuhnya — animasi fallback ke instant

---

## Navigation Architecture

**Primary navigation (Desktop, ≥md):** `<TopNav>` — fixed, glassmorphism, auto-morph ke floating pill saat scroll > 30px
**Mobile navigation:** `<YomirraBottomDock>` — fixed bottom, glass surface, safe-area-aware
**Active state indicator:**
- Bottom dock: `layoutId` animated pill via Framer Motion (AnimatePresence)
- Top nav: `layoutId="nav-underline"` animated underline via Framer Motion spring
**Breadcrumbs:** Tidak digunakan (navigasi flat)
**Back navigation:**
- Browser native back (didukung View Transitions)
- Explicit back button di reader overlay (`<IconButton>` → router.push mangaDetail)
- Settings modal close: tombol X + Escape + backdrop click

**Global search trigger:**
- Desktop: `⌘K` / `Ctrl+K` keyboard shortcut → dispatch `CustomEvent('open-command-menu')`
- Desktop: Click search pill di TopNav
- Mobile: Icon button di top area halaman
- **Pattern:** Event dispatch, bukan prop drilling atau router redirect. Command menu (`cmdk`) menerima event ini.

---

## Loading States

> Setiap async operation harus punya feedback visual yang jelas.

| Pattern              | Kapan                                                        |
| -------------------- | ------------------------------------------------------------ |
| **Skeleton screen**  | Initial load manga list, manga detail page, source discovery |
| **Spinner**          | Action loading: sync button, zip download, submit action     |
| **Image skeleton**   | Semua cover manga — blur in dari placeholder                 |
| **Optimistic UI**    | Bookmark/unbookmark manga, tambah/hapus dari library         |
| **Progress bar**     | Chapter download (per-page progress di download button)      |
| **Toast (loading)**  | ZIP chapter download — `toast.loading()` dengan progress update |

**Rules:**
- Minimalisasi CLS (Cumulative Layout Shift) dengan skeleton yang ukurannya persis dengan hasil akhir.
- Skeleton harus sama lebar/tingginya dengan konten actual — pakai `aspect-[2/3]` untuk manga cover.
- Komponen yang depend pada Zustand persist wajib ada hydration guard (`useMounted`) — render skeleton sampai state terhidrasi dari IndexedDB.
- Delay skeleton 200ms jika request sangat cepat (hindari flash of skeleton).

---

## Error States

| Tipe Error             | Pattern                              | Action                  |
| ---------------------- | ------------------------------------ | ----------------------- |
| Form validation        | Inline error di bawah field + border | Fix dan resubmit        |
| API error (recoverable)| Toast via `sonner` (`toast.error()`) | Retry / dismiss         |
| API error (fatal)      | Inline error section di halaman      | Retry / reload / home   |
| 404                    | Custom `not-found.tsx` page          | Back / home             |
| 500                    | Error boundary / `error.tsx`         | Reload                  |
| Network offline        | NetworkStatus banner                 | Auto-dismiss saat online|
| Image load fail        | Muted placeholder, retry tap         | Tap untuk refetch       |

**Pesan error rules:**
- Jangan expose technical error ke user: `"Gagal memuat chapter"` ✅, `"Failed to fetch /api/..."` ❌
- Error message harus menjelaskan apa yang terjadi + apa yang bisa dilakukan user.
- Error dari API route yang dikonsumsi `ApiClient`: ambil `error.message` dari response envelope — sudah human-readable.

---

## Empty States

> Setiap list, tabel, atau feed harus punya empty state. Jangan biarkan area kosong melompong.

**Komponen empty state:** Gunakan `src/components/states/` untuk reusable empty state, atau compose inline.
**Isi minimal:** Icon/Ilustrasi + Judul + Deskripsi 1 kalimat + CTA button/link

| Konteks              | Judul                        | CTA                      |
| -------------------- | ---------------------------- | ------------------------ |
| Library kosong       | "Library kamu masih kosong"  | "Cari Manga"             |
| No search results    | "Tidak ada hasil"            | "Coba kata kunci lain"   |
| History kosong       | "Belum ada riwayat bacaan"   | "Mulai membaca"          |
| Downloads kosong     | "Belum ada unduhan"          | "Unduh chapter manga"    |
| Updates kosong       | "Tidak ada update terbaru"   | "Tambah manga ke Library" |

---

## Toast / Notification

**Library:** `sonner` — `<Toaster>` di-mount di root layout
**Position:** `bottom-center`
**Duration default:** 3000ms

| Type           | Kapan                                          | Duration | Impl.                           |
| -------------- | ---------------------------------------------- | -------- | ------------------------------- |
| `toast.success`| Action berhasil (add to library, sync done)   | 3s       | `toast.success("Pesan")`        |
| `toast.error`  | Action gagal                                   | 5s       | `toast.error("Pesan")`          |
| `toast.info`   | Informasi netral (resume download)             | 3s       | `toast.info("Pesan")`           |
| `toast.loading`| Action sedang berjalan (zip download, sync)    | Manual   | `toast.loading("Pesan", {id})`  |
| `toast()`      | Neutral / brief (download dijeda)              | 3s       | `toast("Pesan")`                |

**Update loading toast:**
```ts
toast.loading("Mempersiapkan...", { id: "zip-dl" });
// lalu:
toast.success("Selesai!", { id: "zip-dl", duration: 4000 });
// atau:
toast.error("Gagal: ...", { id: "zip-dl", duration: 5000 });
```

---

## Modal & Dialog

**Library:** Radix UI Dialog primitive via `@/components/ui/dialog`
**Close triggers:** Backdrop click + tombol X + tekan `Escape`
**Scroll lock:** Body di-lock saat modal terbuka (Radix handle otomatis)
**Animation:** Scale 0.95 → 1 + fade via Framer Motion
**Styling standard:**
```tsx
<DialogContent className="max-w-sm rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl border border-border-default shadow-heavy">
```

**Destructive confirmation dialog pattern:**
```tsx
// Selalu gunakan Dialog untuk konfirmasi destructive action — bukan window.confirm()
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

<Button onClick={() => setIsDeleteDialogOpen(true)}>Hapus</Button>
<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Hapus [Resource]?</DialogTitle>
      <DialogDescription>[Apa yang akan terjadi].</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
      <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>Hapus</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Form Patterns

**Submit button:** Disabled selama form invalid atau sedang submit.
**Success:** Clear form + feedback toast/redirect — tergantung konteks.
**Validation:** Client-side dengan Zod (kalau ada) atau native validation.
**Error display:** Inline di bawah field, bukan di atas atau hanya di toast.

---

## Interaction & Animation

**Hover:** `scale-[1.025]` untuk elemen clickable card/item (sangat subtle).
**Active/Press:** `active:scale-[0.98]` atau `active:scale-95` — depends on element size.

**Transitions:** 
- Route transitions: CSS View Transitions (`startViewTransition`) via `next/navigation` + Next.js `experimental.viewTransition`.
- Component enter/exit: `motion/react` `AnimatePresence`
- Reader overlay: CSS transition `duration-150` — fast, tidak ganggu reading experience

**Directional navigation (View Transitions):**
- Forward/deeper (manga detail, chapter): `nav-forward` class → slide ke kiri
- Back (history, close): `nav-back` class → slide ke kanan
- Root nav switch (tab bar): `fade-in` / `fade-out` simple fade

**Reduced motion:**
- Tailwind: `motion-safe:animate-spin` — animasi hanya jika user tidak mematikan motion
- Global: `@media (prefers-reduced-motion: reduce)` sudah di-handle di `globals.css` — menghilangkan semua duration
- Framer: gunakan `useSafeMotion()` hook (`src/shared/hooks/use-safe-motion.ts`) sebelum animasi besar

---

## Reader-Specific UX

> Detail: `docs/ux-architecture.md`

**Entry experience:** Home → "Lanjut Baca" → Reader (≤ 2 tap)
**Overlay toggle:** Tap center 40% layar (≤ 10px movement, ≤ 250ms) → toggle overlay
**Auto-dismiss:** Scroll > 10px → langsung sembunyikan overlay (rAF throttled)
**Keyboard shortcuts (desktop):** `Escape` atau `m`/`M` → toggle overlay
**Keep screen awake:** WakeLock API saat reader aktif (jika user setting ON)
**End of chapter:** Tombol navigasi ke chapter berikutnya — bukan auto-append (arch decision)

---

## Accessibility Standards

**Target:** WCAG 2.1 Level AA (minimum)

| Check           | Requirement                                                               |
| --------------- | ------------------------------------------------------------------------- |
| Touch targets   | Min 44×44px untuk semua elemen tappable di mobile                        |
| Focus order     | Logical, mengikuti visual order. Tidak ada random tabindex.              |
| Focus visible   | Custom `:focus-visible` style — tidak dihapus, tidak hanya `outline: none` |
| Images          | `alt` deskriptif untuk gambar informatif. `alt=""` untuk gambar dekoratif |
| Icon buttons    | `aria-label` WAJIB di setiap `<IconButton>` tanpa visible label          |
| Modals          | Focus trap + Escape to close (Radix handle otomatis)                     |
| Dialogs         | `<DialogTitle>` + `<DialogDescription>` wajib ada                        |
| Color contrast  | Min 4.5:1 untuk text normal, 3:1 untuk large text                        |
| Reduced motion  | Semua animasi besar respek terhadap `prefers-reduced-motion`             |

---

## Responsive Specific Rules

- `hidden md:flex` / `md:hidden` — gunakan untuk switch antara mobile dan desktop layout
- Bottom nav: hanya di mobile (`md:hidden`). Desktop: top nav (`hidden md:flex`)
- Safe area bottom: selalu tambahkan `pb-[var(--page-bottom-safe)]` atau `mb-[var(--bottom-nav-height)]` pada konten utama di mobile
- Grid collapse: mobile → single column, tablet → 2 col, desktop → 3-4 col untuk manga grid
- Reader: mobile → fullscreen, desktop → `md:pr-[320px]` untuk settings panel sidebar

---

*Last updated: 2026-06-17*
