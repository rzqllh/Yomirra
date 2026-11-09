# Reader / chapter / history content model (fact + proposal)

## FACT confirmed
- `bookmark` = saved **comic title**, not saved progress location.
- `history read` = state that stores last reading position. `percentage` represents scroll progress within chapter.
- `Hal.` displayed by existing UI is **image asset index**, not page count; image heights vary in vertical chapter.
- Slider chevrons = image index navigation. Bottom chevrons = previous/next chapter. Floating arrow = scroll-to-top. Tap toggles controls; scrolling hides controls.

## Proposed semantic model (needs code/data inspection + owner approval)
- `ComicTitle` is a catalog entity; `SavedTitle` is membership in a personal list/collection. Do not conflate with reading progress.
- `Chapter` is a reading unit; its `images` are assets possibly forming long strips, not inherently comic narrative pages.
- `ReadingPosition` has a chapter identity plus a stable location/anchor suitable for restore. Data encoding and persistence currently **unknown** (could be pixel offset, ratio, image index+offset, etc.). Do not migrate until researched.
- `ReadingMode` (continuous vertical vs paged horizontal) is feature capability, not predicted by the comic's nationality. **Paged support is UNKNOWN.**
- UI labels: continuous vertical can say `Progres baca` / `59% dibaca`, optional `Gambar 10 dari 23` for asset navigation; paged mode can say `Halaman 10 dari 23` only if actual pages exist. These are proposed, not global text replacements.

## Navigation direction and safety
- Avoid identical unlabeled prev/next chevrons for different granularity. Distinguish with grouping, text or specific affordance. The actual route/action must not be changed without approved contract.
- The `Daftar chapter` entry remains accessible but should not dominate continuous reading.
- Any chapter change must not erase existing position before next state is valid; QA must test chapter boundaries, incomplete chapter, slow image load, returning from History.
- Resume toast text should not suggest reading is restored until restoration is actually complete. Whether this bug exists is UNKNOWN.

## Reader settings: open questions
- `Lebar Penuh` vs `Proporsional` are not semantically opposite; need actual rendering behavior before renaming.
- `Jarak Antar Halaman` should be conditional/accurate for segmented vertical assets.
- `Kiri ke Kanan` vs `Kanan ke Kiri`: condition on supported reading mode and identify what directional navigation it changes.
- `Ringan/Normal/Maksimal`: confirm amount of prefetch and memory/data cost; do not assert speeds/quality.
- `Khusus judul ini`, `Semua komik`, and `Reset ke default`: document override precedence and reset scope; destructive or broad preference changes require approval.
- Global app theme vs reader canvas background preference should state scope and inheritance explicitly.

## QA evidence required
Read to 35–60%; leave to Library, home, reopen, reload; verify same chapter + approximate visual story position; repeat at slow network, different image heights and after rotating/resizing. Capture exact state, don't assert PASS from percentage alone.
