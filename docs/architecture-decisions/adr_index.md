# Architecture Decision Records Index

## Accepted (Live Decisions)

| # | Decision | Deciders | Date | Enforcement |
|---|----------|----------|------|-------------|
| 001 | [Domain Layer Pure (No Observability)](./accepted/domain-layer-pure.md) | Virgil | 2026-01-05 | ESLint: no-logging-in-domain |
| 002 | [Command & Query as Primitives](./accepted/command-query-as-primitives.md) | Virgil | 2026-01-05 | ESLint: require-command-base, require-query-base |
| 003 | [Result Type Over Exceptions](./accepted/result-type-over-exceptions.md) | Virgil | 2026-01-05 | ESLint: no-throw-in-application |
| 004 | [Repository Port-Adapter Split](./accepted/repository-port-adapter-split.md) | Virgil | 2026-01-05 | File structure: ports/ vs adapters/ |
| 005 | [Observability at Boundaries Only](./accepted/observability-at-boundaries.md) | Virgil | 2026-01-05 | Base classes: BaseUseCase, BaseHandler |
| 006 | [Automation-First Enforcement (60%+)](./accepted/automation-first-enforcement.md) | Virgil | 2026-01-05 | CI: ESLint + Generator + Coverage |
| 007 | [Context-First Directory Structure](./accepted/context-first-directory.md) | Virgil | 2026-01-05 | File structure check CI job |
| 008 | [Single Primitive Per File](./accepted/single-primitive-per-file.md) | Virgil | 2026-01-05 | ESLint: one-{primitive}-per-file |
| 009 | [Brand Types for Entity IDs](./accepted/brand-types-for-ids.md) | Virgil | 2026-01-05 | TypeScript: Brand<string, TName> |
| 010 | [Static Factories for Domain Objects](./accepted/static-factories.md) | Virgil | 2026-01-05 | ESLint: require-{primitive}-factory |
| 011 | [Immutability in Domain Layer](./accepted/immutability-in-domain.md) | Virgil | 2026-01-05 | ESLint: require-readonly-fields |
| 012 | [Zod for Validation Schemas](./accepted/zod-for-validation.md) | Virgil | 2026-01-05 | ESLint: require-{primitive}-validation |
| 013 | [Event Collection in Aggregates](./accepted/event-collection-not-dispatch.md) | Virgil | 2026-01-05 | ESLint: no-event-dispatch-in-aggregate |

## Proposed (Under Discussion)

| # | Decision | Deciders | Date | Status |
|---|----------|----------|------|--------|
| - | - | - | - | - |

## Deprecated (No Longer Valid)

| # | Decision | Deprecated | Reason |
|---|----------|------------|--------|
| - | - | - | - |

## Superseded (Replaced)

| # | Decision | Superseded By | Date |
|---|----------|---------------|------|
| - | - | - | - |

---

## How to Use

**Creating new ADR**:
1. Copy `template.md` to `proposed/{decision-slug}.md`
2. Fill in template
3. Add to "Proposed" section above
4. After approval, move to `accepted/` and update index

**Checking compliance**:
- See "Enforcement" column for automation mechanisms
- Run `npm run lint` for ESLint checks
- Run `npm run test:coverage` for test requirements
- Check CI job `enforce-file-structure` for path/naming

**Finding related docs**:
- Implementation specs: [DDD Primitives](../ddd-implementation/primitives/)
- Enforcement details: Each primitive's `enforcement.md`
- Observability: [OBSERVABILITY_INVENTORY](../enforced-architecture/OBSERVABILITY_INVENTORY/)
