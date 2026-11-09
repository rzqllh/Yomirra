# Reader settings — component/element inspection map

**Screenshot**: IMG_3763.png, IMG_3764.png

| Komponen | Elemen / anchor | Bukti | Gejala visual | Keputusan/periksa |
|---|---|---|---|---|
| Settings scope | per-title / all / reset | IMG_3763.png | override/reset semantics unknown | confirm precedence and reset scope before change |
| Theme | dark/light/system tiles | IMG_3763.png | system label truncated | prevent truncation, align with app-level theme |
| Image display | width / proportion, spacing, direction | IMG_3763.png, IMG_3764.png | mutually ambiguous labels; paged vs vertical context | ground copy in actual behavior; conditional options |
| Reader performance | controls auto-hide, preload, progress toggle | IMG_3764.png | preload trade-off not communicated; progress named page | description after behavior audit |

**Related issue IDs:** CHP-01, CHP-02, CHP-03, CHP-04, CHP-05, CHP-06, CHP-07, CHP-08, CHP-09, CHP-10

**Agent:** inspect state + interactions here, locate actual components, record `code_location`, take baseline and after screenshots, then update issue tracker. Do not infer repo paths from these screenshots.
