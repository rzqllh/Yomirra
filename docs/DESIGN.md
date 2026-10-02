# Yomirra Design Specification

> **Status:** Living design specification
> **Version:** 0.1 — foundation pass
> **Date:** 2026-09-28
> **Scope:** Information architecture, design language, interaction logic, reusable UI system, responsive behavior, search/source model, library/bookcase semantics, downloads, settings, comic detail, and reader experience.
>
> This document is the design source of truth for Yomirra. It is intentionally more specific than a visual style guide: it defines what each page is for, which data belongs there, how source aggregation and normalization behave, how repeated UI is composed, and which decisions are locked versus still open.

---

## 0. Decision labels

Use these labels while the product is still being refined:

- **LOCKED** — explicitly established in product discussion; implementation should follow it unless new evidence requires reopening it.
- **RECOMMENDED** — proposed design direction supported by current product logic and external reader patterns; confirm before production implementation if it changes existing behavior materially.
- **OPEN** — intentionally unresolved. Do not silently invent behavior in code.

The point of these labels is to stop visual work from accidentally deciding product behavior.

---

# 1. Product definition

Yomirra is a multi-source comic reader and discovery application. It is not a simple website wrapper around multiple comic providers and it is not a conventional single-catalog reader.

Its distinguishing product model is:

1. Multiple providers can expose the same comic.
2. Yomirra should normalize equivalent titles into one work whenever possible.
3. Users choose which sources participate in their everyday discovery experience.
4. Global Search remains the escape hatch that can access all available sources.
5. Reading progress, bookmarks, history, downloads, and personal state belong to the user, not to a provider.

The UI therefore must keep three concepts separate:

- **Work / title** — the comic the user thinks about, e.g. `Nano Machine`.
- **Provider / source** — where a copy of that comic is available, e.g. Shinigami or Komikindo.
- **Personal state** — whether the user is reading, bookmarked, has progress, or has downloaded chapters.

Provider mechanics must not dominate normal browsing. The system should expose them when they matter and stay out of the way when they do not.

---

# 2. Research basis: what a mature comic reader normally separates

This spec was checked against current patterns from mature comic-reader products and documentation, especially Mihon, Komikku, and WEBTOON.

Key findings:

- Mature readers distinguish **browsing sources**, **personal library**, **global search**, **downloads**, and **reader settings** instead of collapsing them into one generic catalog.
- Mihon explicitly provides global search across sources, while normal source browsing remains source-scoped.
- Mihon and Komikku treat the reader as a first-class experience with per-series reading-mode overrides, paged and long-strip modes, page navigation, crop/scale controls, and persistent reading preferences.
- Komikku supports merging equivalent entries from different sources. That validates Yomirra's normalization direction, but Yomirra should present the merged work as the primary object rather than exposing duplicate provider entries by default.
- WEBTOON separates discovery/search from the user's saved/subscribed space and treats downloads as a dedicated personal utility.
- Mature reader implementations also avoid unnecessary bulk source requests because excessive network requests can be expensive, slow, or trigger provider-side protection.

Research references consulted:

- Mihon — Getting Started
- Mihon — Reader Settings
- Mihon — Library FAQ
- Mihon — Source Migration
- Mihon — 2026 changelogs
- Komikku — Getting Started and project README
- WEBTOON Help — Search/Home/My changes and Downloads

These products are references, not visual templates. Yomirra should keep its own interaction model and identity.

---

# 3. Core information architecture

## 3.1 User-intent ladder

The main pages correspond to different levels of intent:

| Page | User intent | Primary question |
|---|---|---|
| **Beranda** | passive discovery + resume | "Apa yang menarik dan apa yang mau gue lanjutkan?" |
| **Library** | everyday browsing | "Apa yang tersedia dari sumber yang sudah gue pilih?" |
| **Cari** | explicit global lookup | "Komik ini ada di mana?" |
| **Populer** | popularity-led discovery | "Apa yang sedang populer dari sumber pilihan gue?" |
| **Rak Buku** | personal reading state | "Apa yang sedang gue baca / simpan?" |
| **Sumber** | provider personalization + diagnostics | "Sumber apa yang mau ikut pengalaman harian gue dan apakah sumbernya sehat?" |
| **Unduhan** | offline content management | "Apa yang tersimpan di perangkat gue?" |
| **Pengaturan** | preferences and data management | "Bagaimana Yomirra bekerja untuk gue?" |

This distinction is fundamental. Pages may reuse the same card primitives, but they must not feel like duplicated routes with different labels.

---

# 4. Source model

## 4.1 Source inclusion behavior

**LOCKED**

The toggle on the **Sumber** page controls whether that source participates in the user's everyday discovery surfaces:

- ON → included in **Beranda** discovery.
- ON → included in **Library**.
- ON → included in **Populer**.
- OFF → excluded from **Beranda**, **Library**, and **Populer**.
- Search remains able to access the source regardless of this toggle, as long as the source is runtime-enabled, installed, available, and supports Search.

User preference and system eligibility are separate. A source may remain selected by the user while temporarily unavailable or disabled by runtime configuration; the UI must not present that as healthy participation.

Therefore the generic label `Enabled` is semantically wrong. OFF does **not** mean the provider has been disabled from Yomirra.

### Preferred UI terminology

**LOCKED**

Use contextual discovery copy:

- `Tampil di Beranda, Library & Populer`
- `Disembunyikan dari penjelajahan`
- `Tidak tersedia untuk penjelajahan` when runtime/system eligibility prevents participation

Avoid:

- `Enabled`
- `Sumber Aktif`
- `Aktif`

because those terms collide with health/availability status.

## 4.2 Source health is independent

A source needs a separate health model:

- `checking`
- `online`
- `degraded`
- `offline`
- `unknown`

A source can be:

- included + online
- included + degraded
- included + offline
- excluded + online
- excluded + degraded
- excluded + offline

Never infer health from the discovery inclusion toggle.

### Health display rules

- **Online** — green semantic state; recent successful request(s).
- **Degraded** — soft amber state; partial capability failure, abnormal latency, intermittent failures, or reduced success rate.
- **Offline** — semantic error state; current request(s) cannot be completed.
- **Checking** — neutral progress state.
- **Unknown** — neutral; not enough data to make a health statement.

Do not display `Online` next to `0%` and `fetch failed`. If the health computation cannot reconcile those values, the health model is wrong, not the styling.

## 4.3 Source capability model

Capabilities may include:

- Popular
- Latest
- Search
- Detail
- Chapters
- Pages
- Filters

Capability chips are diagnostics, not primary content. They should remain low-emphasis and consistent across source cards.

## 4.4 Source names

**LOCKED DESIGN RULE**

Never expose raw source IDs as user-facing names when a display name exists.

Examples:

- `ASURASCANS` → `Asura Scans`
- `KOMIKU-II` → `Komiku II`
- `SHINIGAMI` → `Shinigami`

Raw IDs are allowed only in developer/debug surfaces.

---

# 5. Normalization and merged works

## 5.1 Primary object

**LOCKED**

Library and Search must normalize equivalent comics across sources.

The user should primarily see one work, not a wall of provider duplicates.

Conceptually:

```text
NormalizedWork
  identity
  canonical title
  alternate titles
  cover candidates
  metadata
  provider offers[]
  personal state
```

A provider offer contains provider-specific values such as:

- provider/source
- provider entry ID / URL
- latest chapter
- language
- status
- update time
- provider health
- provider-specific cover/description

## 5.2 Normalization rules

Normalization must not rely on title lowercase equality alone.

Use a confidence model based on the strongest available signals:

1. stable external/canonical IDs when available;
2. normalized title + alternate titles;
3. author/artist overlap;
4. type and language compatibility;
5. metadata similarity;
6. conservative fuzzy-title matching only as a fallback.

False merging is worse than a visible duplicate. If confidence is insufficient, keep entries separate.

Do not silently merge two different works simply because titles resemble each other.

## 5.3 Merged card behavior

A merged card represents the work.

It may expose compact provider information such as:

- `3 sumber`
- latest known chapter
- preferred/current provider

Do not place a row of provider logos on every catalog card unless it materially helps the user. Provider detail belongs in the detail view or source-picker context.

## 5.4 Provider resolution after a merged work is opened

**RECOMMENDED — confirm before implementation if current behavior differs**

Library should not force a provider-selection modal on every title click. That would make Library behave like Global Search.

Suggested resolver order:

1. last provider used by this user for this title;
2. otherwise a healthy included provider with the most appropriate available chapter;
3. otherwise the next healthy candidate;
4. if no candidate can be resolved, show provider selection / recovery UI.

The detail page should still expose a visible `Ganti sumber` action when multiple providers exist.

Search can be more explicit about provider choice because choosing among providers is part of its purpose.

---

# 6. Global shell

## 6.1 Desktop shell

Desktop uses:

- fixed left navigation rail/sidebar;
- top application bar;
- independent main content scroll;
- no nested full-page scrolling unless a specific internal panel requires it.

The Next.js development indicator is not part of the product UI.

## 6.2 Sidebar

Primary group:

- Beranda
- Library
- Rak Buku
- Cari
- Populer

Secondary group:

- Sumber
- Unduhan
- Pengaturan

Active navigation must have one canonical style.

Recommended active state:

- neutral/white selected surface;
- subtle border;
- accent-colored icon and/or small accent marker;
- no heavy red outline as a normal selected state.

A thick outline is reserved for `focus-visible`, not selection.

## 6.3 Top bar

Top bar responsibilities:

- compact breadcrumb/location context;
- global search launcher where appropriate;
- notifications;
- theme/action controls;
- profile/avatar.

Top bar should not become a second page toolbar.

---

# 7. Search architecture

Search is currently the most important interaction to formalize because Yomirra has local catalog search, global source search, and a header search affordance.

## 7.1 Three different search intents

They must remain distinct.

### A. Library local search

Searches the already constructed Library catalog from sources included by the user.

It is a local/filtering intent.

Recommended placeholder:

`Cari di Library…`

Do not use `Cari di rak bacaan…` because `Rak Buku` is a separate personal domain.

### B. Global Search page

Searches provider catalogs across all available sources or an explicit subset selected by the user.

Recommended placeholder:

`Cari judul, alternatif judul, atau kreator…`

Shorter version is acceptable on compact screens:

`Cari komik…`

### C. Header global search launcher

**RECOMMENDED**

The header control should be a launcher/command affordance, not a page-local text field.

Example:

`⌕ Cari komik…        ⌘K`

Behavior:

- click opens a lightweight global-search/command surface;
- typing provides recent searches and fast title suggestions when available;
- submit navigates to `/search?q=...`;
- it never silently filters the current page;
- on `/search`, `⌘K` focuses the main Search input instead of opening a redundant second search UI.

On Library, the header launcher and Library's own search can coexist because their scope is different.

## 7.2 Search page initial state

**LOCKED PRODUCT LOGIC + RECOMMENDED NETWORK BEHAVIOR**

When the Search page opens:

- all source definitions are available to the page;
- all sources are eligible by default;
- the page must not automatically fire expensive catalog searches against every provider before a query exists.

Distinguish **loading the source registry** from **querying every source**.

Default source scope should read as `Semua sumber`.

Do not show `1 dari 7 sumber dipilih` while the actual behavior is “search all seven”.

## 7.3 Source scoping in Search

Source chips are a query scope control, not decorative filters.

Recommended structure:

```text
Cari dari
[Semua sumber] [Shinigami] [Komikindo] [MangaDex] ...
```

Rules:

- `Semua sumber` selected by default.
- Selecting one or more named sources removes `Semua sumber` state.
- Re-selecting `Semua sumber` clears the custom subset.
- If the user has already entered a query, changing scope should rerun only the relevant provider requests.
- Selected state must be visually distinct but not confused with destructive red.

## 7.4 Search execution

Recommended request lifecycle:

1. Debounce only where it is useful; do not fire on every keystroke if adapters are expensive.
2. Prefer explicit submit for expensive global requests, with optional short idle debounce for suggestions.
3. Query selected providers concurrently with a sensible concurrency cap.
4. Apply per-provider timeout and independent failure handling.
5. Render successful results progressively; do not wait for the slowest provider.
6. Normalize/merge results as they arrive.
7. Preserve failed-provider state separately.

One source failure must not collapse the whole search.

## 7.5 Search result states

Search needs deliberate states:

- initial/no query;
- searching;
- partial results while providers continue;
- complete results;
- zero results;
- partial source failure;
- all source failure;
- offline;
- invalid query / too short where relevant.

Example partial status copy:

`18 judul ditemukan · 6 dari 7 sumber selesai`

If one source fails:

`Hasil dari 6 sumber ditampilkan. MangaDex gagal dimuat.`

Do not block valid results behind one error banner.

## 7.6 Search normalization UX

If a normalized work has multiple provider offers, the card stays single.

When provider choice is useful, surface it deliberately:

- `Tersedia di 3 sumber`
- source chooser on open/detail
- health / chapter availability in the chooser

The current `Pilih sumber` modal is a valid pattern, but it must obey the active Search scope. A provider excluded by the current query scope must not appear in that picker for the result context unless the user explicitly asks to broaden the search.

## 7.7 Tag-aware and semantic search

**LOCKED**

Search supports explicit filter tags in the main query field.

Examples:

- `solo leveling #fantasy`
- `romance sekolah #completed #manhwa`

Rules:

- `#tag` is a power-user shortcut, not a required syntax.
- Recognized tags become deterministic filters and are removed from the text sent to provider title search.
- Indonesian aliases and clear typos may resolve to one canonical tag.
- Ambiguous short fragments are suggested, never silently guessed.
- Canonical filters map back to each provider's native filter value.
- A provider that cannot satisfy an explicit tag is skipped for that query rather than searched without the constraint.
- Explicit tags are hard constraints. Semantic similarity must not override them.

Search ranking is hybrid:

1. exact and alternate-title matches;
2. lexical/fuzzy similarity;
3. semantic similarity when configured;
4. provider/catalog order as fallback.

Exact title matches must remain ahead of semantic-only matches.

Semantic indexing is opportunistic. Yomirra indexes public comic metadata encountered during normal use; it does not crawl every provider solely to build an AI index. The semantic layer must fail open: if the embedding provider or catalog cache is unavailable, normal multi-source search continues to work.

Related-title recommendations may use semantic similarity when enough indexed metadata exists, then fall back to deterministic genre/popular recommendations.

---

# 8. Page frame and content lanes

**LOCKED**

Ordinary destination pages share one canonical outer page frame. Route changes must not visibly resize the whole content canvas.

The outer frame owns:

- the same left/right edges beneath desktop chrome;
- `px-4 / md:px-8 / xl:px-10` responsive gutters;
- mobile-header safe spacing;
- page-bottom spacing;
- no nested full-page scroll.

This applies to Beranda, Library, Cari, Rak Buku, Populer, Sumber, Unduhan, and Pengaturan.

## 8.1 Inner content lanes

Narrower content is an **inner composition decision**, not a different route width.

Canonical inner lanes:

- `full` — catalog/discovery surfaces that benefit from the available canvas;
- `management` — structured forms/settings where line length and card width need restraint;
- `focused` — utilities such as download/storage tasks and backup flows.

`PageContainer` owns the canonical outer frame. `ContentLane` may constrain a specific inner block while preserving the route's outer alignment.

Do not use a narrower `PageContainer` to make an entire destination page jump inward.

## 8.2 Page usage

- **Beranda / Library / Cari / Rak Buku / Populer** — full outer frame; content uses the full lane unless a component has its own density rule.
- **Sumber** — full outer frame; source guidance, search, and source grid share one edge.
- **Unduhan** — full outer frame with a focused inner lane for storage/task content.
- **Pengaturan** — full outer frame with a management inner lane and explicit two-column desktop stacks.

The desktop TopNav breadcrumb already provides destination context. Sumber, Unduhan, and Pengaturan therefore keep the shared fixed mobile `PageHeader` but suppress the redundant desktop title banner.

---

# 9. Heading hierarchy

Yomirra legitimately needs more than one heading pattern. The problem is not variety; it is accidental variety.

## 9.1 Page heading patterns

### Dashboard title

For pages where the content immediately establishes context.

Example: Beranda.

Use:

- simple page title;
- no decorative icon well unless it provides meaning.

### Management destination

For configuration/utility pages such as Sumber, Unduhan, and Pengaturan:

- mobile uses the shared fixed `PageHeader` with icon, title, and compact subtitle;
- desktop uses TopNav/breadcrumb context and starts directly with the functional content;
- do not add a second desktop title banner below TopNav;
- management/focused width, when needed, belongs to an inner `ContentLane`, not the whole route frame.

### Task-first page

For pages where a strong toolbar/tab is the functional anchor.

A giant duplicate H1 is optional and often unnecessary.

Applies to:

- Cari
- Library
- Rak Buku

### Section heading

Use the small accent dot + section title for page subsections such as:

- Lanjut Baca
- Populer

Do not use it as a page-level title.

## 9.2 Mobile page chrome

**LOCKED**

All ordinary mobile pages use the same fixed `PageHeader` chrome and reserve its height in the page container.

Exceptions:

- comic detail may be transparent at the top and gain the shared chrome surface after scrolling;
- reader uses focused reader chrome.

Do not recreate mobile headers with page-local title/action rows. The notification bell opens its compact dropdown first; the full Pembaruan page is a secondary action from that dropdown.

The status-bar blur is clipped to the safe-area strip only. It must not soften page content below the system status bar.

---

# 10. Beranda

## Purpose

Beranda adalah pembuka ringkas untuk pencarian, discovery, dan kembali membaca. Prioritas visualnya adalah konten komik, bukan banner dekoratif.

## Structure

1. Hero kompak
2. Sorotan & peringkat
   - Sorotan terbaru
   - Peringkat Top 5 per sumber
3. Lanjut Baca
4. Baru diperbarui

Spotlight selalu mendahului peringkat dalam urutan konten. Pada lebar di bawah 1024px keduanya ditumpuk; mulai 1024px keduanya dapat tampil berdampingan.

## Home Hero

`HomeHero` adalah utility opening surface, bukan featured-content card.

Kontrak:

- tinggi desktop sekitar 210–230px;
- heading utama: `Mau baca apa hari ini?`;
- eyebrow kontekstual membedakan pengguna baru dan pengguna yang kembali;
- entry global search tetap memakai shared global-search behavior;
- artwork hanya dekoratif: 2–3 cover di desktop dan sekitar 1–2 cover di mobile;
- pemilihan cover stabil selama browser session dan tidak diacak ulang pada navigasi normal;
- artwork tidak memiliki skeleton sendiri dan tidak boleh memblokir heading/search;
- kegagalan artwork menghasilkan Hero cream yang tetap terasa selesai, bukan broken state;
- hindari glow, parallax, looping motion, glassmorphism, dan dekorasi yang mengalahkan search.

## Sorotan terbaru

Sorotan berasal dari feed terbaru, bukan kurasi manual. Label yang benar adalah `SOROTAN TERBARU`.

Selection contract:

1. ambil maksimal satu item eligible per sumber lebih dulu;
2. isi slot tersisa setelah diversity pass;
3. maksimal lima item;
4. dedupe lintas sumber hanya ketika identity confidence cukup kuat; title-only equality tidak cukup.

Desktop memakai landscape editorial composition sekitar 330–360px. Cover tetap terbaca sebagai cover vertikal lengkap, sementara ambient art dari cover yang sama hanya memberi atmosfer ringan.

Mobile memakai komposisi kompak cover-kiri/content-kanan; jangan kembali ke poster vertikal besar sebelum teks.

Source ditampilkan sebagai metadata inline dengan display name. Raw source ID tidak boleh menjadi copy normal.

Interactive targets tetap eksplisit: cover, title, CTA `Lihat komik`, dan kontrol carousel. Seluruh card tidak dibungkus menjadi satu giant link.

## Spotlight carousel

- interval autoplay: 6 detik;
- manual next/previous/swipe mereset interval;
- pause saat hover, focus berada di dalam Spotlight, touch interaction aktif, atau document hidden;
- `prefers-reduced-motion` mematikan autoplay;
- container tidak bergeser; hanya content/artwork yang berubah dengan opacity + translate kecil sekitar 6–10px;
- motion harus tenang, tanpa bounce/scale-up/spring dramatis.

## Ranking card

Ranking tetap source-scoped. Posisi numerik dari beberapa sumber tidak dianggap satu ranking global.

- selector sumber memakai display name dan tetap sekunder secara visual;
- Top 5 selalu terlihat, termasuk di mobile;
- rank #1 hanya mendapat emphasis ringan: cover sekitar 48px, title sedikit lebih kuat, dan angka `01` lebih menonjol;
- rank #2–#5 tetap row kompak;
- tidak ada podium, medal, atau gamification tambahan;
- `Lihat semua` mempertahankan source context menuju listing populer sumber yang sedang dipilih.

## Vertical rhythm

- Hero → sekitar 32px → Sorotan & peringkat;
- Sorotan & peringkat → sekitar 40–48px → Lanjut Baca.

Jarak yang lebih besar sebelum Lanjut Baca menandai transisi dari discovery menuju konten personal.

## Lanjut Baca

Uses `ReadingCard` rather than the catalog card.

Show:

- cover;
- title;
- source only if operationally useful;
- current chapter;
- progress;
- primary continue action;
- overflow actions.

Avoid redundant metadata that does not help continuation.

---

# 11. Library

## Purpose

**LOCKED**

Library is the user's everyday catalog built from sources included on the Sumber page.

It is not the user's personal saved collection. That role belongs to Rak Buku.

## Data scope

- only sources participating in everyday discovery (Beranda, Library, and Populer);
- normalized/merged across those sources;
- source failures degrade the catalog gracefully rather than crashing the page.

## Recommended structure

1. Library toolbar
   - local search
   - optional filter
   - view toggle
2. Sort + content-format filters
3. Result summary when useful
4. normalized catalog grid/list

## Search

Library search is local to the Library catalog.

Preferred placeholder:

`Cari di Library…`

## Filters

Format chips may include:

- Semua format
- Manga
- Manhwa
- Manhua

Do not hard-code formats as presentation if the underlying source metadata cannot support them reliably. Unknown remains a valid metadata state.

Search and Library use the same filter-drawer shell. On mobile the drawer opens at a compact half-height snap point and expands toward full height when the user scrolls or drags upward.

Provider-specific duplicate labels, catch-all values, and compound genre aliases should be normalized before presentation. Keep the provider's raw value only for the outgoing adapter payload.

## Cards

Use `CatalogCard`.

Merged duplicate provider entries render as one work.

The provider should not visually dominate the card. If multiple providers exist, a compact `n sumber` indicator is more honest than pretending one source is the work's identity.

## Empty state

If no sources are included:

Title:
`Library belum punya sumber.`

Body:
`Pilih sumber yang mau tampil di Library dan Populer.`

Primary action:
`Atur sumber`

If sources exist but produce no catalog content, use a different state; do not imply the user has not configured sources.

---

# 12. Cari

## Purpose

Global multi-source lookup for users who cannot find a title through their personalized Library or who intentionally want broader coverage.

## Data scope

All available sources are eligible regardless of Library/Populer inclusion.

## Page order

1. Main global search input + Filter when needed
2. Source scope
3. Search state/result header
4. normalized results

Do not show a generic Popular grid as though it were a search result before the user searches unless it is explicitly labeled as a discovery fallback.

If keeping a pre-query Popular section, label it clearly and do not conflate it with query results.

## Result header

Contains:

- result count;
- optional query echo when useful;
- view toggle;
- provider completion state during progressive loading.

---

# 13. Populer

## Purpose

Discovery driven by popularity from the user's included sources.

## Source scope

**LOCKED**

Only sources toggled ON in Sumber participate.

## Ranking semantics

**RECOMMENDED**

Do not naively merge source rank positions into a fake global numeric ranking.

Safer model:

- default aggregated deduplicated discovery view: `Populer di sumber pilihan`;
- no authoritative `#1, #2, #3` unless Yomirra has a defined cross-source score;
- source switcher allows a provider-specific ranked view where exact ranking numbers are meaningful.

For Beranda's Top 5 panel, continuing to show one selected source at a time is appropriate.

## Aggregated ordering

If an aggregated view is required before a formal score exists, label it as `Populer` without numeric rank and order via a documented heuristic such as:

- appearance across multiple active sources;
- provider list position normalized per source;
- recency;
- reliability/confidence.

Do not imply mathematical precision that the data does not provide.

---

# 14. Rak Buku

## Purpose

The canonical personal collection and reading-state page.

This is the only page that should feel like “punya gue”.

## Primary tabs

- Sedang Dibaca
- Bookmark

Future tabs/categories may be added only if supported by actual user state, not because other readers have them.

## Sedang Dibaca

Use `ReadingCard`.

Show:

- cover;
- title;
- reading chapter;
- progress;
- continue action;
- last-read or update information when useful;
- optional source context.

### Data hygiene

Never render:

- blank `Chapter` labels;
- duplicate normalized works;
- raw provider IDs;
- progress values without meaningful chapter context.

If chapter data is unknown, show a deliberate unknown state or omit the field.

## Bookmark

Bookmark is a saved-title state, not necessarily a reading-progress state.

Do not force progress UI onto a title that has never been read.

## Weekly release schedule

`Jadwal Rilis Mingguan` is a secondary utility.

It must not visually compete with the primary tab state.

## "Terakhir dibaca"

If this is sortable/filterable, render it as a real control.

Do not use low-contrast helper text for interactive controls.

---

# 15. Sumber

## Purpose

Provider personalization, capabilities, and health diagnostics.

## Recommended page structure

1. Management page header
2. concise explanatory banner
3. source search
4. source grid/list

All four elements should align to the same page container edge. Do not use an unexplained second inset for search and cards.

## Explanatory banner

Current banner copy is too technical and conflates concepts.

Recommended intent:

`Pilih sumber yang ingin tampil di Library dan Populer. Semua sumber tetap bisa digunakan lewat Cari.`

This describes behavior without implementation jargon.

## Source card anatomy

1. source identity
   - logo
   - display name
   - language when relevant
   - version only if user-relevant; otherwise hide in normal mode
2. health state
3. capability chips
4. compact health/latency summary
5. inclusion toggle
6. optional contextual action

Avoid English/Indonesian mixtures such as `Enabled`, `Just now`, and `Failed to fetch` in user-facing UI.

### Error copy

Adapter/raw network errors belong behind a detail/diagnostic disclosure.

User-facing message examples:

- `Sumber tidak merespons.`
- `Pemeriksaan gagal. Coba lagi.`
- `Sebagian fitur sumber sedang bermasalah.`

Keep exact raw errors available for diagnostics/logging.

---

# 16. Unduhan

## Purpose

Offline content and storage management.

## Layout

Focused utility container is appropriate.

Recommended structure:

1. management header
2. storage summary
3. download list/grouped content
4. empty state when no downloads exist

## Storage card

Show:

- storage used;
- total quota/available capacity when known;
- percentage;
- progress bar.

Do not display misleading precision. If the platform cannot know a meaningful hard quota, prefer device free-space language instead of inventing a total.

## Download grouping

When downloads exist, group by work, then chapter.

Possible row actions:

- read;
- delete chapter;
- delete downloaded work;
- retry failed download.

Bulk destructive actions require confirmation when recovery is not trivial.

## Empty state

Current centered empty state is valid.

The icon must be download/offline-specific. Do not reuse a server/source-management glyph merely because it fits the icon well.

---

# 17. Pengaturan

## Purpose

Preference and data management.

The existing two-column desktop layout is valid.

## Card anatomy

Use reusable `SettingsSection` + `SettingsRow`.

`SettingsRow`:

- icon well when the row benefits from one;
- title;
- short description;
- control/action aligned right;
- responsive stack when necessary.

## Action semantics

Do not style normal, utility, and destructive actions as the same red outline button.

Recommended hierarchy:

- normal action → neutral/brand outline as appropriate;
- utility maintenance → neutral;
- destructive action → semantic danger treatment + explicit copy.

`Reset Data` is destructive.
`Bersihkan Cache` is maintenance, not equivalent danger.
`Kelola Backup` is navigation/management, not danger.

## Duplicate data

`Waktu Membaca` must not render `46 menit` as both description and trailing value.

Preferred:

```text
Waktu Membaca                       46 menit
Total waktu membaca di perangkat ini
```

or simply title + value if the description adds nothing.

---

# 18. Comic detail page

A mature reader needs a strong detail page even though it was not part of the current screenshot set.

## Purpose

Bridge discovery and reading.

## Recommended hierarchy

1. Back/breadcrumb context
2. Work header
   - cover
   - canonical title
   - alternate title if useful
   - status/type
   - creators
   - rating only if the source/aggregation meaning is clear
3. primary actions
   - Mulai / Lanjut baca
   - Bookmark
   - Download
   - overflow
4. synopsis
5. genre/tags
6. provider context
7. chapter list

## Provider context

For normalized works:

- show current resolved provider;
- expose `Ganti sumber`;
- optionally show latest chapter per candidate in a compact source picker;
- preserve personal reading state across provider changes when mapping is reliable.

Provider selection should be secondary to the work itself.

## Chapter list

Rows need:

- chapter number/title;
- release date where reliable;
- read/unread;
- downloaded state;
- bookmark where chapter bookmarks exist;
- optional scanlator/source context;
- overflow actions.

Support clear sorting:

- newest first
- oldest first

Do not make sorting direction ambiguous.

## Chapter duplication

If providers expose duplicate chapter variants, do not silently collapse chapters unless identity confidence is high. Preserve provider distinction when it matters.

---

# 19. Reader experience

The reader is not a normal page inside the desktop shell. It is a focused reading environment.

## 19.1 Supported reading modes

Based on established comic-reader behavior, Yomirra should support at minimum:

- **Long strip / vertical continuous** — primary for webtoon/manhwa/manhua style content.
- **Paged right-to-left** — standard manga behavior.
- **Paged left-to-right** — western/comic or user preference.

Optional later:

- paged vertical;
- long strip with configurable gap.

The default may be inferred from work/source metadata, but users must be able to override it per title.

## 19.2 Preference hierarchy

Recommended hierarchy:

1. per-title override;
2. content-type/source recommendation;
3. global reader default.

A user changing one manga to RTL should not unexpectedly change every series.

## 19.3 Reader chrome

Default reading state should prioritize content.

Tap/click center toggles reader chrome.

Top chrome:

- back/close;
- title + chapter;
- optional source context;
- reader settings.

Bottom chrome:

- chapter/page progress;
- previous/next chapter;
- chapter navigator;
- reading-mode controls when appropriate.

Controls should auto-hide after a short idle period and reappear predictably.

**LOCKED CHROME RULES**

- reader header and reader dock use the same chrome surface language as the main mobile dock;
- reading progress sits above the status-bar blur but below reader controls and drawers;
- opening the chapter navigator centers the currently active chapter;
- the default chapter navigator is compact and number-first; verbose timestamps are not primary reader UI;
- reader drawers belong to the same bottom-sheet family as other Yomirra drawers.

## 19.4 Desktop controls

Recommended keyboard support:

- Left/Right Arrow → page navigation in paged mode;
- Up/Down / PageUp/PageDown → controlled scroll in long-strip mode;
- Space → advance/scroll;
- `Esc` → close transient reader UI / exit fullscreen hierarchy sensibly;
- `F` → fullscreen if supported;
- reader settings shortcut only if it does not collide with browser behavior.

Do not hijack common browser shortcuts unnecessarily.

## 19.5 Mobile controls

Use generous tap zones.

Paged mode:

- left/right zones for previous/next according to reading direction;
- center zone toggles chrome.

Long-strip:

- normal inertial scroll;
- optional quick chapter navigator;
- no accidental navigation from ordinary vertical scroll gestures.

## 19.6 Image behavior

Must support:

- fit width / smart fit where relevant;
- zoom;
- double-tap zoom;
- crop borders for paged content;
- wide-page handling;
- resilient image retry.

Avoid overprocessing images. Preserve source image quality unless the user enabled Data Saver.

## 19.7 Loading strategy

Reader should preload nearby pages, not the entire universe.

Recommended:

- current page/chunk highest priority;
- next few pages preloaded;
- previous page retained for back navigation;
- adaptive prefetch based on connection/data saver;
- cancellation when user exits or switches chapter.

Long-strip mode can progressively load ahead of scroll.

## 19.8 Reader failure state

If one page fails:

- keep the rest readable;
- show an inline retry state at that page;
- allow `Coba lagi`;
- allow source/provider recovery when the entire chapter is unavailable.

Do not throw the user back to detail because one image failed.

## 19.9 Chapter transitions

At end of chapter:

- clearly mark chapter completion;
- show next chapter title/number;
- provide next action;
- preserve reading direction/mode;
- update progress only when the completion condition is met.

Never auto-jump across chapters in a way that makes the user lose context without a transition indicator.

## 19.10 Downloads and reader

Downloaded chapters should open without network dependency.

If local content exists, prefer local content.

Reader must visibly distinguish a failed network request from an invalid local download only when the distinction helps recovery.

---

# 20. Visual language

## 20.1 Core character

Yomirra uses a restrained editorial reader aesthetic:

- warm cream application canvas;
- white/elevated content surfaces;
- thin neutral borders;
- a single hanko-like red brand accent;
- soft semantic tints;
- compact, deliberate typography;
- manga-cover artwork provides most high-saturation color.

The UI itself should not compete with cover art.

## 20.2 Color semantics

### Brand accent

Use for:

- current navigation emphasis;
- primary CTA;
- active tab/segment where appropriate;
- brand links;
- selected state;
- key progress accents where not semantically success/failure.

### Success / positive

Soft green.

Use for:

- online;
- completed;
- 100% reading completion where semantic completion matters;
- successful operations.

### Warning

Soft amber, not fluorescent yellow.

Use for:

- degraded source;
- non-blocking warning;
- attention-needed state.

### Danger / error

Do not reuse brand accent as the only danger signifier.

Danger must have:

- dedicated semantic token/family;
- icon and/or explicit wording;
- soft tint for background states;
- stronger treatment only for destructive confirmation.

### Neutral

Use neutral gray/cream for:

- inactive controls;
- metadata;
- disabled states;
- unknown health.

## 20.3 Typography

Primary UI family: Jakarta Sans.

Recommended hierarchy:

- display/page title: ExtraBold/Bold, tight tracking;
- section title: Bold;
- card title: SemiBold/Bold;
- body: Regular/Medium;
- metadata: Regular/Medium at compact size;
- uppercase micro-label: Medium/SemiBold with increased tracking;
- counters such as `01 / 05`: mono or tabular-numeric treatment.

Brush/display lettering is restricted to:

- logo/brand expression;
- splash/onboarding;
- rare intentional expressive empty-state art.

Do not use it for ordinary hero/comic titles.

## 20.4 Spacing

Use a token scale rather than page-specific magic numbers.

Recommended base:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

Most component gaps should come from this scale.

## 20.5 Radius

Use a small controlled set:

- small — badges/tiny controls;
- medium — inputs/icon buttons;
- large — cards/dialogs;
- pill — chips/tabs/toggles.

Do not invent a new radius per component.

## 20.6 Borders and elevation

Base card style: thin border + minimal/no shadow.

Elevation should indicate functional hierarchy, not decoration.

Use shadow for:

- floating menus;
- dialogs;
- popovers;
- intentionally elevated hero/continue cards when required.

Do not give every card a shadow.

---

# 21. Reusable design system architecture

The design system has four layers.

## 21.1 Foundation

Not components:

- semantic colors;
- typography;
- spacing;
- radius;
- border;
- elevation;
- motion/easing/duration;
- focus ring;
- disabled opacity/state;
- z-index/overlay layers;
- breakpoints;
- container widths.

These must be centralized before polishing dozens of components.

## 21.2 Primitives

Core primitives:

- Button
- IconButton
- Input
- Textarea
- Checkbox
- Radio
- Switch
- Slider
- Label
- Badge
- Avatar
- Separator
- Spinner
- Progress
- Skeleton
- Surface
- IconWell
- Kbd
- VisuallyHidden
- Backdrop
- ScrollArea

Rules:

- primitives contain semantic variants;
- domain concepts do not leak into primitive APIs;
- avoid one-off clones with tiny style differences.

## 21.3 Compound components

- Select
- Combobox / Autocomplete
- DropdownMenu
- ContextMenu where actually needed
- Popover
- Tooltip
- Dialog
- AlertDialog
- Tabs
- SegmentedControl
- Accordion / Collapsible
- CommandPalette
- Pagination
- Toast
- Drawer/Sheet as one overlay family with presentation variants

Avoid redundant parallel implementations:

- ConfirmationModal should compose AlertDialog.
- Snackbar should not exist separately if Toast covers the use case.
- Bookmark/Favorite/More Actions are IconButton patterns, not new base primitives.
- SearchInput composes Input; it is not a separate input architecture.

## 21.4 Application patterns / domain components

### Page patterns

- AppShell
- PageContainer
- PageHeader
- SectionHeader
- PageToolbar
- FilterBar
- SortControl
- BulkActionBar
- StateView

### Comic patterns

- ComicCover
- ComicTitle
- ComicMetadata
- SourceBadge
- StatusBadge
- Rating
- BookmarkAction
- ReadingProgress
- CatalogCard
- ReadingCard
- RankingItem
- HeroFeature

### Source patterns

- SourceCard
- SourceSelector
- SourceChipGroup
- SourcePicker
- SourceHealth
- CapabilityChips

### Settings/utility patterns

- SettingsSection
- SettingsRow
- StorageUsage
- DownloadItem

### Search patterns

- GlobalSearchLauncher
- SearchField
- SearchScope
- SearchProgressSummary

---

# 22. Do not build a universal monster card

A common failure mode is one component with dozens of flags:

```text
<ContentCard
  variant="grid"
  compact
  reading
  showProgress
  sourceMode="..."
  ...
/>
```

Avoid this.

Use shared internal primitives but separate semantic compositions:

- `CatalogCard` — Library/Search/appropriate Popular views
- `ReadingCard` — Rak Buku/Lanjut Baca
- `RankingItem` — rankings
- `HeroFeature` — spotlight

Reusability means shared structure and rules, not forcing unrelated jobs through one API.

---

# 23. State system

Every reusable pattern must define these states where applicable:

- default
- hover
- pressed
- focus-visible
- selected
- disabled
- loading
- success
- warning
- error
- empty

Interactive state must never be communicated by color alone.

## Focus

Focus-visible is distinct from selected/active.

A thick ring should appear only for keyboard focus, not as the permanent style of the current sidebar route.

---

# 24. Loading

## Skeleton

Canonical rule: skeleton adalah **content-less geometry** dari UI final, bukan placeholder generik.

Skeleton harus mempertahankan section order, major dimensions, card aspect ratio, toolbar/control placement, responsive columns, container width, section spacing, dan breakpoint composition.

Home mengikuti urutan yang sama dari loading sampai final:

1. Hero;
2. Sorotan & peringkat;
3. Lanjut Baca;
4. Baru diperbarui.

Hero text/search boleh langsung hadir; artwork dekoratif Hero tidak mempunyai skeleton. Spotlight skeleton harus menyerupai komposisi editorial final dan ranking skeleton harus menyerupai lima row final.

Route `loading.tsx` dan nested Suspense fallback harus berbagi geometry contract yang sama agar navigasi tidak melewati wrong skeleton → blank state → final layout.

Use subtle movement only.

Avoid:

- harsh shimmer;
- excessive pulse contrast;
- skeletons for elements that load almost instantly;
- random anonymous rectangles yang tidak menyerupai final content;
- obsolete section order atau card ratio;
- skeleton untuk shell persisten yang sudah hadir;
- card count yang membuat tinggi halaman berbeda ekstrem dari final state.

## Progressive source loading

Search and aggregated catalog pages may receive data from sources at different speeds.

Prefer progressive rendering with stable positions over blocking the whole grid until every source responds.

Whole-app skeleton geometry tetap diaudit sebagai workstream terpisah dari Home revamp.

---

# 25. Empty, error, offline, and partial states

Use a shared `StateView` composition with variants rather than bespoke page markup.

An empty state should answer:

1. what happened;
2. why, when known;
3. what the user can do next.

Examples:

### Library without selected sources

`Library belum punya sumber.`
`Pilih sumber yang mau tampil di sini.`
`Atur sumber`

### Search with zero results

`Tidak menemukan judul itu.`
`Coba judul alternatif, ejaan lain, atau perluas sumber pencarian.`

### Partial provider failure

Keep successful content visible and attach a compact non-blocking notice.

### Offline with downloads available

Prioritize the path to downloaded content.

---

# 26. Toast and notifications

Toast is for transient operation feedback, not every state change.

Appropriate:

- bookmark saved;
- download queued;
- cache cleared;
- retry succeeded;
- non-blocking operation failed.

Inappropriate:

- persistent source outage;
- long-form explanation;
- confirmation requiring action;
- validation error next to a form field.

Toast anatomy:

- semantic icon when needed;
- short message;
- optional one action;
- dismiss only when useful.

Avoid stacked paragraphs inside toast.

---

# 27. Dialog, popover, dropdown, and overlay rules

## Dialog

Use for tasks that interrupt page flow and require focused completion.

Examples:

- source picker;
- destructive confirmation;
- backup restore choices.

## Popover

Use for lightweight contextual controls such as sort/filter menus.

## Dropdown menu

Use for command lists, not arbitrary forms.

## Mobile presentation

A desktop centered dialog may become a bottom sheet on narrow mobile screens if that improves reachability and content fit.

Do not automatically convert every dialog to a bottom sheet.

---

# 28. Responsive behavior

Responsive design is part of the reusable pattern definition, not a later page-specific cleanup.

## Desktop

- persistent sidebar;
- top bar;
- multi-column grids;
- dialogs centered;
- management pages may use multi-column settings cards.

## Tablet

- collapsible navigation;
- 2-column catalog where space permits;
- toolbars may wrap into two rows;
- settings may stay two columns only if labels remain readable.

## Mobile

**RECOMMENDED navigation model**

Primary bottom navigation:

- Beranda
- Library
- Rak Buku
- Cari
- Populer

Secondary destinations:

- Sumber
- Unduhan
- Pengaturan

accessible from profile/more navigation.

Do not squeeze the desktop sidebar into a tiny drawer and call the job done.

### Mobile toolbar

Search usually gets a full-width row.

Actions such as filter/sort/view toggle move to a second compact row or sheet.

### Mobile cards

Do not blindly preserve desktop card proportions.

- Catalog results may become a compact list card on narrow screens.
- Reading progress must remain visually legible.
- Touch targets must remain generous.

### Settings mobile

SettingsRow may stack control below text when necessary.

### Reader mobile

Reader remains edge-to-edge and should not inherit app-shell padding.

---

# 29. Accessibility

Minimum requirements:

- keyboard-accessible navigation on desktop;
- visible focus states;
- labels for icon-only actions;
- no color-only status communication;
- sensible heading hierarchy;
- text contrast appropriate for normal text;
- controls large enough for touch;
- reduced-motion support;
- dialogs trap focus correctly and restore it on close;
- Escape behavior is predictable;
- tooltips do not contain essential information unavailable elsewhere.

Cover alt text should be meaningful where images convey identity, but avoid redundant verbosity when the title is already adjacent.

---

# 30. Motion

Motion should explain hierarchy and state change.

Recommended principles:

- short, restrained durations;
- ease-out entering, ease-in exiting where appropriate;
- dialog scale/opacity transition should feel deliberate, not template-default;
- popovers originate from their trigger;
- toggle/segment motion communicates selection without excessive bounce;
- skeleton animation is subtle;
- respect reduced motion.

Avoid decorative motion that delays reading or browsing.

---

# 31. Copywriting

Yomirra should sound like a native Indonesian product, not translated English UI.

Rules:

- use short, concrete verbs;
- prefer natural Indonesian phrasing over literal translation;
- avoid implementation jargon in normal UI;
- do not use motivational/AI-assistant filler;
- do not explain obvious controls;
- error copy should identify the problem and next action;
- use English only for unavoidable proper nouns or established technical labels.

Bad:

`Server merespons dengan baik.` beside a red error strip.

Better when healthy:

`Berfungsi normal`

Bad:

`Failed to fetch`

Better:

`Sumber tidak merespons.`

Bad:

`Enabled`

Better for current product logic:

`Tampilkan di Library & Populer`

Terminology must be consistent across pages:

- `Library` = everyday aggregated catalog
- `Rak Buku` = personal saved/reading space
- `Sumber` = provider
- `Cari` = global multi-source search
- `Unduhan` = offline content

Do not use `rak bacaan` as a synonym for Library.

---

# 32. Iconography

Do not draw one-off icons from scratch when the existing icon system has an appropriate glyph.

Rules:

- one icon family;
- consistent stroke weight;
- consistent optical sizing;
- icon wells use the shared `IconWell` component;
- same concept = same icon across pages;
- different concept = do not reuse an icon only because it visually fits.

Example: Sumber and Unduhan should not reuse the same server glyph if their meanings differ.

---

# 33. View modes

List/grid view toggle is a reusable segmented control pattern.

Rules:

- same icon order everywhere;
- same selected treatment;
- same control size;
- user preference may persist by surface when useful;
- do not put it randomly in the toolbar on one page and section heading on another without a structural reason.

Recommended placement:

- inside the main results toolbar/header for Library, Search, and other catalog surfaces.

---

# 34. Selection chips and tabs

Current UI has two distinct selected styles: solid red and tinted red with check.

Both can exist if their semantics differ.

Recommended:

- **Tabs / segmented navigation** → stronger selected fill.
- **Filter/source multi-select chips** → soft tint + optional check.

Do not assign style based on which page the component happens to appear on.

---

# 35. Badges and metadata

Standardize:

- SourceBadge
- ContentStatusBadge
- ContentTypeBadge
- CountBadge
- HealthBadge

Source badges display normalized names.

`ONGOING`, `COMPLETED`, etc. must use the same semantic mapping everywhere.

Do not render `ONGOING` pink on one page and blue on another unless the color has a real semantic difference.

---

# 36. Data Saver

Data Saver is a media-delivery preference, not a generic aesthetic setting.

When ON:

- request lower-resolution thumbnails where adapters support it;
- reduce prefetch aggressiveness;
- preserve readable reader quality; do not degrade pages to the point of illegibility;
- make the behavior predictable.

Do not imply savings that cannot actually be implemented at the source level.

---

# 37. Notifications

Notifications should map to user value:

- new chapter in personally relevant titles;
- download completion/failure when useful;
- important synchronization problem.

Source health should not generate noisy end-user notifications unless it blocks something the user explicitly cares about.

The navigation badge should represent a clearly defined unread notification state, not a catch-all event count.

---

# 38. Performance and network principles

Multi-source architecture makes performance a product-design concern.

Rules:

- do not query all providers just because a page mounted;
- cancel stale Search requests after query/scope changes;
- use source-level timeout and error isolation;
- progressively render;
- cache safe catalog/metadata responses where appropriate;
- avoid repeated identical provider requests across Home/Library/Popular when reusable cached data is fresh enough;
- do not let one slow provider block the whole UI;
- preserve user context while refreshing.

Bulk refresh actions should be deliberate because provider sites may rate-limit or block aggressive request patterns.

---

# 39. Personal-state ownership

Reading progress, bookmark state, download state, and history should attach to the normalized work/user state whenever possible, not blindly to one provider entry.

Provider-specific mapping still needs to exist underneath.

This enables:

- source switching without losing personal intent;
- merged Library/Search cards;
- future migration/recovery behavior.

When chapter mapping is uncertain, preserve data rather than fabricating exact equivalence.

---

# 40. Quality gates for any redesigned page

Before considering a page complete, verify:

## Product logic

- Does the page have exactly one clear job?
- Is its source scope correct?
- Are normalized duplicates handled correctly?
- Are personal and provider states separated?

## Visual system

- Correct container archetype?
- Correct heading pattern?
- Shared typography/tokens?
- Shared badges/chips?
- No raw IDs?
- No invented one-off radius/shadow?

## Interaction

- Keyboard focus correct?
- Hover/pressed/selected distinct?
- Loading/error/empty defined?
- Actions are placed according to importance?

## Responsive

- Mobile behavior designed, not merely compressed?
- Toolbars wrap deliberately?
- Touch targets remain usable?
- Dialog vs sheet behavior intentional?

## Copy

- Natural Indonesian?
- No English leakage from adapter errors?
- No duplicate information?
- No AI-like filler or over-explanation?

## Network/data

- No unnecessary all-source fetch?
- Partial failure isolated?
- Stale requests cancellable?
- User state preserved?

---

# 41. Implementation priority for design-system cleanup

This is design priority, not permission to modify production code without an explicit execution instruction.

## Tier 1 — stop visual drift

- Button
- IconButton
- Input
- Badge/Chip
- Checkbox/Radio/Switch
- Dialog/AlertDialog
- Dropdown/Popover
- Tooltip
- Slider
- Skeleton
- Progress
- IconWell
- semantic state tokens

## Tier 2 — stop page-structure drift

- PageContainer
- PageHeader
- SectionHeader
- PageToolbar
- SearchField
- FilterBar
- Tabs/SegmentedControl
- ViewToggle
- StateView

## Tier 3 — stop domain drift

- ComicCover
- ComicMetadata
- SourceBadge
- StatusBadge
- CatalogCard
- ReadingCard
- RankingItem
- HeroFeature
- SourceCard
- SourcePicker

## Tier 4 — build only when actually needed

Examples:

- DatePicker
- TimePicker
- OTP Input
- Video Player
- Resizable Panel
- Split Pane
- Lightbox
- Avatar Group

Do not implement inventory components only because a generic design system list contains them.

---

# 42. Current locked decisions summary

1. Library is not merged into Search.
2. Library is an everyday catalog built from user-selected sources.
3. Search is global and can use all sources regardless of Sumber toggle state.
4. The Sumber toggle controls inclusion in Library and Populer.
5. Library and Search both normalize equivalent works across providers.
6. Rak Buku is the personal saved/reading-state surface.
7. Source health is separate from source inclusion.
8. Raw provider IDs must not leak into normal UI.
9. Design-system cleanup must prioritize reusable primitives, compounds, patterns, and domain components rather than page-specific styling.
10. Responsive behavior belongs in the reusable component/pattern contract.

---

# 43. Recommended decisions awaiting explicit lock

These are strong recommendations but should remain visible as product decisions rather than silently hard-coded assumptions.

1. Header search becomes a global search launcher; on `/search`, `⌘K` focuses the main Search input.
2. Search defaults to `Semua sumber` and does not execute provider queries until a query/discovery action requires them.
3. Library opens a normalized work through a provider resolver instead of showing a source chooser every time.
4. Detail view exposes `Ganti sumber` for normalized works with multiple provider offers.
5. Populer uses an aggregated deduplicated view without fake numeric global ranking, plus provider-specific ranking views.
6. Mobile uses bottom navigation for the five primary discovery/personal routes, with utility routes under secondary navigation.

---

# 44. Open product decisions

Do not infer these in implementation until discussed:

1. Exact global popularity aggregation formula, if Yomirra eventually wants authoritative cross-source ranking numbers.
2. Exact provider resolver weights: last-used vs newest chapter vs source health vs user preference.
3. Whether a user can pin a preferred provider globally or per work.
4. Whether Library catalog data is fetched live, cached, incrementally refreshed, or a hybrid; UX should support freshness without excessive provider requests.
5. Exact detail-page behavior when chapter numbering differs materially between providers.
6. Whether long-term personal categories beyond Sedang Dibaca/Bookmark are part of product scope.
7. Whether the global search launcher provides instant cached suggestions or only redirects submitted queries.

---

# 45. Final design principle

Yomirra should feel like a reader that understands **works first, sources second**.

The user chooses sources to personalize everyday discovery, but should not have to micromanage providers during ordinary reading. Provider mechanics become visible when they help solve a problem: searching globally, switching a broken source, comparing availability, or diagnosing source health.

The visual system should reflect the same hierarchy:

- comic content first;
- personal reading state second;
- source mechanics third;
- implementation/debug information last.

That hierarchy is the main criterion for future UI decisions.


---

# 46. Telegram ops language

**LOCKED**

Telegram ops messages are written in natural Indonesian. Machine codes and technical terms remain in English when they are useful for debugging.

Incident messages answer these questions in order:

1. apa yang terdampak;
2. kemungkinan penyebab;
3. tindakan berikutnya;
4. status teknis.

Do not dump raw probe fields as the primary message.

Health digest should summarize the whole system, then list only sources that need attention or are meaningfully slow. Healthy sources do not need one line each.

Daily digest is a concise operational summary, not a duplicate health dump. Do not claim incident counts or trends that are not actually stored.

Recovery messages state that the source is normal again, include duration when known, and say whether follow-up is still needed.

User reports keep user-facing context first. Raw IDs belong under a small technical section when they are needed for debugging.

Telegram commands stay limited and operational:

- `/status`
- `/errors`
- `/source <id>`
- `/sources`
- `/recheck <id>`

Do not add AI diagnosis, auto-fix, auto-deploy, or speculative root-cause claims.
