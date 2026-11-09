# Reader — component/element inspection map

**Screenshot**: IMG_3755.jpeg, IMG_3757.jpeg, IMG_3754.jpeg, IMG_3756.jpeg, IMG_3758.jpeg, IMG_3759.jpeg, IMG_3760.jpeg, IMG_3803.jpeg

| Komponen | Elemen / anchor | Bukti | Gejala visual | Keputusan/periksa |
|---|---|---|---|---|
| Status bar / top mask | status/time & image clarity | IMG_3755.jpeg, IMG_3757.jpeg | gradient visible over illustration | Do not remove system status bar; measure overlay readability and content obstruction |
| Header control | Back / Home / title / bookmark | IMG_3754.jpeg, IMG_3756.jpeg | bookmark state shown; toast may obscure header | Toast layer rule; distinguish saved title from reading position |
| BottomDock | Progress label + percentage + image index | IMG_3754.jpeg, IMG_3758.jpeg | text cramped with border; percent vs image is different unit | Reader semantic model; consistent inner padding |
| BottomDock | Image chevrons + scrubber | IMG_3754.jpeg, IMG_3758.jpeg | same chevron glyph as chapter change | Label/group distinct navigation; test scrub units |
| BottomDock | Chapter prev / chapter list CTA / chapter next / settings | IMG_3754.jpeg, IMG_3758.jpeg | chapter CTA is primary visual weight; chevrons redundant | Reduce visual dominance; no unapproved behavior removal |
| Immersive state | floating percent + top arrow | IMG_3755.jpeg, IMG_3757.jpeg | persistent percent, top arrow only in expanded controls | Check visibility preference and touch hit targets |
| Toast / feedback | save/remove bookmark + resume | IMG_3759.jpeg, IMG_3760.jpeg, IMG_3803.jpeg | large overlay, truncation, header collision | Shared overlay host, concise event copy, safe positioning |

**Related issue IDs:** RDR-01, RDR-02, RDR-03, RDR-04, RDR-05, RDR-06, RDR-07, RDR-08, RDR-09, RDR-10, RDR-11, RDR-12

**Agent:** inspect state + interactions here, locate actual components, record `code_location`, take baseline and after screenshots, then update issue tracker. Do not infer repo paths from these screenshots.
