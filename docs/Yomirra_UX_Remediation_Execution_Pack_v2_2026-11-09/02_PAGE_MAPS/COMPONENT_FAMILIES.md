# Component-first locator across the full application

Tracks here are conceptual groups. To find code: search visible UI copy and navigate imports; never assume the component names match real source code.

## F01 — 5 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| SYS-01 | Shared shell | AppShell / BottomDock / fixed position + page scroll end | IMG_3798(1).jpeg, IMG_3799.jpeg, IMG_3800.jpeg, IMG_3795.png, IMG_3796.png, IMG_3766.jpeg, IMG_3767.png, IMG_3768.png, IMG_3770.jpeg, IMG_3780.png, IMG_3788.png |
| SCH-04 | Weekly schedule | WeeklySchedule / CardStack / bottom dock and card clipping | IMG_3788.png |
| HLP-02 | Help center | HelpCenter / AccordionList / expanded state and nav clearance | IMG_3795.png |
| HOM-06 | Home | Home / FeaturedCard / carousel navigation clearance | IMG_3770.jpeg, IMG_3771.jpeg |
| HLP-03 | Help center | FAQ / SupportInstructions / bottom instructions obscured | IMG_3795.png |

## F02 — 11 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| SYS-02 | Shared shell | OverlayHost / Toast / header collision + placement | IMG_3753.jpeg, IMG_3759.jpeg, IMG_3760.jpeg, IMG_3803.jpeg |
| SYS-05 | Shared shell | SelectPopover / source / sort menu dimensions & anchor | IMG_3772.jpeg, IMG_3777.jpeg, IMG_3782.jpeg, IMG_3783.jpeg |
| SYS-09 | Shared shell | OverlayHost / tap interception, focus, background scrolling | IMG_3754.jpeg, IMG_3776.jpeg, IMG_3781.jpeg |
| RDR-07 | Reader | ReaderToast / bookmark add/remove notification | IMG_3759.jpeg, IMG_3760.jpeg |
| DSC-03 | Explore / Search | ExploreSourceSelect / popover anchor / overflow | IMG_3794.jpeg, IMG_3776.jpeg |
| NTF-01 | Global overlays | NotificationPopover / last row, scroll and footer | IMG_3778.jpeg |
| NTF-02 | Global overlays | AccountPopover / account information, menu items, logout | IMG_3779.jpeg |
| NTF-03 | Global overlays | GlobalToast / onboarding information toast | IMG_3802.png |
| SYS-11 | Shared shell | BottomDock / ExpandedOverlay / raised overlay above bottom nav | IMG_3778.jpeg, IMG_3779.jpeg, IMG_3782.jpeg, IMG_3802.png |
| RDR-11 | Reader | ResumeToast / truncated resume message | IMG_3753.jpeg, IMG_3803.jpeg |
| NTF-04 | Global overlays | NotificationBell / Unread / badge 5 and card list | IMG_3778.jpeg, IMG_3779.jpeg |

## F03 — 12 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| SYS-03 | Shared shell | PageHeader / Filters / long title, subtitle, selected value | IMG_3776.jpeg, IMG_3781.jpeg, IMG_3782.jpeg, IMG_3783.jpeg, IMG_3794.jpeg, IMG_3763.png |
| SYS-04 | Shared shell | PageContainer / SectionStack / section, card, row padding | IMG_3754.jpeg, IMG_3776.jpeg, IMG_3781.jpeg |
| RDR-03 | Reader | ReaderDock / Progress label and inset | IMG_3754.jpeg |
| CHP-04 | Reader / Chapter picker | ReaderSettings / ThemeChoice / Sesuai Siste... option | IMG_3763.png |
| DET-02 | Comic detail | ComicSynopsis / expand/collapse and source text rendering | IMG_3765.jpeg |
| DET-05 | Comic detail | ComicRecommendationCarousel / cover cards and horizontal scroll | IMG_3765.jpeg |
| DET-06 | Comic detail | ComicDetailHeader / back, share, notification, title clamp | IMG_3769.jpeg |
| LIB-02 | Library | Library / FilterRow / truncated source/sort dropdown value | IMG_3781.jpeg, IMG_3782.jpeg, IMG_3783.jpeg |
| SET-01 | App settings | AppSettings / SettingsRow / icon/title/description/control grid | IMG_3797(1).png, IMG_3798(1).jpeg, IMG_3799.jpeg, IMG_3800.jpeg, IMG_3801.jpeg |
| SYS-10 | Shared shell | StickyHeader / ScrollSurface / heading clipped vs content scroll | IMG_3776.jpeg, IMG_3795.png, IMG_3797(1).png |
| LIB-09 | Library / Explore | SourceLabel / Shinigami vs shinigami casing | IMG_3776.jpeg, IMG_3782.jpeg, IMG_3788.png |
| SET-10 | App settings | Settings / DenseDestructiveRows / destructive text squeezed between icon and CTA | IMG_3800.jpeg, IMG_3801.jpeg |

## F04 — 2 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| SYS-06 | Shared shell | BottomDock / icons, active pill, search destination | IMG_3754.jpeg, IMG_3776.jpeg, IMG_3781.jpeg |
| SYS-07 | Shared shell | InteractiveStates / bookmark, active, destructive, loading | IMG_3754.jpeg, IMG_3776.jpeg, IMG_3781.jpeg |

## F05 — 9 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| RDR-01 | Reader | ReaderDock / image arrows vs chapter arrows | IMG_3754.jpeg, IMG_3758.jpeg |
| RDR-02 | Reader | ReaderProgress / Hal. asset index vs scroll percent | IMG_3754.jpeg |
| RDR-04 | Reader | ReaderDock / Daftar chapter button weight | IMG_3754.jpeg |
| RDR-05 | Reader | ReaderMinimalMode / arrow-to-top and percent badge | IMG_3755.jpeg, IMG_3757.jpeg |
| RDR-06 | Reader | ReaderStatusBarOverlay / top gradient over comic artwork | IMG_3755.jpeg, IMG_3757.jpeg |
| RDR-08 | Reader | HistoryRestore / resume toast vs image position | IMG_3753.jpeg, IMG_3803.jpeg |
| RDR-09 | Reader | ReaderImageLayout / lazy load + scroll anchor restoration | IMG_3754.jpeg |
| RDR-10 | Reader | ReaderScrubber / image navigation vs continuous progress | IMG_3754.jpeg |
| RDR-12 | Reader | Reader / HistoryLink / history 0% vs reader nonzero | IMG_3754.jpeg, IMG_3780.png, IMG_3770.jpeg |

## F06 — 8 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| CHP-01 | Reader / Chapter picker | ChapterSheet / heading, current chapter, grid | IMG_3761.png, IMG_3762.png |
| CHP-02 | Reader / Chapter picker | ChapterSheet / initial anchor and active item | IMG_3763.png |
| CHP-03 | Reader / Chapter picker | ChapterSheet / sort icon + search field | IMG_3763.png |
| DET-01 | Comic detail | ComicHero / ActionGrid / continue, saved, rating, status, collections | IMG_3765.jpeg, IMG_3766.jpeg |
| DET-03 | Comic detail | ComicChapterList / new dot, last-read badge, selected row | IMG_3767.png, IMG_3768.png |
| DET-04 | Comic detail | ComicChapterList / chapter count vs latest shown | IMG_3765.jpeg |
| CHP-10 | Chapter picker | ChapterSheet / LongList / search and sort interaction with large chapter count | IMG_3761.png, IMG_3762.png |
| DET-07 | Comic detail | ComicMetadata / DataProvenance / chapter 173 count vs visible chapter 155 / reader 172 | IMG_3767.png, IMG_3768.png, IMG_3788.png |

## F07 — 10 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| HOM-01 | Home | Home / ContinueReading / continue reading cards and % | IMG_3770.jpeg, IMG_3771.jpeg, IMG_3772.jpeg, IMG_3773.jpeg, IMG_3774.jpeg, IMG_3775.jpeg |
| HOM-02 | Home | Home / QuickSearchCard / search entry vs global search | IMG_3770.jpeg |
| HOM-03 | Home | Home / SpotlightCarousel / feature CTA, arrows, card dimensions | IMG_3772.jpeg |
| HOM-04 | Home | Home / RecentUpdates / new update semantics and missing chapters | IMG_3773.jpeg, IMG_3774.jpeg |
| HOM-05 | Home | Home / SourceRanking / source sort and top-5 list | IMG_3775.jpeg |
| DSC-01 | Explore / Search | Explore / Search / duplicate entry points and source semantics | IMG_3776.jpeg |
| DSC-02 | Explore / Search | ExploreFilters / source, format, sort, grid/list | IMG_3777.jpeg |
| DSC-04 | Explore / Search | Search / ProviderChips / selected provider filter scroll | IMG_3776.jpeg |
| DSC-05 | Explore / Search | SearchResultCard / chapter missing, synopsis snippet, bookmark | IMG_3794.jpeg |
| DSC-06 | Search | Search / SourceSelection / multi-source count with horizontal crop | IMG_3794.jpeg |

## F08 — 7 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| LIB-01 | Library | Library / SavedTabs / saved count vs automatic bucket count | IMG_3780.png, IMG_3781.jpeg, IMG_3782.jpeg, IMG_3783.jpeg, IMG_3784.jpeg, IMG_3785.jpeg, IMG_3786.jpeg, IMG_3787.jpeg |
| LIB-03 | Library | Library / SmartCategoryChips / horizontal scroll clipped edge | IMG_3785.jpeg, IMG_3786.jpeg, IMG_3787.jpeg |
| LIB-04 | Library | Library / CollectionGroups / System 2 category and collections | IMG_3781.jpeg |
| LIB-05 | Library | Library / SavedCoverCard / bookmark overlay and fixed nav overlap | IMG_3781.jpeg, IMG_3782.jpeg, IMG_3783.jpeg, IMG_3784.jpeg, IMG_3785.jpeg, IMG_3786.jpeg, IMG_3787.jpeg |
| LIB-06 | Library | Library / CollectionMenu / create collection / multi-select | IMG_3781.jpeg |
| LIB-07 | Library | Library / HistoryCard / chapter, percentage, Lanjut button | IMG_3780.png |
| LIB-08 | Library | Library / ScopeCounter / saved count reconciliation | IMG_3781.jpeg, IMG_3787.jpeg |

## F09 — 10 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| SCH-01 | Weekly schedule | WeeklySchedule / DayStrip / today star, count, selected day | IMG_3788.png, IMG_3789.png |
| SCH-02 | Weekly schedule | WeeklySchedule / ScheduleCard / Otomatis day, Baca/Lanjut CTA | IMG_3788.png |
| SCH-03 | Weekly schedule | WeeklySchedule / HistoryEntry / latest chapter vs resume destination | IMG_3788.png |
| POP-01 | Popular | Popular / RankingMethod / internal vs source-rank semantics | IMG_3790.jpeg, IMG_3793.jpeg |
| POP-02 | Popular | Popular / RankingCard / density, badges, rating, bookmark | IMG_3790.jpeg |
| POP-03 | Popular | Popular / SourceChips / source selected/count and scroll | IMG_3790.jpeg, IMG_3793.jpeg |
| POP-04 | Popular | Popular / MALLeaderboard / member metric, snapshot and source link | IMG_3791.png, IMG_3792.jpeg |
| HLP-01 | Help center | HelpCenter / FAQBody / technical 403/429 explanation | IMG_3795.png, IMG_3796.png |
| SCH-05 | Weekly schedule | WeeklySchedule / DayAssignment / semantics of automatic estimated day | IMG_3788.png, IMG_3789.png |
| POP-05 | Popular | Ranking / AvailabilityCTA / MAL ranking CTA find reading source | IMG_3791.png, IMG_3792.jpeg |

## F10 — 1 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| SYS-08 | Shared shell | TextScaling / A11y / large text and hit targets | IMG_3754.jpeg, IMG_3776.jpeg, IMG_3781.jpeg |

## F11 — 13 issues

| Issue | Page | Component / element | Evidence |
|---|---|---|---|
| CHP-05 | Reader / Chapter picker | ReaderSettings / ImageSize / Lebar Penuh vs Proporsional | IMG_3763.png |
| CHP-06 | Reader / Chapter picker | ReaderSettings / GapAndProgress / Jarak Antar Halaman / Progres halaman | IMG_3763.png |
| CHP-07 | Reader / Chapter picker | ReaderSettings / Direction / Kiri ke Kanan vs Kanan ke Kiri | IMG_3764.png |
| CHP-08 | Reader / Chapter picker | ReaderSettings / ScopeAndReset / per-title vs all, reset, override indicator | IMG_3763.png |
| CHP-09 | Reader / Chapter picker | ReaderSettings / Preload / Ringan / Normal / Maksimal options | IMG_3763.png |
| SET-02 | App settings | AppSettings / UpdateCheck / on-open toggle + periodic interval | IMG_3797(1).png |
| SET-03 | App settings | AppSettings / KeepAwake / screen wake lock during reading/downloading | IMG_3797(1).png |
| SET-04 | App settings | AppSettings / StorageMetrics / total bytes vs shown buckets | IMG_3797(1).png |
| SET-05 | App settings | AppSettings / DestructiveActions / delete local history/save vs clear device | IMG_3800.jpeg, IMG_3801.jpeg |
| SET-06 | App settings | AppSettings / OfflineAndHelp / disabled clear-offline + onboarding | IMG_3797(1).png |
| SET-07 | App settings | AppSettings / NSFWPreference / state vs default copy | IMG_3797(1).png |
| SET-08 | App settings | AppSettings / AppThemeVsReaderTheme / global theme vs reader surface choice | IMG_3797(1).png |
| SET-09 | App settings | Preferences / DisabledAction / disabled offline action without reason | IMG_3799.jpeg, IMG_3800.jpeg |

