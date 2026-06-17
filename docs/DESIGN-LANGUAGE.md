# Design Language

> Extend file — referenced from `AGENTS.md`.
> Baca ini sebelum task apapun yang involve estetika baru, visual identity, tone of voice, atau arah desain.
> Ini adalah "kenapa" di balik keputusan di `DESIGN-SYSTEM.md`.

---

## Visual Philosophy

> Prinsip utama yang mendasari semua keputusan desain di Yomirra.

**Tagline visual:** Native-like, Immersive, Premium

**Core principles:**
1. **Content First:** UI tidak boleh mendistraksi dari manga. UI harus mundur (*recede*) saat user membaca, dan muncul dengan mulus saat dibutuhkan. Reader overlay auto-hides on scroll, tap zone hanya center 40% layar.
2. **Native Feel:** Interaksi web terasa seperti aplikasi native iOS/Android — scroll snap, view transitions (CSS `view-transition-name`), bottom safe-area (`env(safe-area-inset-bottom)`), PWA fullscreen.
3. **Glass & Depth:** Glassmorphism (`backdrop-blur`) yang presisi untuk membedakan layer overlay (bottom nav, top nav, reader toolbar) dari konten tanpa membuat UI terasa padat atau kaku.
4. **High-Speed Entry:** Desain mengutamakan *resume speed* — user harus bisa kembali ke baca sebelumnya dalam ≤ 2 tap dari home.

---

## Aesthetic Direction

**Style:** Premium Dark-first, Glassmorphism, Minimalist
**Color identity:** Midnight Indigo — bukan black, bukan blue, tetapi indigo yang dalam dan sophisticated.
**Mood / vibe:** Sophisticated, Calm, Cutting-edge, Seamless

**Primary mode:** Dark (default dan `class="dark"` di `html`). Light mode didukung penuh, tetapi dark mode adalah pengalaman yang diprioritaskan untuk kenyamanan membaca.

---

## Color Palette Philosophy

**Palette name:** Midnight Indigo (Dark) / Clean Slate (Light)

**Dark mode character:**
- Base surfaces: `#05050A` → bukan murni hitam. Near-black dengan undertone indigo yang subtle.
- Accent: `#5E5CE6` — vibrant indigo, bukan biru terang. Memberikan identitas visual yang unik.
- Border: semua border mengandung tint indigo (`rgba(94, 92, 230, 0.2–0.6)`) untuk konsistensi warna.
- Glass: `rgba(17, 17, 34, 0.65)` — surface glass selalu mengandung undertone gelap untuk readability.

**Light mode character:**
- Base: `#FAFAFC` — slightly cool white, bukan putih polos.
- Accent: `#5856D6` — indigo yang sedikit lebih gelap untuk kontras di background terang.

**Forbidden colors:**
- `#000000` murni (terlalu harsh, eye strain di reading mode)
- Warna arbitrary yang tidak berasal dari token (`bg-[#1a2345]`)
- Warna semantik untuk keperluan estetika (misalnya, pakai merah hanya untuk destructive, bukan dekorasi)

---

## Brand Personality

**Adjectives:** Modern, Cepat, Intuitif, Premium, Immersive

**Tone of voice:**

| Konteks                  | Tone              | Contoh                                              |
| ------------------------ | ----------------- | --------------------------------------------------- |
| UI labels & headers      | Singkat, jelas    | "Library", "Terbaru", "Beranda"                     |
| CTA buttons              | Actionable        | "Mulai Membaca", "Lanjutkan Chapter 5", "Lanjut Baca" |
| Error messages           | Helpful, ramah    | "Gagal memuat chapter. Coba muat ulang."            |
| Empty states             | Mendorong         | "Library kamu masih kosong. Cari manga favoritmu."  |
| Confirmation dialogs     | Clear, non-alarmist | "Unduhan chapter akan dihapus dari perangkat ini." |

**Jangan pernah terdengar:**
- Kaku / robotic: "Error 500 — Internal Server Error"
- Menyalahkan user: "Anda melakukan kesalahan"
- Jargon teknis yang terekspos ke user
- Bahasa campuran yang inkonsisten (pilih Indonesia atau English, jangan mixed per konteks yang sama)

**Bahasa default UI:** Bahasa Indonesia (target audience Indonesia)

---

## Visual Patterns

| Elemen                   | Pattern                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Card style               | `rounded-2xl` atau `rounded-3xl`, border tipis glass (`border-border-glass`), shadow subtle hover |
| Button (CTA utama)       | Pill (`rounded-full`), bg accent, scale-down 0.95 saat active                                    |
| Button (secondary/ghost) | Rounded-md/full, tidak ada background kuat, cukup hover surface                                  |
| Icon style               | `@phosphor-icons/react` — Regular (default), Fill (active/selected state), Duotone (decorative)  |
| Image loading            | Skeleton → fade in smooth. Fallback placeholder saat error.                                      |
| Navigation bottom        | Glass dock — `backdrop-blur-xl`, border-t glass, safe area inset                                 |
| Navigation top (desktop) | Floating pill saat scroll (`bg-surface-glass backdrop-blur-xl border rounded-full`)              |
| Overlay/modal            | Scale-up dari 0.95 → 1, backdrop blur, rounded-3xl                                               |
| Reader toolbar           | Glass container, auto-hide on scroll, tap center 40% untuk toggle                                |

---

## Motion Language

**Overall vibe:** Smooth, Snappy, Seamless — animasi melayani konten, bukan menjadi pusat perhatian.

**Framework:** `motion/react` (Framer Motion 12.x) untuk animasi komponen. CSS View Transitions (`startViewTransition`) untuk navigasi antar halaman.

| Moment                       | Approach                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------- |
| Page enter                   | Fade + slide-y subtle via `<DirectionalTransition>` wrapper                       |
| View transition (nav)        | CSS `::view-transition` dengan nama group (fade-in, nav-forward, nav-back, morph) |
| Reader overlay toggle        | `transition-[transform,opacity] duration-150` — CSS transition, bukan Framer     |
| List items (stagger)         | `AnimatePresence` + stagger delay kecil                                           |
| Hover card                   | `scale-[1.025]` — sangat subtle                                                  |
| Modal/Overlay open           | Scale 0.95 → 1 + fade (`initial={{ opacity:0, scale:0.95 }}`)                   |
| Button press                 | `active:scale-[0.98]` via Tailwind                                                |
| Bottom nav tab switch        | `layoutId` AnimatePresence pill indicator                                         |
| Spring animations            | `type: "spring", bounce: 0.2, duration: 0.6` untuk nav underline                |

**View transition durations (globals.css):**
- Exit: 150ms
- Enter: 210ms
- Move/morph: 400ms

**Persistent elements (tidak ikut transition):** `persistent-top-nav`, `persistent-bottom-nav`, `persistent-side-nav` — diberi `animation: none` di view-transition-group agar tetap di posisi.

---

## Do / Don't

| ✅ DO                                                                      | ❌ DON'T                                                                 |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Gunakan `backdrop-blur` pada elemen sticky/fixed (navbar, bottom nav)      | Solid color tanpa transparansi di navbar/bottom nav                     |
| Tambahkan `aria-label` di setiap icon button                               | Icon button tanpa label aksesibilitas                                   |
| Handle safe area bottom untuk iOS PWA (`var(--bottom-nav-height)`)         | Taruh clickable content di ujung bawah layar tanpa padding              |
| Konfirmasi destructive action via Dialog, bukan `confirm()`                | Gunakan `window.confirm()` atau `window.alert()` di production          |
| Gunakan token CSS variable untuk warna (e.g. `text-text-primary`)          | Gunakan arbitrary color Tailwind (`text-[#FDFDFD]`)                    |
| Gunakan `motion-safe:` guard untuk animasi besar                           | Paksa animasi besar tanpa reduced-motion fallback                       |
| Samakan ukuran cover image dengan aspect-ratio [2/3] (manga standard)      | Biarkan cover gambar tanpa fixed aspect-ratio (menyebabkan layout shift) |

---

## Anti-patterns

- **Murni hitam `#000000`** untuk background — terlalu keras, eye strain saat membaca lama.
- **Menampilkan stack trace atau error teknis** ke end-user. Selalu tampilkan pesan yang ramah.
- **Modal third-party berat** — gunakan Radix Dialog atau solusi custom yang sesuai design system.
- **Inline style warna** — kecuali nilai dinamis yang tidak bisa di-handle Tailwind (contoh: `viewTransitionName`, `backgroundColor` untuk reader background preset).
- **Multiple icon libraries** — satu project, satu library: Phosphor Icons.
- **Glass effect berlebihan** — blur di setiap elemen membuat halaman terasa berat. Gunakan hanya pada elemen floating/sticky.

---

*Last updated: 2026-06-17*
