# 02 — Matrix Yomirra (YOM-*)

| Metadata | Nilai |
|---|---|
| Tanggal | 2026-11-04 |
| Yomirra | `rzqllh/Yomirra` `preview` @ `62b9d40` (audit baseline `e102fbc`) |
| Yoru | `rzqllh/Yoru` `main` @ `464e7a7c46f869675a07c4f2bbf27b8e541bb3af` |
| Status | **RECONCILED - APPROVED FOR YOM-01** |
| Banner | **Local checkout verified. Typecheck, lint, and build PASS. Source drift reconciled (PR #137).** |

**Metode angka:** hitungan source = lexical match pada source commit terpin, bukan DOM/runtime; nilai token dan delta = pembacaan deklarasi CSS / perhitungan rancangan, bukan computed CSS. `VERIFIED` = terbukti di source yang dibaca; `UNVERIFIED` = belum dapat dibuktikan atau perlu browser/checkout. Draft dibuat di luar repo.

## Cakupan dan legenda

| Field | Interpretasi |
|---|---|
| Jumlah ID | **147 template ID** = jumlah baris matrix hasil klasifikasi Fase 1; lexical/source mapping, **bukan** jumlah instance DOM |
| VERIFICATION | `VERIFIED` = source JSX/CSS yang diaudit pada SHA metadata; `UNVERIFIED` = selector efektif, nilai computed style, visual/runtime, dan pemakaian dinamis; belum screenshot |
| `RAW` / `RAW-SELECT` / `RAW-INPUT` | Kontrol native JSX yang perlu pemeriksaan wrapper primitive; lexical match **tidak** membuktikan seluruh konteks semantic |
| `GLASS` | Efek glass masih dipasang di luar satu utility Surface, menurut source scan |
| `CALLSITE` | Styling visual ada di penggunaan langsung dan perlu dipetakan ke variant |
| `REVIEW` | Potensi reusability atau mapping belum dapat dipastikan; **UNVERIFIED** hingga inspeksi per callsite/runtime |
| `NONE` | Source sudah memanggil primitive relevan; belum otomatis dinyatakan visual parity |
| `PROTECT-*` | Perilaku/content tidak boleh berubah |
| Primitive, variant, token | **PROPOSED**, belum diimplementasikan dan belum diberi approval per nilai |

**Metode matrix:** satu baris per elemen aksi atau template React (item dari `.map` tidak dihitung sebanyak runtime data). `existing` ialah deskripsi source-level dari audit Fase 1; verifikasi *computed* selalu **UNVERIFIED**. Bila sumber file tidak spesifik atau berbeda antarkondisi, status `REVIEW` mengharuskan inspeksi sebelum batch 02. Tidak ada route/browser test.

## Distribusi area

| Area | Jumlah ID (lexical matrix rows) |
|---|---:|
| navigation and shell | 30 |
| Home, browse, search, cards | 51 |
| Reader (protect content surface) | 32 |
| sources, updates, settings, account, overlays | 34 |
| **Total** | **147** |

## navigation and shell — 30 ID

| ID | Existing (source-level) | Primitive target | Variant (proposed) | Token (proposed) | Status |
|---|---|---|---|---|---|
| `YOM-NAV-DOCK-SURFACE` | fixed rounded-xl chrome blur16 | Surface | `glass.chrome` | glass-alpha + blur.chrome + radius.nav + z.sticky | GLASS |
| `YOM-NAV-DOCK-HOME` | active bg-accent-dim indicator, 44px Link | DockNavItem(Button asChild Link) | `nav.active` | accent.dim + control.touch44 + motion.layout | CALLSITE |
| `YOM-NAV-DOCK-BROWSE` | active bg-accent-dim indicator, 44px Link | DockNavItem(Button asChild Link) | `nav.active` | accent.dim + control.touch44 + motion.layout | CALLSITE |
| `YOM-NAV-DOCK-LIBRARY` | active bg-accent-dim indicator, 44px Link | DockNavItem(Button asChild Link) | `nav.active` | accent.dim + control.touch44 + motion.layout | CALLSITE |
| `YOM-NAV-DOCK-POPULAR` | active bg-accent-dim indicator, 44px Link | DockNavItem(Button asChild Link) | `nav.active` | accent.dim + control.touch44 + motion.layout | CALLSITE |
| `YOM-NAV-DOCK-SEARCH` | detached 56px glass Link | DockSearchLink(Button asChild) | `nav.search` | glass.chrome + control.dock56 + radius.nav | CALLSITE+GLASS |
| `YOM-NAV-TOPBAR` | fixed base/85 blur-md border | Surface | `glass.header` | surface.base85 + blur.header + z.sticky | GLASS |
| `YOM-NAV-DESKTOP-RAIL` | raised/base surface and hover | Surface | `nav.rail` | surface.raised + radius.control | CALLSITE |
| `YOM-NAV-RAIL-COLLAPSE` | native button surface hover | IconButton | `nav.rail` | control.touch44 + surface.hover | RAW |
| `YOM-NAV-HEADER-BACK` | native button in mobile header | IconButton | `nav.back` | control.touch44 + radius.control | RAW |
| `YOM-NAV-COMMAND-SEARCH` | native button raised search trigger | Button | `search.trigger` | surface.raised + control.compact + radius.control | RAW |
| `YOM-NAV-NOTIFICATION-BELL` | icon trigger with unread indicator | IconButton | `header.icon` | control.touch44 + accent.state | REVIEW |
| `YOM-NAV-THEME-TOGGLE` | motion button raised surface | IconButton | `header.icon` | surface.raised + motion.fast | RAW |
| `YOM-NAV-PROFILE-TRIGGER` | native rounded-xl button | IconButton | `header.avatar` | radius.nav + surface.raised | RAW |
| `YOM-NAV-PROFILE-MENU` | overlay/95 backdrop-blur-2xl shadow | Surface | `glass.popover` | surface.overlay95 + blur.popover + shadow.popover | GLASS |
| `YOM-NAV-PROFILE-ACCOUNT` | Link row hover surface | MenuLink | `menu.default` | surface.hover + radius.control | CALLSITE |
| `YOM-NAV-PROFILE-LANGUAGE` | Link row hover surface | MenuLink | `menu.default` | surface.hover + radius.control | CALLSITE |
| `YOM-NAV-PROFILE-HELP` | Link row hover surface | MenuLink | `menu.default` | surface.hover + radius.control | CALLSITE |
| `YOM-NAV-PROFILE-LOGOUT` | native button semantic error | Button | `menu.destructive` | semantic.error + radius.control | RAW |
| `YOM-NAV-MOBILE-MENU` | native button 44 transparent | IconButton | `header.menu` | control.touch44 + accent.active | RAW |
| `YOM-NAV-MENU-SETTINGS` | Link row accent tinted | MenuLink | `menu.accent` | accent.dim + radius.control | CALLSITE |
| `YOM-NAV-MENU-SOURCES` | Link row surface hover | MenuLink | `menu.default` | surface.hover + radius.control | CALLSITE |
| `YOM-NAV-MENU-THEME` | native button surface hover | Button | `menu.default` | surface.hover + radius.control | RAW |
| `YOM-NAV-MENU-HELP` | Link row surface hover | MenuLink | `menu.default` | surface.hover + radius.control | CALLSITE |
| `YOM-NAV-MENU-LOGINOUT` | native button semantic accent/error | Button | `menu.auth` | accent/semantic + radius.control | RAW |
| `YOM-OVERLAY-UPDATE-POPOVER` | overlay/95 blur-xl | Surface | `glass.popover` | surface.overlay95 + blur.popover | GLASS |
| `YOM-OVERLAY-COMMAND-PALETTE` | command dialog shadow-2xl | Dialog | `command` | surface.overlay + shadow.modal + radius.modal | REVIEW |
| `YOM-OVERLAY-TOAST` | Sonner CSS blur24 saturate180 | Surface utility | `glass.toast` | blur.overlay + sat.toast + shadow.toast | GLASS |
| `YOM-OVERLAY-NETWORK` | floating overlay/95 blur-md | Surface | `glass.status` | surface.overlay95 + blur.control | GLASS |
| `YOM-OVERLAY-ANNOUNCEMENT` | accent background blur-md | Surface | `glass.banner` | accent.tint + blur.control | GLASS |

## Home, browse, search, cards — 51 ID

| ID | Existing (source-level) | Primitive target | Variant (proposed) | Token (proposed) | Status |
|---|---|---|---|---|---|
| `YOM-HOME-HERO-SURFACE` | editorial image and gradient | Surface | `editorial` | radius.hero + shadow.editorial | CALLSITE |
| `YOM-HOME-HERO-SEARCH` | blur-md surface control | Button | `hero.search` | surface.raised + blur.control + control.touch44 | GLASS |
| `YOM-HOME-HERO-POPULAR` | navigation Link accent | Button asChild Link | `hero.action` | accent.primary + control.touch44 | CALLSITE |
| `YOM-HOME-HERO-COLLECTION` | navigation Link raised | Button asChild Link | `hero.secondary` | surface.raised + radius.control | CALLSITE |
| `YOM-HOME-HERO-BROWSE` | navigation Link raised | Button asChild Link | `hero.secondary` | surface.raised + radius.control | CALLSITE |
| `YOM-HOME-SPOTLIGHT-PREV` | native icon navigation | IconButton | `carousel.previous` | control.touch44 + surface.hover | RAW |
| `YOM-HOME-SPOTLIGHT-NEXT` | native icon navigation | IconButton | `carousel.next` | control.touch44 + surface.hover | RAW |
| `YOM-HOME-SPOTLIGHT-OPEN` | Link action | Button asChild Link | `editorial.open` | accent.primary | CALLSITE |
| `YOM-HOME-LEADERBOARD-SORT` | CustomSelect overlay | Select | `leaderboard` | control.select48 + surface.overlay | REVIEW |
| `YOM-HOME-CONTINUE-CARD` | cover/progress link | ContinueReadingCard | `reading.preview` | radius.card + shadow.card | REVIEW |
| `YOM-HOME-SEE-ALL` | Link text action | Button asChild Link | `link` | accent.text | CALLSITE |
| `YOM-SEARCH-QUERY` | SearchInput bg glass blur-md | SearchInput | `search.primary` | control.touch44 + glass.input | GLASS |
| `YOM-SEARCH-CLEAR` | IconButton ghost | IconButton | `search.clear` | control.touch44 + surface.hover | NONE |
| `YOM-SEARCH-TAG-REMOVE` | native button accent chip | Chip | `filter.removable` | accent.dim + radius.chip | RAW |
| `YOM-SEARCH-SOURCE-FILTER` | FilterChip | Chip | `source.selectable` | surface.raised + accent.active | REVIEW |
| `YOM-LIBRARY-SOURCE-SELECT` | CustomSelect overlay | Select | `filter.source` | control.select48 + surface.overlay | REVIEW |
| `YOM-LIBRARY-SORT-SELECT` | CustomSelect overlay | Select | `filter.sort` | control.select48 + surface.overlay | REVIEW |
| `YOM-LIBRARY-GRID-VIEW` | native button selected accent | SegmentedControl | `view.grid` | surface.glass + accent.active | RAW+GLASS |
| `YOM-LIBRARY-COMPACT-VIEW` | native button selected accent | SegmentedControl | `view.compact` | surface.glass + accent.active | RAW+GLASS |
| `YOM-LIBRARY-OPEN-FILTER` | Button accent/outline conditional | Button | `filter.trigger` | accent.active + control.touch44 | REVIEW |
| `YOM-LIBRARY-OPEN-OPTIONS` | Button dropdown trigger | Button | `menu.trigger` | control.touch44 + radius.control | REVIEW |
| `YOM-LIBRARY-SELECT-ITEM` | native button on card | IconButton | `selection.checkbox` | control.touch44 + accent.selected | RAW |
| `YOM-POPULAR-CATEGORY-TABS` | SegmentedControl | SegmentedControl | `category` | surface.raised + accent.active | NONE |
| `YOM-POPULAR-SOURCE-CHIP` | FilterChip | Chip | `filter.source` | surface.raised + accent.active | REVIEW |
| `YOM-BOOKMARK-READING-TAB` | SegmentedControl | SegmentedControl | `library.view` | surface.raised + accent.active | NONE |
| `YOM-BOOKMARK-COLLECTION-TAB` | SegmentedControl | SegmentedControl | `library.view` | surface.raised + accent.active | NONE |
| `YOM-BOOKMARK-SEARCH` | SearchInput bg glass blur-md | SearchInput | `search.secondary` | control.touch44 + glass.input | GLASS |
| `YOM-BOOKMARK-SORT` | CustomSelect | Select | `filter.sort` | control.select48 + surface.overlay | REVIEW |
| `YOM-BOOKMARK-SOURCE` | CustomSelect | Select | `filter.source` | control.select48 + surface.overlay | REVIEW |
| `YOM-BOOKMARK-CHIP` | FilterChip | Chip | `filter.status` | radius.chip + accent.active | REVIEW |
| `YOM-BOOKMARK-BULK-DONE` | Button ghost | Button | `selection.done` | control.touch44 | NONE |
| `YOM-BOOKMARK-BULK-DELETE` | Button accent | Button | `selection.delete` | semantic.destructive + control.touch44 | REVIEW |
| `YOM-BOOKMARK-COLLECTION-CREATE` | Button accent in Dialog | Button | `collection.create` | accent.primary + control.touch44 | NONE |
| `YOM-BOOKMARK-COLLECTION-RENAME` | Button in Dialog | Button | `collection.rename` | control.touch44 | REVIEW |
| `YOM-BOOKMARK-COLLECTION-REMOVE` | Button in Dialog | Button | `collection.remove` | semantic.destructive | REVIEW |
| `YOM-CARD-MANGA-OPEN` | cover/link/click area | MangaCard(Link) | `card.interactive` | radius.card + surface.hover | REVIEW |
| `YOM-CARD-MANGA-DROPDOWN` | native button contextual menu | IconButton | `card.menu` | surface.glass + control.touch44 | RAW+GLASS |
| `YOM-CARD-BOOKMARK` | custom bookmark button | IconButton | `card.bookmark` | surface.base + accent.selected | REVIEW |
| `YOM-DETAIL-READ` | Button accent or Link | Button asChild Link | `detail.read` | accent.primary + control.touch44 | REVIEW |
| `YOM-DETAIL-COLLECTION` | native button raised | Button | `detail.collection` | surface.raised + radius.control | RAW |
| `YOM-DETAIL-STATUS` | native selected button | Button | `detail.status` | surface.raised + accent.selected | RAW |
| `YOM-DETAIL-RATING` | native button + rating options | RatingControl(Button) | `detail.rating` | accent.selected + surface.overlay | RAW |
| `YOM-DETAIL-SOURCE-TRIGGER` | native blurred button | Button | `detail.source` | glass.control + control.touch44 | RAW+GLASS |
| `YOM-DETAIL-SOURCE-CONFIRM` | Button accent | Button | `source.confirm` | accent.primary + control.touch44 | NONE |
| `YOM-DETAIL-SOURCE-CANCEL` | Button ghost | Button | `source.cancel` | control.touch44 | NONE |
| `YOM-DETAIL-SYNOPSIS-EXPAND` | native button text | Button | `link` | accent.text | RAW |
| `YOM-DETAIL-CHAPTER-ROW` | Link interactive surface | ChapterLink | `chapter.row` | surface.hover + accent.current | CALLSITE |
| `YOM-DETAIL-CHAPTER-SORT` | native button | Button | `chapter.sort` | control.touch44 | RAW |
| `YOM-DETAIL-CHAPTER-SEARCH` | SearchInput | SearchInput | `chapter.search` | glass.input | GLASS |
| `YOM-DETAIL-CHAPTER-DOWNLOAD` | IconButton ghost | IconButton | `download.action` | control.touch44 | NONE |
| `YOM-DETAIL-ALTERNATE-SOURCE-DIALOG` | overlay/95 blur-2xl | Dialog/Surface | `glass.modal` | glass.overlay + radius.modal | GLASS |

## Reader (protect content surface) — 32 ID

| ID | Existing (source-level) | Primitive target | Variant (proposed) | Token (proposed) | Status |
|---|---|---|---|---|---|
| `YOM-READER-IMAGE-CANVAS` | black/mist/deepLagoon/system background | ReaderCanvas | `content.background` | reader.background | PROTECT-NO-GLASS |
| `YOM-READER-VERTICAL-IMAGES` | virtualized webtoon images | ReaderImage | `content.image` | no glass, no filter on manga content | PROTECT-NO-GLASS |
| `YOM-READER-PAGED-IMAGE` | zoomable image | ReaderImage | `content.paged` | no glass, gesture semantics | PROTECT-NO-GLASS |
| `YOM-READER-STATUS-BAR` | blur20 paint containment | Surface utility | `glass.statusBar` | blur.status20 + z.statusBar | GLASS |
| `YOM-READER-TOP-SURFACE` | fixed motion glass chrome blur16 | Surface | `glass.readerChrome` | blur.chrome + radius.nav + z.reader | GLASS |
| `YOM-READER-TOP-BACK` | motion button to detail | IconButton | `reader.header` | control.touch44 + surface.control + motion.tap | RAW |
| `YOM-READER-TOP-HOME` | IconButton in top overlay | IconButton | `reader.header` | control.touch44 + surface.control | NONE |
| `YOM-READER-TOP-BOOKMARK` | motion control | IconButton | `reader.header` | control.touch44 + accent.selected | RAW |
| `YOM-READER-TOP-SETTINGS` | motion control | IconButton | `reader.header` | control.touch44 + surface.control | RAW |
| `YOM-READER-PROGRESS-PREV` | native button | IconButton | `reader.scrub` | control.touch44 + surface.hover | RAW |
| `YOM-READER-PROGRESS-NEXT` | native button | IconButton | `reader.scrub` | control.touch44 + surface.hover | RAW |
| `YOM-READER-PAGE-PREV` | native button | IconButton | `reader.scrub` | control.touch44 + surface.hover | RAW |
| `YOM-READER-PAGE-NEXT` | native button | IconButton | `reader.scrub` | control.touch44 + surface.hover | RAW |
| `YOM-READER-WEBTOON-SCRUBBER` | native range | RangeSlider | `reader.progress` | accent.progress + control.range | REVIEW |
| `YOM-READER-PAGE-SCRUBBER` | native range | RangeSlider | `reader.page` | accent.progress + control.range | REVIEW |
| `YOM-READER-CHAPTER-DRAWER` | raised drawer | Sheet | `reader.chapter` | surface.overlay + blur.drawer + z.drawer | GLASS |
| `YOM-READER-CHAPTER-SEARCH` | SearchInput | SearchInput | `reader.chapterSearch` | glass.input + control.touch44 | GLASS |
| `YOM-READER-CHAPTER-CLOSE` | IconButton ghost | IconButton | `drawer.close` | control.touch44 | NONE |
| `YOM-READER-CHAPTER-ITEM` | native clickable row | Button | `reader.chapterItem` | surface.hover + accent.current | RAW |
| `YOM-READER-SETTINGS-PANEL` | surface raised/base | Sheet | `reader.preferences` | surface.raised + radius.panel | REVIEW |
| `YOM-READER-MODE-WEBTOON` | native button mode option | SegmentedControl | `reader.mode` | surface.raised + accent.active | RAW |
| `YOM-READER-MODE-PAGED` | native button mode option | SegmentedControl | `reader.mode` | surface.raised + accent.active | RAW |
| `YOM-READER-PREF-SCOPE-TITLE` | native scope button | SegmentedControl | `reader.scope` | surface.base + accent.active | RAW |
| `YOM-READER-PREF-SCOPE-GLOBAL` | native scope button | SegmentedControl | `reader.scope` | surface.base + accent.active | RAW |
| `YOM-READER-BACKGROUND-OPTION` | native selectable swatches | BackgroundOption(Chip) | `reader.background` | reader.background semantic swatch | RAW |
| `YOM-READER-PREF-TOGGLE-A` | ToggleSwitch | Toggle | `reader.preference` | accent.checked + control.touch44 | REVIEW |
| `YOM-READER-PREF-TOGGLE-B` | ToggleSwitch | Toggle | `reader.preference` | accent.checked + control.touch44 | REVIEW |
| `YOM-READER-PREF-RESET` | native text button | Button | `link` | accent.text | RAW |
| `YOM-READER-IMAGE-RETRY` | Button outline | Button | `recovery.retry` | control.touch44 | NONE |
| `YOM-READER-IMAGE-CHANGE-SOURCE` | Button outline | Button | `recovery.source` | control.touch44 | NONE |
| `YOM-READER-IMAGE-REPORT` | Button report | Button | `recovery.report` | semantic.info + control.touch44 | REVIEW |
| `YOM-READER-FLOATING-PANEL` | overlay 96% blur-xl | Surface | `glass.readerPanel` | surface.overlay96 + blur.drawer | GLASS |

## sources, updates, settings, account, overlays — 34 ID

| ID | Existing (source-level) | Primitive target | Variant (proposed) | Token (proposed) | Status |
|---|---|---|---|---|---|
| `YOM-SOURCE-CARD` | solid raised card | Surface | `card.source` | surface.raised + radius.card | REVIEW |
| `YOM-SOURCE-MENU` | native button menu | IconButton | `card.menu` | control.touch44 + surface.hover | RAW |
| `YOM-SOURCE-ENABLE` | ToggleSwitch | Toggle | `source.enabled` | accent.checked | REVIEW |
| `YOM-SOURCE-OPEN` | native button accent | Button | `source.open` | accent.primary + control.touch44 | RAW |
| `YOM-SOURCE-REPORT` | native text button | Button | `link` | accent.text | RAW |
| `YOM-SOURCE-SEARCH` | SearchInput | SearchInput | `search.primary` | glass.input | GLASS |
| `YOM-UPDATES-DAY-CONTROL` | SegmentedControl | SegmentedControl | `updates.day` | surface.raised + accent.active | NONE |
| `YOM-UPDATES-REFRESH` | native button | IconButton | `updates.refresh` | control.touch44 | RAW |
| `YOM-UPDATES-MARK-ALL` | native button | Button | `updates.markAll` | control.touch44 | RAW |
| `YOM-UPDATES-EXPAND` | native button | IconButton | `updates.expand` | control.touch44 | RAW |
| `YOM-DOWNLOAD-PAUSE` | IconButton | IconButton | `download.pause` | control.touch44 | NONE |
| `YOM-DOWNLOAD-RESUME` | IconButton | IconButton | `download.resume` | control.touch44 | NONE |
| `YOM-DOWNLOAD-RETRY` | IconButton | IconButton | `download.retry` | control.touch44 | NONE |
| `YOM-DOWNLOAD-DELETE` | IconButton | IconButton | `download.delete` | semantic.destructive | NONE |
| `YOM-DOWNLOAD-TABS` | Radix Tabs | Tabs | `downloads.category` | surface.raised + accent.active | NONE |
| `YOM-SETTINGS-LANGUAGE` | CustomSelect | Select | `settings.language` | control.select48 + surface.overlay | REVIEW |
| `YOM-SETTINGS-UPDATE-INTERVAL` | CustomSelect | Select | `settings.interval` | control.select48 + surface.overlay | REVIEW |
| `YOM-SETTINGS-AUTO-UPDATE` | ToggleSwitch | Toggle | `settings.binary` | accent.checked | REVIEW |
| `YOM-SETTINGS-UPDATE-BADGE` | ToggleSwitch | Toggle | `settings.binary` | accent.checked | REVIEW |
| `YOM-SETTINGS-DATA-SAVER` | ToggleSwitch | Toggle | `settings.binary` | accent.checked | REVIEW |
| `YOM-SETTINGS-WAKE-LOCK` | ToggleSwitch | Toggle | `settings.binary` | accent.checked | REVIEW |
| `YOM-SETTINGS-OTHER-TOGGLE` | ToggleSwitch | Toggle | `settings.binary` | accent.checked | REVIEW |
| `YOM-SETTINGS-READ-MODE` | SegmentedControl | SegmentedControl | `settings.readMode` | surface.raised + accent.active | NONE |
| `YOM-SETTINGS-BACKUP-EXPORT` | Button existing | Button | `settings.export` | control.touch44 | REVIEW |
| `YOM-SETTINGS-BACKUP-IMPORT` | Button existing | Button | `settings.import` | control.touch44 | REVIEW |
| `YOM-SETTINGS-CLEAR-DATA` | Button confirmation | Button | `settings.destructive` | semantic.error | REVIEW |
| `YOM-SETTINGS-CLEAR-DOWNLOADS` | Button confirmation | Button | `settings.destructive` | semantic.error | REVIEW |
| `YOM-ACCOUNT-GOOGLE-LOGIN` | Button primary | Button | `auth.primary` | accent.primary | NONE |
| `YOM-ACCOUNT-LOGOUT` | Button destructive | Button | `auth.destructive` | semantic.error | NONE |
| `YOM-ACCOUNT-GUEST-MERGE` | Dialog, button rows | Dialog + Button | `auth.merge` | surface.overlay + semantic statuses | REVIEW |
| `YOM-ONBOARDING-SKIP` | native button | Button | `onboarding.skip` | surface.hover | RAW |
| `YOM-ONBOARDING-NEXT` | native button | Button | `onboarding.next` | accent.primary | RAW |
| `YOM-ONBOARDING-DOT` | native step button | IconButton | `onboarding.step` | accent.progress | RAW |
| `YOM-MAINTENANCE-VIEW` | special themed surface | Surface | `system.maintenance` | semantic/system, separate approval if changed | REVIEW |


## Aturan migrasi khusus Yomirra

| Area | Kontrak |
|---|---|
| Public UI | `@theme` Tailwind 4, `cn()` dan existing `cva`; file primitive kebab-case |
| `Button` | **15** variant di source `button.tsx` (lexical key count), tanpa penghapusan sebelum audit call graph |
| Unused candidate | `tertiary`, `glass`, `success`, `warning`, `info`, `muted`, `reader`, `link` tanpa static `<Button variant="...">` langsung pada cakupan Fase 1; **UNVERIFIED** indirect consumers, `reader` digunakan via `IconButton` mapping |
| Glass | `.yomirra-chrome`, `.liquid-glass`, `Button.glass`, SearchInput, Dialog, Sheet, Toast berakhir melalui satu utility setelah consumer migration; Batch 01 hanya menambah layer |
| Reader | Blur boleh di status bar, toolbar, drawer; tidak boleh ditempatkan pada manga image, reader canvas, atau virtualized content |
| Admin / Lab | Tidak termasuk scope migrasi; UI Lab read-only meskipun muncul dalam lexical baseline awal |

## Open items

| ID | Hal yang belum terverifikasi | Status |
|---|---|---|
| YOM-O-01 | Computed style semua YOM-* di 390px/1440px serta tema | UNVERIFIED |
| YOM-O-02 | Indirect usages dan variant dinamis `Button` | UNVERIFIED |
| YOM-O-03 | Perubahan exact state styles pada hover, focus, disabled, active | UNVERIFIED |
| YOM-O-04 | Reader content & gesture parity pada webtoon/paged setelah migration | BLOCKED (belum fase eksekusi) |
