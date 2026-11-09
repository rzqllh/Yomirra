# Chapter picker — component/element inspection map

**Screenshot**: IMG_3761.png, IMG_3762.png

| Komponen | Elemen / anchor | Bukti | Gejala visual | Keputusan/periksa |
|---|---|---|---|---|
| Bottom sheet | drag handle, Chapter header, X | IMG_3761.png | header large, context absent | active chapter context; drag/close semantics |
| Search and sorting | search input, icon-only sort | IMG_3761.png | numeric query, order unknown | expose current sort and search behavior |
| Chapter grid | number pills, current chapter red | IMG_3762.png | active 152 visible; initial scroll unknown | QA initial focus, sort and state; preserve grid where useful |

**Related issue IDs:** CHP-01, CHP-02, CHP-03, CHP-04, CHP-05, CHP-06, CHP-07, CHP-08, CHP-09, CHP-10

**Agent:** inspect state + interactions here, locate actual components, record `code_location`, take baseline and after screenshots, then update issue tracker. Do not infer repo paths from these screenshots.
