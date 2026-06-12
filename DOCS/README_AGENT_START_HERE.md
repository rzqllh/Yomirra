# Yomirra Audit & Reimagine Docs

Use these docs as the single source of instruction for the next AI/code agent session.

## Order to read

1. `YOMIRRA_MASTER_AUDIT_PROMPT.md` [YOMIRRA_MASTER_AUDIT_PROMPT.md](file;file:///c%3A/Users/Hafizh%20Rizqullah/Documents/Code/MangaReader-Apps/DOCS/YOMIRRA_MASTER_AUDIT_PROMPT.md)
2. `YOMIRRA_AI_GUARDRAILS.md` [YOMIRRA_AI_GUARDRAILS.md](file;file:///c%3A/Users/Hafizh%20Rizqullah/Documents/Code/MangaReader-Apps/DOCS/YOMIRRA_AI_GUARDRAILS.md)
3. `YOMIRRA_UIUX_REIMAGINE_SPEC.md` [YOMIRRA_UIUX_REIMAGINE_SPEC.md](file;file:///c%3A/Users/Hafizh%20Rizqullah/Documents/Code/MangaReader-Apps/DOCS/YOMIRRA_UIUX_REIMAGINE_SPEC.md)
4. `YOMIRRA_FULL_AUDIT_CHECKLIST.md` [YOMIRRA_FULL_AUDIT_CHECKLIST.md](file;file:///c%3A/Users/Hafizh%20Rizqullah/Documents/Code/MangaReader-Apps/DOCS/YOMIRRA_FULL_AUDIT_CHECKLIST.md)
5. `YOMIRRA_COMPONENT_ARCHITECTURE.md`
   [YOMIRRA_COMPONENT_ARCHITECTURE.md](file;file:///c%3A/Users/Hafizh%20Rizqullah/Documents/Code/MangaReader-Apps/DOCS/YOMIRRA_COMPONENT_ARCHITECTURE.md)

## Main objective

Audit and reimagine the Yomirra manga reader from the actual repository state, with UI/UX as the main priority and logic correctness as the second non-negotiable priority.

Do not treat this as a light redesign. Treat it like building the product experience from zero while preserving valid product functionality.

## Non-negotiables

- Inspect actual files before giving conclusions or changing code.
- Use evidence: file path, component name, route, state/store, and exact issue.
- Do not hallucinate missing files, fake routes, fake data, fake features, or fake completed work.
- Prefer shadcn/ui + Radix primitives for interaction components.
- Apply ARIA and keyboard interaction correctly.
- Use Apple HIG-inspired clarity, hierarchy, spacing, touch comfort, motion restraint, and accessibility.
- Apply 60-30-10 color theory using the locked reference palette.
- Dark mode is the mobile priority, but provide a clean light/dark toggle.
- Avoid neon/mentereng colors. Danger states must be soft but still accessible.
- Remove magic numbers by converting them into tokens, constants, layout primitives, or documented exceptions.
- Keep code modular, reusable, and easy to trace.
