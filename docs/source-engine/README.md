# Source Engine V1

Central index for all Source Engine development tracking and documentation.

## Purpose

Rebuild Yomirra's source adapter architecture to support multi-source modularity with normalized contracts, resilient domain handling, safe migration/fallback, and independent source implementations.

## Documents

| Document | Purpose |
|----------|---------|
| [STATUS.md](STATUS.md) | **Primary tracker.** Current phase, work items, evidence. |
| [PLAN.md](PLAN.md) | Implementation phases with dependencies and exit criteria. |
| [SOURCE_RESEARCH.md](SOURCE_RESEARCH.md) | Per-source research with evidence labels. |
| [DECISIONS.md](DECISIONS.md) | Architecture Decision Records. |
| [RISKS.md](RISKS.md) | Risk register with likelihood, impact, and mitigation. |

## Document Authority Rules

When reconciling information or resolving conflicting statements across documentation, adhere strictly to this authority hierarchy:

1. **`STATUS.md`**: Authoritative on **development state**, active phase, current branch, work item completion, and verified commit baseline.
2. **`SOURCE_RESEARCH.md`**: Authoritative on **verified upstream/source behavior**, network contracts, endpoints, schemas, encryption protocols, and CDN behaviors.
3. **`DECISIONS.md`**: Authoritative on **locked architecture and product decisions** (ADRs). Once committed, decisions may not be reopened without material new evidence.
4. **`PLAN.md`**: Authoritative on **implementation sequence**, phase dependencies, exit criteria, and rollback boundaries.
5. **`RISKS.md`**: Authoritative on **risk register**, failure modes, detection strategies, and mitigation status.

## Context Recovery

Any new agent or session working on Source Engine V1 should read at minimum:

```
docs/source-engine/README.md
docs/source-engine/STATUS.md
docs/source-engine/DECISIONS.md
docs/source-engine/PLAN.md
```

## Existing Architecture Reference

Yomirra's current source architecture is documented in:

- [docs/ARCHITECTURE.md](../ARCHITECTURE.md) — runtime layers, directory structure, data flow
- [docs/ADDING_A_SOURCE.md](../ADDING_A_SOURCE.md) — adapter creation guide and contract
- [docs/SCHEMA.md](../SCHEMA.md) — types, stores, API contracts

## Branch

All Source Engine V1 work will happen on a dedicated feature branch. See [STATUS.md](STATUS.md) for current branch info.
