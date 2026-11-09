# Release-level priority: what must be fixed together

| Wave | Goal | Shared dependencies / example IDs | Evidence to close | Change approval |
|---|---|---|---|---|
| W0 | Locate actual runtime, baseline and confirm facts | All; start SYS-01/SYS-02/LIB-02 | Repo paths + repro records + baseline screenshots | Read-only inspection permitted; no writes without approval |
| W1 | Global shell / collision-safe layers | F01 SYS-01, HLP-02, SCH-04; F02 SYS-02, NTF-01, SYS-05 | All target routes scroll-limit and popover/toast overlays do not block interactive content | Owner approval before edits |
| W2 | Reader correctness and controls | F05 RDR-01–12 + F06 CHP-01–03/DET chapter | Verified resume path and mode semantics, navigation tests | Product decisions where behavior changes |
| W3 | Shared primitive density, semantics, consistency | F03 SYS-03–04, SET-10, LIB-02; F04 SYS-07 | No clipped essential values, controlled states, variants light/dark | Owner approval before design token changes |
| W4 | Per-page task efficiency | F07 home/search/explore; F08 library; F09 schedule/popular/help; F11 settings | Successful task-flow tests (not cosmetic-only) | Owner reviews UX contract per area |
| W5 | Full regression and accessibility | F10 + all tracks | Test matrix filled with evidence; no unsupported PASS | QA/release sign-off |

**Blocking rule:** A P2 copy issue can ship before W2 only if semantics are already verified. P1 state correctness or destructive action changes are blocked until tested and explicitly approved.
