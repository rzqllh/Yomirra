# Yomirra — Final Grill Decision Ledger

**Closed:** 2026-10-25  
**Decision status:** Product requirements and documentation direction approved.  
**Implementation status:** Not approved; not verified.  
**Authority:** User's explicit answers through Rounds 1–13, Q1–Q175.  
**Scope boundary:** This file is a decision record, not an execution specification, acceptance report, legal clearance, or instruction to change production code/deploy.

## 1. Final resolution

| Status | Result |
| --- | --- |
| **AGREED** | Q1–Q49, Q50, Q51, Q53–Q62, Q64–Q175, except revised items listed below. All numbered questions covered; Q50 was explicitly accepted in Round 13, not earlier |
| **REVISED → AGREED** | **Q52** (highest reading milestone wins over recently visited chapter) and **Q63** (persist the actual position separately per chapter, including rereads) |
| **OPEN — product decisions** | **None from the 13-round interview** |
| **OPEN — evidence/operational gates** | Feature implementation and parity verification; real-device UI/UX audit; actual motion/reuse proof; provenance of assets and any reused code; third-party license and content-rights review; privacy/terms factual validation; legal release readiness |
| **NOT AUTHORIZED** | Execution specification, production coding, redesign, test claims, deployment, changes to public legal policies or to root LICENSE |

**Important:** An approved requirement does not make a feature implemented. An accepted verification criterion (Q50) is not proof that it has passed.

## 2. Per-round status

| Round | Decision IDs | Resolution |
| --- | --- | --- |
| 1 | Q1–Q6 | Agreed — PWA foundation, source policy, identity |
| 2 | Q7–Q21 | Agreed — reader, download, data, consent, test targets |
| 3 | Q22–Q36 | Agreed — information architecture, copy, accessibility, complete screen audit |
| 4 | Q37–Q49 | Agreed — transitions, glass, components, adapters, AI |
| 5 | Q51–Q62 | Agreed except Q52 revised and subsequently accepted |
| 6 | Q63–Q72 | Agreed except Q63 revised and subsequently accepted |
| 7 | Q73–Q85 | Agreed — reread, reset, source/chapter identity, lifecycle |
| 8 | Q86–Q98 | Agreed — reading mode, completion, image handling, settings |
| 9 | Q99–Q114 | Agreed — full mobile/tablet UX, discovery, Rak Buku, detail |
| 10 | Q115–Q133 | Agreed — sources, updates, downloads, sync, AI, Admin/Ops |
| 11 | Q134–Q147 | Agreed — privacy, security, PWA durability, data safety |
| 12 | Q148–Q164 | Agreed — feature parity and interoperability, with explicit platform limits |
| 13 | **Q50**, Q165–Q175 | Agreed — verified reusable/motion gate, public documentation, independence, licensing and scope boundary |

See [GRILL_DECISIONS.md](GRILL_DECISIONS.md), [PARITY_GAP_AUDIT.md](PARITY_GAP_AUDIT.md), [REFERENCE_LICENSING_REVIEW.md](REFERENCE_LICENSING_REVIEW.md) and [GLOSSARY.md](../GLOSSARY.md) for detailed scope and evidence.

## 3. Critical revised behavior

**Q52 (accepted revision):** Highest verified progress per saved title governs **Lanjut Baca**. Merely visiting a previously read chapter must not make it regress. Most-recent-activity history is separate. Unverified source mappings must not fabricate a higher milestone.

**Q63 (accepted revision):** Every chapter retains its own actual cursor, regardless of whether it is the most advanced chapter. Returning to unfinished chapter 12 resumes its real last position even if chapter 30 is the highest milestone. A historically completed chapter may retain a separate reread cursor without revoking its completed status. A chapter far ahead is not a milestone merely because it was opened. Q73–Q85 confirm these edge cases.

## 4. Product constraints agreed across rounds

- **Yomirra:** Independent iOS/iPadOS-first **pure PWA**; Apple-like adaptive visual experience with truthful browser limitations. Library = discovery catalog, Rak Buku = personal saved titles, global Search = eligible sources beyond ordinary Library selections.
- **Reader:** Verified source/chapter mapping, reader preference precedence per title, non-destructive image presentation, explicit completion only, highest milestone independent from per-chapter cursor, interruption-safe navigation, downloads and local-first account data.
- **Data & safety:** User/guest isolation, durable migration and backup with preview/undo, recoverable sync, no silent destructive cleanup or fake success; secure source registry, contextual reports, admin access and durable audit.
- **AI:** Opt-in contextual OCR, translation and assistance; standard core reading independent of AI; accurate model/free-tier/quota limits and privacy disclosures.
- **Visual quality (Q50 and Q99–Q102):** Every page, state, overlay, toast, navigation step, copy string and component examined for small iPhones, large iPhones, iPads (portrait/landscape/multitasking), browser and installed PWA, keyboard, Dynamic Type and reduced motion. Test layout, safe areas, clipping, real shared-element continuity, focus, interruptions and accessibility. **Existing user-reported failures:** clipped toast notifications and truncated reader title. Code reuse or CSS breakpoints alone do not prove quality. No such verification has been performed in this closeout.
- **Parity:** Mihon, original Tachiyomi, Tachimanga and Aidoku explicitly credited as *feature/UX references*. Q148–Q164 cover optional external trackers, personal library services, portable backups, formats, personal notes, privacy mode, chapter bulk actions, advanced reader controls, OCR dictionary, stats and metadata provenance. See the per-question parity ledger; each item remains subject to PWA capability and honest implementation state.

## 5. Round 13 — each final decision

| ID | Resolution | Agreed constraint |
| --- | --- | --- |
| **Q50** | AGREED | Reuse/ownership, visual and interaction consistency, morph/motion, reduced motion and real-device evidence are verification requirements |
| **Q165** | AGREED | Public parity document credits app references, shows PWA adaptation and evidence-backed implementation status |
| **Q166** | AGREED | Position Yomirra as independent, inspired by named references, not affiliated/endorsed |
| **Q167** | AGREED | Retain existing Apache-2.0 root LICENSE pending dependency/code/asset provenance review; do not silently replace it |
| **Q168** | AGREED | Independently implement referenced behavior by default; copied third-party code requires separate license/provenance review |
| **Q169** | AGREED | Tachimanga is a feature/UX reference, **not** asserted to have open-source licensed app code |
| **Q170** | AGREED | Check provenance/rights of screenshots, covers, imagery, logos, icons, fonts and demo assets |
| **Q171** | AGREED | Third-party manga rights distinct from app license; establish credible rights-holder report/remediation channel |
| **Q172** | AGREED | Privacy Policy and Terms must reflect verified real data flows and receive suitable legal review before publication |
| **Q173** | AGREED | Coherent public README, license, credits, third-party notices, privacy, terms, security, contribution, changelog and user help |
| **Q174** | AGREED | Public feature/sync/security/offline/parity claims and third-party contributions must be evidence- and provenance-backed |
| **Q175** | AGREED | Closing this interview **only** approves product requirements and documentation decisions, never execution/deployment |

## 6. Public documentation and license gap inventory

| Area | Current observation on main | Status after grill |
| --- | --- | --- |
| Root `LICENSE` | Existing Apache License 2.0 | **KEEP**; provenance/license compatibility and notice obligations not fully audited |
| `README.md` | Exists, includes overview, feature descriptions and third-party content disclaimer | **REVIEW NEEDED** for deployment-verified claims, independence and correct legal links |
| `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md` | Exist | **REVIEW NEEDED** for current behavior, third-party contribution rules, security and changelog evidence |
| Feature reference/parity | Discussion document exists on docs branch; no verified release-grade public parity inventory | **ACCEPTED SCOPE**, not release-ready |
| Third-party credits/notices | No dedicated `CREDITS.md` or `THIRD_PARTY_NOTICES.md` found in main | **GAP**: inventories of code, dependencies, fonts/assets, actual notices |
| Privacy Policy / Terms | No dedicated public `PRIVACY.md` / `TERMS.md` found in main | **GAP**: factual Firebase, analytics, AI, tracker, account, retention and deletion flows to verify |
| Rights-holder reporting | No dedicated public `COPYRIGHT.md` found in main | **GAP**: practical contact and handling process; disclaimer alone is insufficient |
| Asset rights | App icons, screenshots and sample cover assets are present under `public/` | **UNVERIFIED**: creator/licensing and permissible distribution |
| Backend/source rights | Multiple content adapters and browser/proxy caching paths exist | **REVIEW NEEDED**: source access terms and content/copyright authorization |
| Legal clearance | No formal determination documented | **NOT CLEARED**: evaluate applicable Indonesian copyright and personal-data law with suitable qualified review |

The public-document names above are illustrative document surfaces, not an instruction to publish legal text that is not yet verified. References alone do not grant rights to copy assets/code, and an open-source app does not automatically license the third-party comic content it displays.

## 7. Handoff boundary

The user explicitly reserved **the complete UI/UX workflow, from initial design discussion to deployment**, for a later **Antigravity** session using relevant software-development and design skills. No Antigravity run is started here, and this ledger must not be interpreted as an execution plan or approval to execute work. Product and legal/UX validation requirements are retained, but the implementation approach remains for a separately authorized discussion.

**Interview status: CLOSED. No unresolved R1–R13 product choices; independent verification and legal/publication gates remain outstanding.**
