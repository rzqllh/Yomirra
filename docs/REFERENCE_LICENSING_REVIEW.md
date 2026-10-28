# Yomirra — Reference, Licensing and Public Documentation Review

**Review date:** 2026-10-25  
**Status:** Round 13 reference, licensing and public-documentation **product policy decisions accepted** (Q165–Q175, 2026-10-25). This is **not** legal advice, actual legal clearance, completed dependency/asset provenance verification, release approval, or authorization to alter LICENSE, production code or public website content. See [final decision ledger](GRILL_FINAL_LEDGER.md).

## 1. Current verified repository and comparator facts

| Project | What was verified | Use as |
| --- | --- | --- |
| Yomirra | Root [LICENSE](../LICENSE) contains Apache License 2.0 | Current declared project license, subject to component-asset provenance checks |
| Mihon app | [mihonapp/mihon LICENSE](https://github.com/mihonapp/mihon/blob/main/LICENSE) is Apache-2.0 | Product/UX/functional reference. Copy code only under license conditions and recorded provenance |
| Mihon website | [mihonapp/website LICENSE](https://github.com/mihonapp/website/blob/main/LICENSE) is MPL-2.0 | Distinct work and license; do not assume website art/docs covered by app license |
| Tachiyomi original | [Official discontinuation announcement, 2024-01-13](https://github.com/tachiyomiorg); original core repository taken down; Apache-2.0 appears on surviving historical code mirrors/forks, not a fresh official upstream grant | Historical behavior and old-backup interoperability reference; each copied file/version would need its own provenance |
| Aidoku app | [Aidoku/Aidoku README and LICENSE](https://github.com/Aidoku/Aidoku): app GPL-3.0; its translations are separately Apache-2.0 per README | Functional/UX reference only by default; do not paste GPL app code without an explicit project-license compatibility review |
| Tachimanga | [Official README-only repository](https://github.com/tachimanga/tachimanga) contains only README.md on main; [official site](https://tachimanga.app/) and [App Store](https://apps.apple.com/id/app/tachimanga/id6447486175) describe app | Product and observable behavior reference. **Application source and open-source license not verified**; never label the whole app open-source or assume permission to reuse code/assets |

A public GitHub repository is not automatically open-source or licensed for reproduction. [GitHub license guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

Yomirra can accurately describe itself as **an independent multi-source web/PWA reader informed by other readers** if the independently developed code/assets and contributors' rights support that statement. Avoid implying affiliation, partnership, endorsement, certification or an official port.

## 2. Idea/feature reference versus actual reuse

**Functional inspiration:** inspect public behavior, state and user journey, then independently implement and test an original expression. A comparable feature or interface pattern is not automatically a copied program.

**Actual reused work:** copied code, patches, icon assets, screenshots, descriptions, translations, artwork, or provider templates require rights/provenance/license review and preservation of any notices and obligations. Reference attribution does not cure an unauthorized copy. Under GPLv3, copying or combining covered code can invoke GPL obligations for the combined distributed work; see [GNU licensing FAQ](https://www.gnu.org/licenses/gpl-faq.en.html). Apache-2.0 does not grant third-party trademarks merely by licensing source code (section 6).

For Indonesia, [UU No. 28 Tahun 2014, arts. 40–41](https://www.wipo.int/wipolex/en/legislation/details/15600) protects the expression of computer programs while excluding bare ideas/procedures/systems/methods, subject to facts and other IP rights. [DJKI explanation](https://dgip.go.id/index.php/menu-utama/hak-cipta/pengenalan), [WIPO copyright protection](https://www.wipo.int/en/web/copyright/protection). These are general principles, not a determination that particular UI art, brand, site, adapter or content is cleared.

## 3. Copyright in manga content is a separate question

Open-source licensing of Mihon/Aidoku/Yomirra source code **does not** license third-party manga chapters, scans, translations, cover artwork, logos, or downloads. A reader not hosting its own library is not automatically legally immune if its services proxy, cache, facilitate access to, or redistribute unauthorized content. Distinguish:
- project-owned source/UI and clearly licensed dependencies;
- platform/source-provider interfaces and their terms/permissions;
- rights in each publisher's content and contributor translations;
- user-imported local material, which the product should not publicly redistribute.

Document a **rights-holder contact/report and review channel**, a good-faith escalation/takedown process based on applicable law, accurate source provenance, respect for access restrictions, and clear user-facing explanation. A disclaimer alone does not make unauthorized conduct lawful. Scope, hosting topology and source authorizations need separate review by qualified counsel before legal claims of full compliance.

## 4. Data and privacy context

Yomirra includes Firebase account/sync, reading history, AI/OCR/translation requests, source and error reports, analytics and optional trackers. Public privacy information must accurately identify the data collected, purposes, processors, retention, user choices/rights, deletions, security contacts and any international transfer as actually implemented. Review [Indonesia UU No. 27 Tahun 2022 on Personal Data Protection](https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/) and regulations relevant to where/how the service is operated. A legal policy must not promise zero telemetry, zero retention, deletion, or guaranteed confidentiality without verifying the actual service.

## 5. Approved public documentation direction (publication pending factual review)

| File/surface | Intended content | Evidence requirement |
| --- | --- | --- |
| `README.md` | What Yomirra is, independence, implemented vs planned capabilities, app limitations, quickstart, references and public-document links | Claims aligned with deployed/code-verified behavior |
| Root `LICENSE` | Retain existing Apache-2.0 unless changed by an informed separate decision | Full origin, license-compatibility and contributor-rights review |
| `docs/FEATURE_PARITY.md` | Every accepted parity decision, Mihon/Tachiyomi/Tachimanga/Aidoku as references, platform adaptation, Yomirra implementation state: planned/in progress/verified/limited | Feature-to-code/runtime trace; no fake "done" |
| `docs/REFERENCES.md` or `CREDITS.md` | Upstream app references, direct links, selected features and careful non-affiliation wording | Exact origin/source URL; no implied endorsement |
| `THIRD_PARTY_NOTICES.md` and optional `NOTICE` | Dependencies, imported snippets/art, license/notice obligations, changes | Actual dependency/asset inventory; do not invent provenance |
| `PRIVACY.md` / public Privacy Policy | Collected and sent data, consent, tracker integrations, AI, retention, deletion, processors, rights | Match Firebase/server/telemetry flows; legal review |
| `TERMS.md` / public Terms | Service limitations, third-party content, account conduct, age/content policies, acceptable use | Effective policy and appropriate legal review |
| `COPYRIGHT.md` or public rights-holder information | Rights-holder reports, contextual evidence, contact, remediation channel | Operationally monitored, no fake response SLA |
| `SECURITY.md` | Security reporting, supported versions, no confidential report in public issue | Existing policy must reflect reality |
| `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` | Contributions and third-party code provenance rules, license notice preservation | No silent code copying from reference apps |
| `CHANGELOG.md` / release notes | Changes, breaking migrations, platform limitations and regressions | Release evidence, not prospective promises |
| Product UI / footer / Settings | Open-source/license, references, privacy, terms, help/report contact | Correct mobile/tablet behavior and accessible links |

These are **accepted public-documentation categories**, not authorization to publish unverified legal policies, redesign the README, or assert legal compliance. At the 2026-10-25 main-tree inspection, README.md, LICENSE, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md and CHANGELOG.md existed; no separate Privacy Policy, Terms, third-party notices/credits or rights-holder procedure files were found. Check the deployed site as a separate source of truth before claiming they are absent publicly.

## 6. Pre-publication concerns

1. Verify origins/rights of all `public/` images, covers, icons, screenshots, demo media, and any custom/source assets; an Apache-2.0 code license does not automatically license their underlying art.
2. Verify complete dependency license inventory against lockfile and any bundled source code. `package.json` alone does not confirm all transitive or bundled license obligations.
3. Verify whether any code/assets are actually derived from Mihon, Aidoku, Tachiyomi, Tachimanga, another library, or external contributor; recorded history may be incomplete.
4. Do not replace the existing Yomirra LICENSE, invent a legal owner/copyright year, or publish a lawyer-approved claim without evidence and explicit approval.
5. Keep the user-facing product name/brand Yomirra distinct from other readers. Reference comparisons can use text names and links without borrowing logos.
6. Revalidate local content rights, integration/data transfer conditions and platform policies separately from the code-license decision.

**Round 13 decisions now accepted:** Q50 (verification standard) and Q165–Q175 (reference parity ledger, independent branding, Apache-2.0 retention, provenance/licensing obligations, Tachimanga reference-only, content rights, factual privacy/terms, all public docs, supported claims, and no implied code approval). No legal compliance or provenance audit is thereby completed.

**Current state:** Requirements interview closed. No signed-off legal clearance, no full dependency/asset provenance audit, no device visual audit, and no production code or website changes from this review. The separate Antigravity UI/UX workflow remains expressly deferred.
