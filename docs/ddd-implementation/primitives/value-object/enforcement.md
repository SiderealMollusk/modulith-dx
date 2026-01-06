# ValueObject: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism.

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Must extend `ValueObject<T>` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-value-object-base`<br/>TypeScript enforces generic |
| No identity (no ID field) | ✅ ESLint | `@repo/eslint-plugin-ddd/no-id-in-value-object`<br/>Detect `id`, `_id` fields |
| No infrastructure dependencies | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| No observability dependencies | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Path: `src/core/{context}/domain/value-objects/` | ✅ Generator + CI | Generator scaffolds correct path<br/>CI job: `enforce-file-structure` |
| Private constructor | ✅ ESLint | `@repo/eslint-plugin-ddd/require-private-constructor-vo`<br/>Force static factory pattern |
| Must have static `create()` | ✅ ESLint | `@repo/eslint-plugin-ddd/require-vo-factory` |
| Must export class | ✅ TypeScript | Compiler error if not exported |
| Must have `get value()` | ✅ ESLint | `@repo/eslint-plugin-ddd/require-value-getter` |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Immutable (readonly fields) | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-fields-vo`<br/>Detect mutable fields |
| Validate in `create()` | ⚠️ Manual Review | Code review: "Does create() validate inputs?" |
| Implement `equals()` | ✅ ESLint | `@repo/eslint-plugin-ddd/require-equals-method` |
| Return `Result<T, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |
| Serializable (`toPrimitives()`) | ✅ ESLint | `@repo/eslint-plugin-ddd/require-to-primitives` |
| Never throw for validation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| No infrastructure calls | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| Only call other VOs, Specs | ✅ ESLint | `@repo/eslint-plugin-layers/domain-allowed-deps` |
| Return `Result<T, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |
| No async in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-async-in-domain` |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Core unit test exists | ✅ CI Job | `test-coverage-check` fails if `{Name}.core.spec.ts` missing |
| Test factory validation | ⚠️ Manual + Review | Generator includes stub, code review checks |
| Test equality | ⚠️ Manual + Review | Generator includes stub for `equals()` test |
| Test immutability | ✅ ESLint + Test | `@repo/eslint-plugin-ddd/require-readonly-fields-vo`<br/>Test verifies no mutation |
| Test edge cases | ⚠️ Manual Review | Code review checklist |
| No mocks in unit tests | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests` |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| No logging/tracing | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Use `Result<T, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |
| DomainError has code + message | ✅ TypeScript | Compiler enforces DomainError interface |
| Never throw for validation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Static factory method | ✅ Generator + ESLint | Generator scaffolds `create()`<br/>ESLint requires it |
| Immutability (no modification) | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-fields-vo` |
| Deprecation with `@deprecated` | ✅ TypeScript | Compiler warns on usage |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Mutable value objects | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-fields-vo` |
| Identity in value objects | ✅ ESLint | `@repo/eslint-plugin-ddd/no-id-in-value-object` |
| Infrastructure leakage | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| Logging in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Throwing for validation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |
| Primitive obsession | ⚠️ Manual Review | Code review: "Should this string be a ValueObject?" |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Example follows conventions | ✅ Generator | Generator uses canonical template |
| Imports from shared kernel | ✅ Generator | Template includes ValueObject, Result, DomainError |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Generator creates 3 files | ✅ Generator | Plop template generates:<br/>- ValueObject file<br/>- Core test<br/>- Fixture |
| Correct path structure | ✅ Generator | Hardcoded in template |
| Required imports included | ✅ Generator | Template includes ValueObject, Result, DomainError |
| Inventory updated | ⚠️ Manual | Dev adds entry to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 13 | require-value-object-base, require-readonly-fields-vo, no-id-in-value-object |
| **TypeScript compiler** | 4 | Generic constraints, export checks, DomainError interface |
| **Generator (Nx + Plop)** | 5 | File scaffolding, path, imports, test stubs |
| **CI jobs** | 2 | enforce-file-structure, test-coverage-check |
| **Manual review** | 5 | Validation logic, equality implementation, edge cases |

**Total requirements**: 29  
**Fully automated**: 22 (76%)  
**Partially automated**: 7 (24%)

---

## Enforcement Roadmap

### Phase 1: Generator (Week 1)
- ✅ Scaffold ValueObject with private constructor
- ✅ Generate core test with stubs
- ✅ Create fixture factory

### Phase 2: ESLint Rules (Week 2-3)
- ✅ require-value-object-base
- ✅ require-private-constructor-vo
- ✅ require-vo-factory
- ✅ require-readonly-fields-vo
- ✅ no-id-in-value-object
- ✅ require-equals-method
- ✅ require-to-primitives
- ✅ use-result-for-domain-ops
- ✅ no-throw-in-domain
- ✅ no-async-in-domain

### Phase 3: CI Jobs (Week 4)
- ✅ enforce-file-structure
- ✅ test-coverage-check

### Phase 4: Code Review Checklist (Week 4)
- ✅ ValueObject checklist: validation, equality, immutability, serialization
