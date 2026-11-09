# Global overlays — component/element inspection map

**Screenshot**: IMG_3778.jpeg, IMG_3779.jpeg

| Komponen | Elemen / anchor | Bukti | Gejala visual | Keputusan/periksa |
|---|---|---|---|---|
| Notifications popover | 5 recent, preview rows, footer | IMG_3778.jpeg | last row appears clipped | fixed footer outside scroll region |
| Profile menu | account, settings, sources, theme, help, logout | IMG_3779.jpeg | popover visual hierarchy divergent | one menu family, clear logout separation |

**Related issue IDs:** NTF-01, NTF-02, NTF-03, NTF-04

**Agent:** inspect state + interactions here, locate actual components, record `code_location`, take baseline and after screenshots, then update issue tracker. Do not infer repo paths from these screenshots.
