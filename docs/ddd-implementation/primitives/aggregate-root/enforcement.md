# AggregateRoot: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism.

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Must extend `BaseEntity<TId>` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-base-entity`<br/>TypeScript enforces generic |
| Must collect domain events | ✅ ESLint | `@repo/eslint-plugin-ddd/require-event-collection-aggregate`<br/>Check for `getDomainEvents()` method |
| No cross-aggregate references | ✅ ESLint | `@repo/eslint-plugin-ddd/no-aggregate-references`<br/>Detect object refs to other aggregates |
| No infrastructure dependencies | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Path: `src/core/{context}/domain/entities/` | ✅ Generator + CI | Generator scaffolds path<br/>CI: `enforce-file-structure` |
| Static `create()` method | ✅ ESLint | `@repo/eslint-plugin-ddd/require-entity-factory` |
| `getDomainEvents()` accessor | ✅ ESLint | `@repo/eslint-plugin-ddd/require-event-accessor` |
| `clearDomainEvents()` method | ✅ ESLint | `@repo/eslint-plugin-ddd/require-event-clear` |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Stable identity | ✅ ESLint | `@repo/eslint-plugin-ddd/no-id-mutation` |
| Enforce aggregate invariants | ⚠️ Manual Review | Code review: "Are invariants enforced?" |
| Emit DomainEvents | ⚠️ Generator + Manual | Generator includes `addDomainEvent()` stub |
| Private child entities | ✅ ESLint | `@repo/eslint-plugin-ddd/require-private-children`<br/>Detect public child entity fields |
| Return `Result<T, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |
| No direct child mutation | ⚠️ Manual Review | Code review: "Are children readonly?" |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| No cross-aggregate object refs | ✅ ESLint | `@repo/eslint-plugin-ddd/no-aggregate-references` |
| Only ID-based references | ✅ ESLint | `@repo/eslint-plugin-ddd/aggregate-refs-by-id`<br/>Detect fields typed as other aggregates |
| Readonly child collections | ✅ ESLint | `@repo/eslint-plugin-ddd/readonly-child-collections`<br/>Detect `get items(): OrderItem[]` without readonly |
| No async in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-async-in-domain` |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Core unit test exists | ✅ CI Job | `test-coverage-check` fails if `{Name}.core.spec.ts` missing |
| Test aggregate invariants | ⚠️ Manual + Review | Generator includes stub, code review checks |
| Test child encapsulation | ⚠️ Manual Review | Code review: "Test verifies children are readonly?" |
| Test event emission | ⚠️ Manual + Review | Generator includes stub for event tests |
| No mocks in unit tests | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests` |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| No logging/tracing | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Use `Result<T, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |
| Event collection pattern | ✅ ESLint | `@repo/eslint-plugin-ddd/require-event-collection-aggregate` |
| Never throw for validation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Static factory method | ✅ Generator + ESLint | Generator scaffolds `create()`<br/>ESLint requires it |
| Behavior methods guard mutations | ⚠️ Manual Review | Code review: "Are mutations guarded?" |
| Deprecation with `@deprecated` | ✅ TypeScript | Compiler warns on usage |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Anemic aggregates | ⚠️ Manual Review | Code review: "Does aggregate enforce invariants?" |
| Large cluster | ⚠️ Manual Review | Code review: "Is cluster too large (>5 entities)?" |
| Direct child access | ✅ ESLint | `@repo/eslint-plugin-ddd/require-private-children`<br/>`readonly-child-collections` |
| Cross-aggregate object refs | ✅ ESLint | `@repo/eslint-plugin-ddd/no-aggregate-references` |
| Infrastructure leakage | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| Logging in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Example follows conventions | ✅ Generator | Generator uses canonical template |
| Event collection pattern shown | ✅ Generator | Template includes event methods |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Generator creates 4 files | ✅ Generator | Plop template generates:<br/>- Aggregate file<br/>- ID type<br/>- Core test<br/>- Fixture |
| Event methods scaffolded | ✅ Generator | Template includes getDomainEvents/clearDomainEvents |
| Required imports included | ✅ Generator | Template includes BaseEntity, Result, DomainError, DomainEvent |
| Inventory updated | ⚠️ Manual | Dev adds to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 13 | no-aggregate-references, readonly-child-collections, require-event-collection |
| **TypeScript compiler** | 3 | Generic constraints, export checks |
| **Generator (Nx + Plop)** | 6 | File scaffolding, event methods, test stubs |
| **CI jobs** | 2 | enforce-file-structure, test-coverage-check |
| **Manual review** | 7 | Invariant enforcement, child encapsulation, cluster size |

**Total requirements**: 31  
**Fully automated**: 21 (68%)  
**Partially automated**: 10 (32%)

---

## Enforcement Roadmap

### Phase 1: Generator (Week 1)
- ✅ Scaffold aggregate with BaseEntity
- ✅ Generate event collection methods
- ✅ Create core test with invariant stubs
- ✅ Create fixture factory

### Phase 2: ESLint Rules (Week 2-3)
- ✅ require-event-collection-aggregate
- ✅ require-event-accessor
- ✅ require-event-clear
- ✅ no-aggregate-references
- ✅ aggregate-refs-by-id
- ✅ require-private-children
- ✅ readonly-child-collections
- ✅ use-result-for-domain-ops
- ✅ no-throw-in-domain

### Phase 3: CI Jobs (Week 4)
- ✅ enforce-file-structure
- ✅ test-coverage-check

### Phase 4: Code Review Checklist (Week 4)
- ✅ Aggregate review: invariants, child encapsulation, cluster size, events
