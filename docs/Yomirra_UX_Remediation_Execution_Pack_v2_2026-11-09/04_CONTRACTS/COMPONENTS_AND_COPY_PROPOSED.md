# Shared component taxonomy and Indonesian content style (PROPOSED)

## Shared component families to inspect, not names of existing source files
| Family | Observable variants | Common fix concern | Screenshots |
|---|---|---|---|
| FloatingGlobalDock | active tab pill, icons, separate search | content clearing, label state, safe-area, accessible navigation | 3770, 3780, 3795, 3800 |
| PageHeader | icon + title + description + actions | long title truncation and label priority | 3776, 3795, 3797 |
| CatalogCard | cover, title, progress/chapter, score, tag, bookmark | consistent density and optional data, title clamp | 3773, 3776, 3794 |
| RankingCard | rank, source, status, rating/bookmark | distinguish rank from rating; metadata order | 3790, 3793 |
| Select / Menu | source, sort, collection, profile, chapter sort | overflow, max height, anchor, selected state | 3777, 3782, 3783, 3779 |
| SegmentedControl | reading vs saved, theme, popular tab, mode | selected value, hover/focus, text scaling | 3780, 3791, 3798 |
| Toast / Notice | bookmark add/removal, onboarding, resume | size, semantics, offset, truncation | 3759, 3760, 3802, 3803 |
| BottomSheet | reader chapter picker & settings | header, scope, closing, scrolling, focus | 3761–3764 |
| SettingsRow | icon, explanatory text, dropdown/toggle/button | long labels squeezed, destructive action hierarchy | 3797–3801 |
| Accordion | support FAQ & synopsis | expanded content, focus, scroll clearing | 3795, 3796, 3766 |

## Baseline term dictionary
| Old UI | Suggested text | Restriction / why |
|---|---|---|
| Progress / Progres halaman | Progres baca / Tampilkan progres baca | Only for scroll-progress switch/indicator |
| Hal. n/y | Gambar n dari y (vertical asset navigation) | Not `Halaman` unless true paged mode |
| Chapter | Daftar chapter (sheet heading) | Keep chapter numbering as catalog naming if desired |
| Cari nomor chapter... | Cari chapter... | Must support actual dataset; no promise for special chapters unsupported |
| Sesuai Siste... | Ikuti sistem | Fit full selected value |
| Cakupan Pengaturan | Berlaku untuk | Must clarify per-title/global inheritance |
| Hapus dari Bookmark | Hapus judul dari simpanan | Only if feature really saves title; don't imply history removed |
| Jarak Antar Halaman | Jarak antar gambar | Only vertical asset-based mode |
| Lebar Penuh / Proporsional | **PENDING** | Don't rename without knowing image-fit algorithm |
| Muat awal gambar: Maksimal | **PENDING** | Explain actual prefetch/memory trade-off |
| Status | Status baca or Status publikasi, whichever is real | Context-specific, inspect code |
| Populer di Yomirra | **PENDING** | Determine if source-rank aggregate vs app-reading metric |
| Bab / Chapter / Halaman / Gambar | One consistent glossary per context | Do not blindly translate all existing source data |

## Writing rules
- One UI term per concept, active statement matching reality; no unconfirmed words like `berhasil`, `otomatis`, `tersedia`, `terbaru` unless state is known.
- Success, info, warning and destructive action are semantic, not mere color changes. Apply same feedback policy across screens.
- Shorten labels before clipping; preserve informative numbers/selected value and avoid ellipses on critical options.
- User-facing help: steps to resolve first, HTTP 403/429 details behind `Penjelasan teknis` if needed; do not remove accurate troubleshooting information.
- Brand names and actual comic titles should not be silently rewritten; preserve upstream identifiers.

## Preserve strengths
Retain intentional red accent, card aesthetic, themes, visual comic focus, ranking provenance, and useful existing capabilities; refactor consistency only where evidence indicates failure.
