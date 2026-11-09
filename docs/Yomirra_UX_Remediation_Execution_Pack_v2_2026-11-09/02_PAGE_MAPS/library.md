# Library — component/element inspection map

**Screenshot**: IMG_3780.png, IMG_3781.jpeg, IMG_3782.jpeg, IMG_3783.jpeg, IMG_3784.jpeg, IMG_3785.jpeg, IMG_3786.jpeg, IMG_3787.jpeg

| Komponen | Elemen / anchor | Bukti | Gejala visual | Keputusan/periksa |
|---|---|---|---|---|
| Library tabs | reading vs saved count | IMG_3780.png, IMG_3781.jpeg | distinct history and saved-title models | keep separation and count semantics |
| Reading cards | chapter, % and continue | IMG_3780.png | some progress displays 0% | QA persisted state; preserve current position |
| Saved filter row | source, sort, 3-dot actions | IMG_3781.jpeg, IMG_3782.jpeg, IMG_3783.jpeg, IMG_3784.jpeg | selected values truncated, menus vary | shared adaptive dropdowns and clear values |
| Smart buckets | horizontally scrollable category chips | IMG_3785.jpeg, IMG_3786.jpeg, IMG_3787.jpeg | edge chip labels clipped | content insets, snap/scroll hints |
| Custom collections | System 2 / collections | IMG_3781.jpeg | unclear System grouping | define label/count semantics |
| Saved grid | cover / bookmark badges | IMG_3781.jpeg | floating dock overlies covers | reserve bottom content; bookmark state unify |

**Related issue IDs:** LIB-01, LIB-02, LIB-03, LIB-04, LIB-05, LIB-06, LIB-07, LIB-08

**Agent:** inspect state + interactions here, locate actual components, record `code_location`, take baseline and after screenshots, then update issue tracker. Do not infer repo paths from these screenshots.
