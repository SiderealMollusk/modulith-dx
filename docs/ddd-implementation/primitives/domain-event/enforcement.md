# DomainEvent: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism.

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Must extend `DomainEvent` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-domain-event-base`<br/>TypeScript enforces extends |
| No entity object references | ✅ ESLint | `@repo/eslint-plugin-ddd/no-entity-refs-in-events`<br/>Detect fields typed as Entity |
| No infrastructure dependencies | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| No observability dependencies | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Path: `src/core/{context}/domain/events/` | ✅ Generator + CI | Generator scaffolds path<br/>CI: `enforce-file-structure` |
| Static factory method | ⚠️ Generator | Generator includes `create()` stub (optional pattern) |
| Event-specific getters | ⚠️ Manual | Dev adds public readonly fields |
| `toPrimitives()` implementation | ✅ ESLint | `@repo/eslint-plugin-ddd/require-event-serialization`<br/>Check for toPrimitives method |
| Must export class | ✅ TypeScript | Compiler error if not exported |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Immutable (readonly fields) | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-event-fields`<br/>Detect mutable fields |
| Unique event ID | ✅ Base Class | DomainEvent base class auto-generates UUID |
| `occurredOn` timestamp | ✅ Base Class | DomainEvent base class sets timestamp in constructor |
| Include aggregate/entity ID | ⚠️ Manual Review | Code review: "Does event include entity ID?" |
| Serializable to JSON | ✅ ESLint | `@repo/eslint-plugin-ddd/event-json-serializable`<br/>Detect functions, circular refs in fields |
| Versioning field | ⚠️ Manual Review | Code review: "Does event have version field?" (recommended) |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Only ID-based references | ✅ ESLint | `@repo/eslint-plugin-ddd/no-entity-refs-in-events` |
| Only call ValueObjects/primitives | ✅ ESLint | `@repo/eslint-plugin-layers/domain-allowed-deps` |
| Return event from factory | ✅ TypeScript | Type checking enforces return type |
| Return primitives from toPrimitives | ✅ ESLint | `@repo/eslint-plugin-ddd/primitives-return-record`<br/>Check return type is Record<string, any> |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Core unit test exists | ✅ CI Job | `test-coverage-check` fails if `{EventName}.core.spec.ts` missing |
| Test immutability | ⚠️ Manual + Review | Generator includes stub, code review checks |
| Test serialization | ⚠️ Manual + Review | Generator includes `toPrimitives()` test stub |
| Test event ID uniqueness | ⚠️ Manual + Review | Generator includes UUID format check stub |
| Test occurredOn | ⚠️ Manual + Review | Generator includes timestamp check stub |
| No mocks in unit tests | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests` |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| No logging/tracing in event | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Throw for missing fields | ⚠️ Manual | Dev implements constructor validation |
| No error handling in getters | ⚠️ Manual Review | Code review: "Are getters simple accessors?" |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Static factory or constructor | ✅ Generator | Generator scaffolds `create()` method |
| Immutability (no modification) | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-event-fields` |
| Version field for evolution | ⚠️ Generator | Generator includes `version = 1` stub (commented) |
| Deprecation with `@deprecated` | ✅ TypeScript | Compiler warns on usage |
| Never delete events | ⚠️ Manual Review | Code review: "Are events being deleted?" (forbidden) |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Mutable events | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-event-fields` |
| Business logic in events | ⚠️ Manual Review | Code review: "Does event contain logic?" (should be data only) |
| Entity references | ✅ ESLint | `@repo/eslint-plugin-ddd/no-entity-refs-in-events` |
| Infrastructure leakage | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| Logging in events | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Missing entity/aggregate ID | ⚠️ Manual Review | Code review checklist |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Example follows conventions | ✅ Generator | Generator uses canonical template |
| Includes version field | ✅ Generator | Template includes `version = 1` |
| Includes serialization | ✅ Generator | Template includes `toPrimitives()` stub |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Generator creates 3 files | ✅ Generator | Plop template generates:<br/>- Event file<br/>- Core test<br/>- Fixture |
| Correct path structure | ✅ Generator | Hardcoded in template |
| Required imports included | ✅ Generator | Template includes DomainEvent |
| Inventory updated | ⚠️ Manual | Dev adds to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 9 | require-domain-event-base, no-entity-refs-in-events, require-event-serialization |
| **TypeScript compiler** | 3 | Extends check, export check, return type |
| **Base class** | 2 | Auto-generate UUID, auto-set timestamp |
| **Generator (Nx + Plop)** | 5 | File scaffolding, version field, test stubs |
| **CI jobs** | 2 | enforce-file-structure, test-coverage-check |
| **Manual review** | 8 | Entity ID inclusion, versioning, logic-free events |

**Total requirements**: 29  
**Fully automated**: 17 (59%)  
**Partially automated**: 12 (41%)

---

## Enforcement Roadmap

### Phase 1: Base Class (Week 1)
- ✅ DomainEvent base with auto-generated UUID
- ✅ Auto-set occurredOn timestamp

### Phase 2: Generator (Week 1)
- ✅ Scaffold event with DomainEvent base
- ✅ Include version field stub
- ✅ Include toPrimitives() stub
- ✅ Create core test with serialization stubs
- ✅ Create fixture factory

### Phase 3: ESLint Rules (Week 2-3)
- ✅ require-domain-event-base
- ✅ require-readonly-event-fields
- ✅ no-entity-refs-in-events
- ✅ require-event-serialization
- ✅ event-json-serializable
- ✅ primitives-return-record
- ✅ no-observability-in-domain

### Phase 4: CI Jobs (Week 4)
- ✅ enforce-file-structure
- ✅ test-coverage-check

### Phase 5: Code Review Checklist (Week 4)
- ✅ Event review: includes entity ID, versioned, immutable, serializable, logic-free
