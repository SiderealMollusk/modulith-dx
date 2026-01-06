# Specification: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism (ESLint rules, generators, CI checks, code review).

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Implement `Specification<T>` interface | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-specification-interface`<br/>TypeScript enforces interface implementation |
| Declare `isSatisfiedBy(candidate: T): boolean` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-specification-method`<br/>Compiler error if method missing |
| Is stateless (no mutable fields) | ✅ ESLint | `@repo/eslint-plugin-ddd/specification-stateless`<br/>Detect `private`, `protected`, non-readonly fields |
| Is deterministic (same input = same result) | ⚠️ Manual Review | Code review: "Is isSatisfiedBy free of time/random dependencies?" |
| No infrastructure dependencies | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain`<br/>Block infrastructure/ imports |
| No observability dependencies | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain`<br/>Block Logger, Tracer in domain/ |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Path: `src/core/{context}/domain/policies/` | ✅ Generator + CI | Nx generator scaffolds correct path<br/>CI job: `enforce-file-structure` fails if misplaced |
| Named `{RuleName}Policy.ts` | ✅ Generator | Template auto-generates correct filename |
| Export class implementing `Specification<T>` | ✅ TypeScript | Compiler error if not exported or wrong type |
| Extend or implement `Specification<T>` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-specification-interface` |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| `isSatisfiedBy()` is pure function | ⚠️ Manual Review | Code review: "No side effects, no state mutation?" |
| No mutation of parameter | ✅ ESLint | `@repo/eslint-plugin-ddd/no-mutation-in-domain`<br/>Detect reassignments to parameters |
| Deterministic (no Date, Math.random, async) | ✅ ESLint | `@repo/eslint-plugin-ddd/specification-deterministic`<br/>Block Date usage, Math.random(), async/await |
| Returns boolean (never throws) | ✅ TypeScript + ESLint | Compiler enforces return type<br/>`@repo/eslint-plugin-ddd/no-throw-in-domain` |
| Readonly fields only | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-fields` |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Called by Entities/Aggregates/Services | ⚠️ Manual Review | Code review: "Is spec used for validation?" |
| May compose other Specifications | ✅ ESLint | `@repo/eslint-plugin-ddd/specification-composition-allowed`<br/>Allow Specification imports |
| No logging or tracing | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| No infrastructure access | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Core unit test exists | ✅ CI Job | `test-coverage-check` CI job<br/>Fail if `{Policy}.spec.ts` missing |
| Test happy path (satisfied) | ⚠️ Manual + Generator | Generator includes test stubs<br/>Dev fills in test cases |
| Test failure path (not satisfied) | ⚠️ Manual + Generator | Generator includes test stub for false cases |
| Test composition (and/or/not) | ⚠️ Manual + Generator | Generator includes composition test stubs |
| Test determinism | ⚠️ Manual | Code review: "Are tests deterministic?" |
| No mocks in core tests | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests` |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| No logging in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| No tracing in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Never throws (returns boolean) | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/no-throw-in-domain`<br/>Compiler enforces return type |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Immutable after construction | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-fields` |
| Composition support (and/or/not) | ⚠️ Manual Review | Code review: "Can spec be composed?" |
| Deprecation with `@deprecated` | ✅ TypeScript | Compiler warns on usage |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Stateful specifications | ✅ ESLint | `@repo/eslint-plugin-ddd/specification-stateless` |
| Infrastructure access | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| Throwing exceptions | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |
| Observability in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Non-deterministic logic | ✅ ESLint | `@repo/eslint-plugin-ddd/specification-deterministic` |
| Mutating parameters | ✅ ESLint | `@repo/eslint-plugin-ddd/no-mutation-in-domain` |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Example follows repo conventions | ✅ Generator | Generator uses canonical template |
| Imports from shared kernel | ✅ Generator | Generator includes `Specification<T>` import |
| ≤40 lines | ⚠️ Manual | Example kept short in spec, not enforced |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Generator creates 3 files | ✅ Generator | Plop template generates:<br/>- Policy class<br/>- Core test<br/>- Fixture |
| Correct path structure | ✅ Generator | Hardcoded in template: `domain/policies/` |
| Required imports included | ✅ Generator | Template includes `Specification<T>` |
| Test stubs created | ✅ Generator | Test file includes stubs for happy/failure/composition paths |
| Inventory entry created | ⚠️ Manual | Dev manually adds entry to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 9 | require-specification-interface, specification-stateless, specification-deterministic |
| **TypeScript compiler** | 3 | Interface implementation, return type, export checks |
| **Generator (Nx + Plop)** | 5 | File scaffolding, path structure, imports, test stubs |
| **CI jobs** | 2 | enforce-file-structure, test-coverage-check |
| **Manual review** | 6 | Purity, determinism, composition, test coverage |

**Total requirements**: 25  
**Fully automated**: 16 (64%)  
**Partially automated**: 9 (36%)
