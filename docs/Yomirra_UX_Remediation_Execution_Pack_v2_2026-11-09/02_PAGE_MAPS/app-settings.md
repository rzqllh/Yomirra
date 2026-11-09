# App settings — component/element inspection map

**Screenshot**: IMG_3797(1).png, IMG_3798(1).jpeg, IMG_3799.jpeg, IMG_3800.jpeg, IMG_3801.jpeg, IMG_3802.png

| Komponen | Elemen / anchor | Bukti | Gejala visual | Keputusan/periksa |
|---|---|---|---|---|
| Account | account indicator, language | IMG_3797(1).png | rows tall, labels cramped | settings row responsive layout |
| Updates | check-on-open, interval, badge | IMG_3797(1).png | trigger wording ambiguous | inspect actual scheduling behavior |
| Visual/theme | theme control, data saver, keep-awake | IMG_3798(1).jpeg | separate global vs reader setting | scope and wake-lock guardrail |
| Privacy | source selector and NSFW | IMG_3799.jpeg | current state vs default copy | state and default distinct |
| Storage overview | total bytes + cache/offline categories | IMG_3799.jpeg | component sum differs from total, no source code | measure bucket scope and label |
| Storage actions | clear cache, downloads, backup, erase history, clear device | IMG_3800.jpeg, IMG_3801.jpeg | destructive CTA compresses long description | stacked responsive rows and confirmation; never auto-run destructive operation |
| Onboarding toast | informational notice | IMG_3802.png | large toast blocks page | compact info feedback / safe placement |

**Related issue IDs:** SET-01, SET-02, SET-03, SET-04, SET-05, SET-06, SET-07, SET-08, SET-09, SET-10

**Agent:** inspect state + interactions here, locate actual components, record `code_location`, take baseline and after screenshots, then update issue tracker. Do not infer repo paths from these screenshots.
