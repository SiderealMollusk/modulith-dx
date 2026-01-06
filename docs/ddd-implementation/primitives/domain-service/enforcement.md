# DomainService: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism (ESLint rules, generators, CI checks, code review).

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Is stateless (no mutable fields) | ✅ ESLint | `@repo/eslint-plugin-ddd/domain-service-stateless`<br/>Detect `private`, `protected`, non-readonly fields |
| Has no entity identity | ⚠️ Manual Review | Code review: "Does service extend Entity or have ID?" |
| Coordinates multiple aggregates | ⚠️ Manual Review | Code review: "Does service operate on passed aggregates?" |
| No infrastructure dependencies | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain`<br/>Block infrastructure/ imports |
| No observability dependencies | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain`<br/>Block Logger, Tracer, console in domain/ |
| No logging/tracing/metrics | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Path: `src/core/{context}/domain/services/` | ✅ Generator + CI | Nx generator scaffolds correct path<br/>CI job: `enforce-file-structure` fails if misplaced |
| Named `{ServiceName}Service.ts` | ✅ Generator | Template auto-generates correct filename |
| Export class with static or instance methods | ✅ TypeScript | Compiler error if not exported |
| Methods return `Result<T, DomainError>` or primitive | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Is stateless | ✅ ESLint | `@repo/eslint-plugin-ddd/domain-service-stateless` |
| No state mutation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-mutation-in-domain` |
| No side effects on parameters | ⚠️ Manual Review | Code review: "Are passed aggregates mutated?" |
| Methods are pure functions | ⚠️ Manual Review | Code review: "Same input = same output always?" |
| Return `Result<T, DomainError>` for failures | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |
| Never throw for expected failures | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Called by Entities, Aggregates, Use Cases | ⚠️ Manual Review | Code review: "Is service called appropriately?" |
| May call other Domain Services | ✅ ESLint | `@repo/eslint-plugin-ddd/domain-service-deps-allowed`<br/>Allow domain/services imports |
| May call Specifications | ✅ ESLint | `@repo/eslint-plugin-ddd/domain-service-deps-allowed` |
| May call Repositories (queries only) | ⚠️ Manual Review | Code review: "Repository calls read-only?" |
| No logging or infrastructure | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain`<br/>`@repo/eslint-plugin-layers/no-infra-in-domain` |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Core unit test exists | ✅ CI Job | `test-coverage-check` CI job<br/>Fail if `{Service}.core.spec.ts` missing |
| Test happy path (success) | ⚠️ Manual + Generator | Generator includes test stubs<br/>Dev fills in success cases |
| Test error cases (business rule failures) | ⚠️ Manual + Generator | Generator includes error case stubs |
| Test coordination between aggregates | ⚠️ Manual + Generator | Generator includes composition test stubs |
| Test purity (no side effects) | ⚠️ Manual | Code review: "Are aggregates unchanged after call?" |
| No mocks in core tests | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests` |
| Use real domain objects | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests` |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| No logging in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| No tracing in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Never throws for expected failures | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |
| Use `Result<T, DomainError>` for failures | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-domain-ops` |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Stateless (no initialization needed) | ✅ ESLint | `@repo/eslint-plugin-ddd/domain-service-stateless` |
| Methods are operations, not state | ⚠️ Manual Review | Code review: "Are methods stateless operations?" |
| Composition via constructor injection or method params | ⚠️ Manual Review | Code review: "Is composition clear?" |
| Deprecation with `@deprecated` | ✅ TypeScript | Compiler warns on usage |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Stateful services | ✅ ESLint | `@repo/eslint-plugin-ddd/domain-service-stateless` |
| Infrastructure access | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| Repository writes | ⚠️ Manual Review | Code review: "Are repository calls read-only?" |
| Logging/tracing | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Throwing exceptions | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |
| Mutating parameters | ✅ ESLint | `@repo/eslint-plugin-ddd/no-mutation-in-domain` |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Example follows repo conventions | ✅ Generator | Generator uses canonical template |
| Imports from shared kernel | ✅ Generator | Generator includes `Result`, `DomainError` imports |
| ≤40 lines | ⚠️ Manual | Example kept short in spec, not enforced |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Generator creates 3 files | ✅ Generator | Plop template generates:<br/>- Service class<br/>- Core test<br/>- Fixture |
| Correct path structure | ✅ Generator | Hardcoded in template: `domain/services/` |
| Required imports included | ✅ Generator | Template includes `Result`, `DomainError` |
| Test stubs created | ✅ Generator | Test file includes stubs for happy/error/composition paths |
| Inventory entry created | ⚠️ Manual | Dev manually adds entry to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 8 | domain-service-stateless, no-infra-in-domain, use-result-for-domain-ops |
| **TypeScript compiler** | 2 | Export checks, @deprecated |
| **Generator (Nx + Plop)** | 5 | File scaffolding, path structure, imports, test stubs |
| **CI jobs** | 2 | enforce-file-structure, test-coverage-check |
| **Manual review** | 7 | Purity, composition, repository queries, mutation checks |

**Total requirements**: 24  
**Fully automated**: 15 (63%)  
**Partially automated**: 9 (37%)
