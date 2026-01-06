# Factory: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism (ESLint rules, generators, CI checks, code review).

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Is stateless (no mutable fields) | ✅ ESLint | `@repo/eslint-plugin-ddd/factory-stateless`<br/>Detect `private`, `protected`, non-readonly fields |
| Has no entity identity | ⚠️ Manual Review | Code review: "Does factory extend Entity?" |
| Validates all invariants before returning | ⚠️ Manual Review | Code review: "Are all aggregate invariants checked?" |
| Returns complete aggregates (all-or-nothing) | ⚠️ Manual Review | Code review: "No partial aggregates returned?" |
| No infrastructure dependencies | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain`<br/>Block infrastructure/ imports |
| No observability dependencies | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain`<br/>Block Logger, Tracer, console |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Path: `src/core/{context}/domain/factories/` | ✅ Generator + CI | Nx generator scaffolds correct path<br/>CI job: `enforce-file-structure` fails if misplaced |
| Named `{AggregateNameFactory}.ts` | ✅ Generator | Template auto-generates correct filename |
| Export class with static methods | ✅ TypeScript | Compiler error if not exported |
| Methods return `Result<Aggregate, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/factory-return-result` |
| Separate methods for DTO and persistence | ⚠️ Manual Review | Code review: "Different methods for different sources?" |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Is stateless | ✅ ESLint | `@repo/eslint-plugin-ddd/factory-stateless` |
| Validates all required fields | ⚠️ Manual Review | Code review: "All fields validated before return?" |
| Reconstructs all ValueObjects | ⚠️ Manual Review | Code review: "ValueObjects validated?" |
| Checks all aggregate invariants | ⚠️ Manual Review | Code review: "Invariants enforced before return?" |
| Returns `Result<Aggregate, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/factory-return-result` |
| Never throws for expected failures | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |
| No side effects on input | ⚠️ Manual Review | Code review: "Input DTO/data unchanged?" |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Called by Repositories (reconstitute) | ⚠️ Manual Review | Code review: "Factory used in repo reconstitute path?" |
| Called by Use Cases (create from DTO) | ⚠️ Manual Review | Code review: "Factory used for new aggregate creation?" |
| May call Specifications for validation | ✅ ESLint | `@repo/eslint-plugin-ddd/factory-deps-allowed` |
| May call ValueObjects | ✅ ESLint | `@repo/eslint-plugin-ddd/factory-deps-allowed` |
| May call other Factories | ✅ ESLint | `@repo/eslint-plugin-ddd/factory-deps-allowed` |
| No logging or infrastructure | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain`<br/>`@repo/eslint-plugin-layers/no-infra-in-domain` |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| DTO creation tests exist | ✅ CI Job | `test-coverage-check` CI job<br/>Fail if `{Factory}.dto.spec.ts` missing |
| Persistence reconstitution tests exist | ✅ CI Job | `test-coverage-check` CI job<br/>Fail if `{Factory}.persistence.spec.ts` missing |
| Test happy path DTO creation | ⚠️ Manual + Generator | Generator includes test stubs<br/>Dev fills in success cases |
| Test missing required fields | ⚠️ Manual + Generator | Generator includes error case stubs |
| Test invalid field values | ⚠️ Manual + Generator | Generator includes validation error stubs |
| Test ValueObject reconstruction | ⚠️ Manual + Generator | Generator includes ValueObject test stubs |
| Test aggregate invariant validation | ⚠️ Manual + Generator | Generator includes invariant test stubs |
| Test happy path persistence reconstitution | ⚠️ Manual + Generator | Generator includes persistence success stubs |
| Test corrupted persistence data | ⚠️ Manual + Generator | Generator includes persistence error stubs |
| No mocks in core tests | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests` |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| No logging in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| No tracing in domain | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Never throws for validation failures | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-domain` |
| Use `Result<T, DomainError>` for failures | ✅ ESLint | `@repo/eslint-plugin-ddd/factory-return-result` |
| Error codes are domain-meaningful | ⚠️ Manual Review | Code review: "Are error codes descriptive?" |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Static methods (no instantiation) | ✅ ESLint | `@repo/eslint-plugin-ddd/factory-stateless` |
| Multiple creation paths supported | ⚠️ Manual Review | Code review: "Are different sources handled?" |
| Clear separation: DTO vs persistence | ⚠️ Manual Review | Code review: "Separate methods for different sources?" |
| Deprecation with `@deprecated` | ✅ TypeScript | Compiler warns on usage |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Incomplete aggregates | ⚠️ Manual Review | Code review: "All invariants checked before return?" |
| Partial failures (creating then discovering invalid state) | ⚠️ Manual Review | Code review: "Validation all upfront?" |
| Infrastructure in factory | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-domain` |
| Logging/tracing | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Anemic creation | ⚠️ Manual Review | Code review: "Are domain rules validated?" |
| Mutating input DTO/data | ⚠️ Manual Review | Code review: "Input parameters unchanged?" |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Example follows repo conventions | ✅ Generator | Generator uses canonical template |
| Shows DTO creation path | ✅ Generator | Template includes createFromDTO method |
| Shows persistence reconstitution path | ✅ Generator | Template includes reconstitute method |
| Imports from shared kernel | ✅ Generator | Generator includes `Result`, `DomainError` imports |
| ≤40 lines | ⚠️ Manual | Example kept short in spec, not enforced |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Generator creates 4 files | ✅ Generator | Plop template generates:<br/>- Factory class<br/>- DTO test<br/>- Persistence test<br/>- Fixture |
| Correct path structure | ✅ Generator | Hardcoded in template: `domain/factories/` |
| Required imports included | ✅ Generator | Template includes `Result`, `DomainError` |
| DTO creation method stub | ✅ Generator | Test file includes `createFromDTO` test stub |
| Persistence reconstitution method stub | ✅ Generator | Test file includes `reconstitute` test stub |
| Separate test files | ✅ Generator | Creates both `.dto.spec.ts` and `.persistence.spec.ts` |
| Inventory entry created | ⚠️ Manual | Dev manually adds entry to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 8 | factory-stateless, factory-return-result, no-infra-in-domain |
| **TypeScript compiler** | 2 | Export checks, @deprecated |
| **Generator (Nx + Plop)** | 7 | File scaffolding, path structure, imports, dual test stubs |
| **CI jobs** | 2 | enforce-file-structure, test-coverage-check |
| **Manual review** | 13 | Invariant validation, purity, composition, error codes, mutation checks |

**Total requirements**: 32  
**Fully automated**: 17 (53%)  
**Partially automated**: 15 (47%)
