# Entity: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism (ESLint rules, generators, CI checks, etc.).

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Must extend `BaseEntity<TId>` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-base-entity`<br/>TypeScript compiler enforces generic |
| Must use branded ID type | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-branded-id`<br/>Check `TId extends Brand<string, any>` |
| No infrastructure dependencies | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain`<br/>Fail if entity imports from infrastructure/ |
| No observability dependencies | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain`<br/>Block Logger, Tracer, Metrics in domain/ |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Path: `src/core/{context}/domain/entities/` | ✅ Generator + CI | Nx generator scaffolds correct path<br/>CI job: `enforce-file-structure` fails if misplaced |
| Must have static `create()` method | ✅ ESLint | `@repo/eslint-plugin-ddd/require-entity-factory`<br/>Require static method returning `Result<Entity, DomainError>` |
| Must export entity class | ✅ TypeScript | Compiler error if not exported |
| Must have `get id()` accessor | ✅ ESLint | `@repo/eslint-plugin-ddd/require-id-getter`<br/>Check for public readonly id getter |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| ID never changes after creation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-id-mutation`<br/>Detect `this.id =` or `this._id =` after constructor |
| Use branded ID type | ✅ TypeScript | Compiler enforces `TId extends Brand<...>` |
| Validate in factory/methods | ⚠️ Manual Review | Code review checklist: "Does create() validate all inputs?" |
| Return `Result<T, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops`<br/>Methods must return Result, not throw |
| Emit DomainEvents | ⚠️ Generator + Manual | Generator includes `addDomainEvent()` call stub<br/>Dev fills in event emission |
| Never throw for domain failures | ✅ ESLint + CI | `@repo/eslint-plugin-ddd/no-throw-in-domain`<br/>Detect `throw new Error` in domain/ (allow only asserts) |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| No infrastructure calls | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain`<br/>Block imports from infrastructure/ |
| Only call ValueObjects, Specs, Events | ✅ ESLint | `@repo/eslint-plugin-layers/domain-allowed-deps`<br/>Whitelist: value-objects/, events/, policies/ |
| Return `Result<T, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |
| No async in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-async-in-domain`<br/>Detect `async` keyword in domain/ |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Core unit test exists | ✅ CI Job | `test-coverage-check` CI job<br/>Fail if `{Name}.core.spec.ts` missing |
| Test identity stability | ⚠️ Manual + Review | Generator includes test stub<br/>Code review: "Does test verify ID immutability?" |
| Test factory validation | ⚠️ Manual + Review | Generator includes test stub for `create()` |
| Test state transitions | ⚠️ Manual + Review | Code review checklist |
| Test event emission | ⚠️ Manual + Review | Generator includes test stub for `addDomainEvent()` |
| No mocks in unit tests | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests`<br/>Fail if `.spec.ts` imports jest.mock in domain/ |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| No logging/tracing | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain`<br/>Block Logger, span, console.log |
| Use `Result<T, DomainError>` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |
| DomainError has code + message | ✅ TypeScript | Compiler enforces DomainError interface |
| Never throw for validation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Static factory method | ✅ Generator + ESLint | Generator scaffolds `create()`<br/>ESLint requires it |
| Return new instance or guard mutation | ⚠️ Manual Review | Code review: "Are mutations guarded?" |
| Soft delete or repository delete | ⚠️ Manual Review | Code review: "Is deletion handled correctly?" |
| Deprecation with `@deprecated` | ✅ TypeScript | Compiler warns on usage of deprecated symbol |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Anemic entities (only getters) | ⚠️ Manual Review | Code review: "Does entity have behavior methods?" |
| Infrastructure leakage | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| Logging in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Primitive obsession (string ID) | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-branded-id` |
| Throwing for validation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |
| Mutable IDs | ✅ ESLint | `@repo/eslint-plugin-ddd/no-id-mutation` |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Example follows repo conventions | ✅ Generator | Generator uses canonical template |
| Imports from shared kernel | ✅ Generator | Generator includes imports from @shared/kernel |
| ≤40 lines | ⚠️ Manual | Example kept short in spec, not enforced |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Generator creates 4 files | ✅ Generator | Plop template generates:<br/>- Entity file<br/>- ID type<br/>- Core test<br/>- Fixture |
| Correct path structure | ✅ Generator | Hardcoded in template |
| Required imports included | ✅ Generator | Template includes BaseEntity, Result, DomainError |
| Inventory updated | ⚠️ Manual | Dev manually adds entry to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 12 | require-base-entity, no-infra-in-domain, no-throw-in-domain |
| **TypeScript compiler** | 5 | Generic constraints, export checks, DomainError interface |
| **Generator (Nx + Plop)** | 6 | File scaffolding, path structure, imports, test stubs |
| **CI jobs** | 2 | enforce-file-structure, test-coverage-check |
| **Manual review** | 8 | Validation logic, state transitions, event emission |

**Total requirements**: 33  
**Fully automated**: 23 (70%)  
**Partially automated**: 10 (30%)

**Note**: "Partially automated" items have scaffolding or stubs from generators but require manual implementation and code review.

---

## Enforcement Roadmap

### Phase 1: Generator (Week 1)
- ✅ Scaffold entity file with BaseEntity
- ✅ Generate branded ID type
- ✅ Create core test with stubs
- ✅ Create fixture factory

### Phase 2: ESLint Rules (Week 2-3)
- ✅ require-base-entity
- ✅ require-branded-id
- ✅ no-infra-in-domain
- ✅ no-observability-in-domain
- ✅ require-entity-factory
- ✅ no-id-mutation
- ✅ use-result-for-domain-ops
- ✅ no-throw-in-domain
- ✅ no-async-in-domain

### Phase 3: CI Jobs (Week 4)
- ✅ enforce-file-structure
- ✅ test-coverage-check

### Phase 4: Code Review Checklist (Week 4)
- ✅ Entity review checklist with validation, behavior, event emission checks
