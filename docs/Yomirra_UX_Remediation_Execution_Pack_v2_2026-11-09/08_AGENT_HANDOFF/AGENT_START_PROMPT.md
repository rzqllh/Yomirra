# AGENT BRIEF — paste into short-context coding assistant (READ FIRST)

Kamu menerima paket `Yomirra_UX_Remediation_Execution_Pack_v2_2026-11-09.zip`. Ini adalah **audit berbasis screenshot dan konfirmasi owner**, BUKAN bukti source-code runtime. Tujuan owner: **perbaikan sistemik UX dan UI yang salah, tanpa redesign total, tanpa menghapus fitur hanya demi estetika**.

## Non-negotiable
- **Kamu belum memiliki izin mengubah aplikasi.** Mulai dengan discovery READ-ONLY, laporkan real repo paths dan root-cause hypothesis. Minta approval scope before edits; no installs, hooks, migrations, backend/security changes, commits, deployments without explicit owner approval.
- Semua screenshot di `09_VISUAL_EVIDENCE/screenshots`; 51 image indexed di `09_VISUAL_EVIDENCE/INDEX.md`. Ada 35 crops untuk mempercepat telaah. **Baca bukti tepat untuk tiket kerja, bukan load seluruh zip ke context sekaligus.**
- `03_ISSUE_TRACKER/issues.csv` adalah sumber tugas per ID dengan `page → component → element`, evidence file, priority, fix_track dan acceptance direction. Semua statuses default `BACKLOG_UNVALIDATED` / `NOT_APPROVED` / `UNRUN`.
- `02_PAGE_MAPS` mendeskripsikan titik UI, BUKAN actual component/file names; identifikasi source via search UI text, route mapping dan existing components.
- `07_OWNER_GRILLME/OWNER_DECISIONS.md` memuat pertanyaan ketika tidak pasti; maksimal lima pertanyaan per round. Jangan invent answers.
- Pertahankan tema Yomirra, red accent, floating glass/rounded style saat itu bukan penyebab defect, fungsi bookmark title dan history resume terpisah. Jangan ubah semua page demi satu screenshot.

## Step-by-step immediate task
1. Read `00_START_HERE/KNOWN_FACTS_AND_GUARDRAILS.md`, `01_AUDIT/ROOT_CAUSE_AND_PRIORITIES.md`, `05_PLAN/EXECUTION_ROADMAP.md`.
2. Inspect repo **read-only** and report UI architecture (route/page ownership, shared dock, toast host, header, select/menu components, theme tokens, reader state). **Do not assert a path without opening code.**
3. Start with **F01 + F02**, comparing screenshot IMG_3795.png (Help), IMG_3800.jpeg (Settings), IMG_3754.jpeg (Reader) and IMG_3778.jpeg (notification). Identify shared causes of occlusion. Then F05 (Reader) only after semantics QA.
4. Create a mini fix brief: affected issue IDs, actual code paths, root cause evidence, proposed **behavior-preserving** diff, affected pages, test and rollback.
5. Ask owner for edit approval. Once approved, do one track at a time; verify all consumers, record results `06_QA/TEST_MATRIX.csv` and handoff.

## Read-only source discovery examples (run only if tools available)
`rg -n "Daftar chapter|Progres halaman|Terakhir Diupdate|Bersihkan perangkat|NOTIFIKASI PEMBARUAN|Sedang Dibaca" .`

`rg` searches code *as-is*; if strings are localized, follow i18n IDs. Commands are suggestions and have NOT been run.

## Output contract
```
STATUS: VERIFIED_IN_CODE | INFERRED | UNKNOWN | BLOCKED
ISSUES: SYS-01, ...
EVIDENCE: <screenshot + actual code location + observed behavior>
ROOT_CAUSE: ... (with confidence)
AFFECTED_PAGES: ...
PROPOSAL: targeted shared fix; preserve look/behavior unless approved
OWNER_DECISIONS: ...
AUTHORIZATION: NOT_APPROVED or exact owner approval
TESTS: test-id => NOT_RUN / PASS / FAIL / BLOCKED + logs/screenshots
REGRESSIONS: ...
NEXT_ACTION: ...
```

## Do not do
- Don't replace the visual system with a new redesign.
- Don't claim 173 vs 172 chapter count is an error without source provenance.
- Don't claim History 0% and Reader 3% prove broken persistence.
- Don't rename image options based on guesses about rendering behavior.
- Don't delete, clear caches or run destructive settings on user's account.
- Don't send screenshots containing personal details to third parties or public code repos.
