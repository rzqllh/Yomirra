# Yomirra — bugs & refinement

[Open full findings](FINDINGS.md) — dated 2026-11-07. Register lives in existing lowercase `docs/` tree to avoid case-collision on Windows.

| Severity | Meaning | Entries |
| --- | --- | ---: |
| P0 | Urgent / data safety | 8 |
| P1 | High / functional gate | 14 |
| P2 | Medium / UX, reliability | 11 |
| P3 | Light / refinement | 7 |
| **Total** | | **40** |

**Workflow:** 1. Reproduce against latest relevant branch/SHA; 2. mark evidence as source/CI/live/device; 3. smallest safe scoped PR with RED regression; 4. exact-head CI and staging/device acceptance; 5. only then mark RESOLVED. Old audit/reported findings are not automatically active bugs. Public register must never contain private URLs, exploit payloads or user data. No Q138 activation by documentation PR.
