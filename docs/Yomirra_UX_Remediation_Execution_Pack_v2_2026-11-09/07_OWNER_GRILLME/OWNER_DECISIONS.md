# Grillme owner — ask in batches, NEVER invent answers

**Use:** If repo inspection and controlled QA cannot resolve a product decision, ask up to **5 high-leverage questions in one round**. Do not block independent, reversible fixes while waiting. Everything below is OPEN, not owner-approved.

## Round A — critical reader/product semantics (ask first)
1. **Reader mode:** Does Yomirra support only continuous vertical scroll, or also paged horizontal manga mode? *Why it matters:* whether `Kiri ke Kanan/Kanan ke Kiri`, `Halaman`, and page-turn navigation are valid. *Evidence:* IMG_3764.png; RDR-02, CHP-07.
2. **Slider behavior:** In continuous mode, do you want to retain image-by-image slider/navigation as an optional feature, convert to chapter-wide scrubbing, or offer both? *Default until decision:* preserve behavior; only clarify UI. *Evidence:* IMG_3754.jpeg; RDR-01/RDR-10.
3. **Reader saved position:** How precise must History restore be (same chapter only, same image, or exact relative scroll position within image), and when is save committed? *Default:* inspect and test; no silent migration. *Evidence:* IMG_3753.jpeg, IMG_3780.png; RDR-08/09/12.
4. **Image-fit options:** What does `Lebar Penuh` change versus `Proporsional` in the current build? *Default:* read implementation before renaming. *Evidence:* IMG_3763.png; CHP-05.
5. **Reader scope:** When `Khusus judul ini` and `Semua komik` conflict, which takes precedence and what precisely does Reset change? *Default:* preserve current stored behavior until confirmed. *Evidence:* IMG_3763.png; CHP-08.

## Round B — Library / title / chapter data semantics
6. Does `Tersimpan (138)` include everything counted by smart `Semua 136`, plus collection/system items? What is the intended formula? *Evidence:* IMG_3781.jpeg; LIB-01/LIB-08.
7. Do red dots beside chapter 153–155 mean unread, new upload, unread updates, or something else? Does `Terakhir` mean last read? *Evidence:* IMG_3768.png; DET-03.
8. Why does detail show `173` chapter entries while some screenshots display latest chapter `172` or top visible entries around `155`? Are these source-specific, cached, or special chapters? *Evidence:* IMG_3767.png, IMG_3788.png; DET-04/07.
9. Does Bookmark save source-specific title variant, canonical cross-source title or both? How should duplicates behave in Library? *Evidence:* IMG_3781.jpeg, IMG_3776.jpeg; LIB-04/06.
10. For collection `System 2`, is System a protected collection group, user-created folder, or metadata? *Evidence:* IMG_3781.jpeg; LIB-04.

## Round C — app settings / data safety
11. Is update checking performed at app launch only, periodically while app open, in background, or by push? Is 15-minute interval functional? *Evidence:* IMG_3797(1).png; SET-02.
12. `Muat awal gambar` Ringan/Normal/Maksimal: what is actually altered (concurrent image count, prefetch, resolution, memory, caching)? *Evidence:* IMG_3764.png; CHP-09.
13. For `Bersihkan perangkat`, what data is wiped locally vs on server, and does it sign out / log out? Is backup/undo possible? *Evidence:* IMG_3801.jpeg; SET-05.
14. Does `Jaga layar tetap menyala` operate only inside reader/download tasks and release on navigation away? *Evidence:* IMG_3798(1).jpeg; SET-03.
15. Does theme `Sistem` on reader background override or follow application theme, and are per-title settings inheritable? *Evidence:* IMG_3763.png, IMG_3798(1).jpeg; SET-08.

## Round D — information architecture / naming
16. Should Beranda quick search go to same global Search as magnifier, or serve a different scoped task? *Evidence:* IMG_3770.jpeg; HOM-02.
17. What does `Baru diperbarui` mean if a title shows `Chapter belum tersedia`? Source metadata refreshed, catalog index updated, or chapter upload? *Evidence:* IMG_3773.jpeg; HOM-04.
18. Is `Populer di Yomirra` based on internal reads or ranks aggregated across sources? Which wording should users see? *Evidence:* IMG_3790.jpeg; POP-01.
19. In Weekly Schedule, does `Otomatis · Senin` mean prediction from release patterns, current source schedule, or explicit external schedule? *Evidence:* IMG_3788.png; SCH-02/05.
20. For `Status` on comic detail, does it mean *my reading status* or publication status? *Evidence:* IMG_3765.jpeg; DET-01.

## Standard response form for agent after every round
- Owner answered: quote exact answer and date.
- Impact: affected issue IDs / screens / state transitions.
- Approved: **question answer is not automatically code approval**; ask separately before implementation.
- Next: targeted QA if runtime behavior still uncertain.

## Agent may proceed without owner answer when
- Problem is a clear collision/truncation with no behavior change and the owner already approved scoped source edits.
- An existing design token or component can be reused without security, data, or user-flow changes.
- A test is read-only and does not require account/data mutation.

## Must stop for decision when
- Changing saved data model, history persistence semantics, sync, deletion scope, security, NSFW eligibility, auto-check schedule, reading modes, navigation destinations, or removing functionality.
