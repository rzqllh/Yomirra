# Git Rules

> Extend file — referenced from `AGENTS.md`.
> Baca ini sebelum task apapun yang involve commit, branch, atau PR.

---

## Branch Strategy

**Model:** Simple (Solo / Small Team — sesuai dengan current project stage)

```
main          ← production-ready only, protected branch
feat/xxx      ← new features
fix/xxx       ← bug fixes
chore/xxx     ← deps, config, non-functional
docs/xxx      ← documentation only
refactor/xxx  ← restructure, zero behavior change
perf/xxx      ← performance improvements
hotfix/xxx    ← urgent production fix, branch dari main
```

**Rules:**
- **Jangan push langsung ke `main`** — selalu melalui feature branch + merge
- Hapus branch setelah merge
- Jangan kerjakan >1 feature dalam 1 branch

---

## Branch Naming

**Format:** `[type]/[short-description-kebab-case]`

```bash
feat/shinigami-source-adapter
feat/chapter-download-offline
fix/hydration-mismatch-library
fix/reader-scroll-snap
chore/update-pnpm-deps
chore/update-firebase-sdk
docs/update-db-schema
refactor/extract-manga-card
refactor/split-reader-shell
perf/virtualize-chapter-list
hotfix/image-proxy-error
```

**Rules:**
- Lowercase seluruhnya
- Pisah kata dengan `-`, bukan `_` atau spasi
- Max 4–5 kata setelah prefix type
- Deskripsi cukup singkat tapi bisa dibaca tanpa konteks tambahan

---

## Commit Format

**Convention:** [Conventional Commits](https://www.conventionalcommits.org/)

```
[type](scope): [short description]

[optional body — kenapa, bukan apa]

[optional footer: BREAKING CHANGE, closes #issue]
```

**Types:**

| Type       | Kapan                                                     |
| ---------- | --------------------------------------------------------- |
| `feat`     | Fitur baru                                                |
| `fix`      | Bug fix                                                   |
| `chore`    | Update deps, config, cleanup, non-functional              |
| `docs`     | Perubahan dokumentasi saja                                |
| `refactor` | Restructure kode, behavior tidak berubah                  |
| `style`    | Formatting, whitespace, tidak ada logic change            |
| `test`     | Tambah atau fix test                                      |
| `perf`     | Improvement performa                                      |
| `ci`       | CI/CD config                                              |
| `revert`   | Revert commit sebelumnya                                  |

**Scope suggestions** (sesuai domain codebase):

| Scope      | Covers                                        |
| ---------- | --------------------------------------------- |
| `auth`     | Firebase Auth, login/logout, use-auth         |
| `reader`   | ReaderShell, ReaderView, reader stores        |
| `library`  | Library store, library pages                  |
| `history`  | History store, history pages/components       |
| `download` | Download store, chapter download              |
| `sync`     | Firebase sync, use-sync, sync-utils           |
| `api`      | API routes, ApiClient, source adapters        |
| `proxy`    | Image proxy route, HMAC signing               |
| `cache`    | Redis cache strategies                        |
| `ui`       | Base UI components (Button, Dialog, etc.)     |
| `nav`      | TopNav, BottomDock, navigation                |
| `settings` | Settings page, settings store                 |
| `source`   | Source adapters, source registry              |
| `manga`    | MangaCard, MangaDetailView, chapter-related   |
| `pwa`      | Service worker, manifest, offline support     |
| `tokens`   | Design tokens, globals.css                    |

**Examples:**
```
feat(download): add chapter offline download via Cache API
fix(reader): resolve overlay not dismissing on scroll
fix(sync): prevent local data overwrite on first login
chore: update Next.js to 16.2.5
docs: update DB-SCHEMA with actual Firestore field types
refactor(manga): extract ChapterRow into standalone component
perf(reader): virtualize chapter list with TanStack Virtual
style(tokens): normalize border radius scale in globals.css
test(cache): add unit tests for swrCache stale fallback
```

**Rules:**
- Subject line max **72 karakter**
- Lowercase setelah colon: `feat(reader): fix scroll` ✅, `feat(reader): Fix Scroll` ❌
- Jangan titik di akhir subject
- Present tense: "add" bukan "added", "fix" bukan "fixed"
- **Commit setelah setiap meaningful change** — jangan tunggu semua selesai

---

## PR / Merge Request

**Title format:** Sama dengan commit format — `feat(scope): description`

**Checklist sebelum open PR:**
- [ ] Branch up to date dengan target branch (`main`)
- [ ] `pnpm typecheck` — zero TypeScript errors
- [ ] `pnpm lint` — clean
- [ ] `pnpm test` — all passing (kalau ada test terkait)
- [ ] Zero `console.log` yang tidak intentional tertinggal
- [ ] `.env.example` di-update kalau ada env variable baru
- [ ] Guideline docs di-update kalau ada perubahan arsitektur (AGENTS.md, extend files)
- [ ] PR description menjelaskan: apa yang berubah, kenapa, cara test

**Rules:**
- Kalau PR melibatkan >10 file, pertimbangkan pecah jadi smaller PRs
- Jangan force-push ke `main`
- Squash commits kalau banyak WIP commits — pastikan commit history bersih di main

---

## Tagging & Releases

**Format:** Semantic Versioning — `v[MAJOR].[MINOR].[PATCH]`

```
v0.1.0  ← initial foundation release (current)
v0.2.0  ← backward-compatible new feature (downloads, offline)
v1.0.0  ← first production release
v1.1.0  ← backward-compatible new feature
v2.0.0  ← breaking change
```

**Release checklist:**
- [ ] Tag dibuat dari `main` setelah merge
- [ ] `CHANGELOG.md` di-update (format Keep a Changelog)
- [ ] Release notes berisi: semua `feat` dan `fix` sejak tag sebelumnya

---

## .gitignore

File `.gitignore` sudah dikonfigurasi. Item wajib ada:

```gitignore
# dependencies
/node_modules
/.pnp
.pnp.*

# next.js
/.next/
/out/

# testing
/coverage

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
firebase-debug.log

# env files — JANGAN commit .env yang berisi secret
.env
.env.local
.env.production
.env*.local
!.env.example

# vercel
.vercel

# typescript build info
*.tsbuildinfo
next-env.d.ts
```

> ⚠️ `.env.example` WAJIB ada dan harus selalu di-update jika ada env variable baru.

---

## Commit Timing Rules

- Commit setelah setiap meaningful, verifiable unit of work.
- Jangan commit broken/untested code ke `main`.
- Jangan commit `.env`, secret keys, atau data sensitif.
- Jangan commit `console.log` debug yang tidak intentional.
- Jangan commit unrelated formatting churn bersama dengan logic changes — buat commit terpisah.

---

*Last updated: 2026-06-17*
