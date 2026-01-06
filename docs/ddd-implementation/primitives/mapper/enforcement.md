# Mapper: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism (ESLint rules, generators, CI checks, code review).

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Is pure transformation | ⚠️ Manual Review | Code review: "No side effects, no business logic?" |
| Is stateless | ✅ ESLint | `@repo/eslint-plugin-ddd/mapper-stateless`<br/>Detect `private`, `protected`, non-readonly fields |
| Is deterministic (same input = same output) | ⚠️ Manual Review | Code review: "No time/random/external dependencies?" |
| No business logic (validation belongs in Factory) | ⚠️ Manual Review | Code review: "Only transformations, no business rules?" |
| Keeps layers decoupled | ⚠️ Manual Review | Code review: "Transformation needed for layer separation?" |
| No observability dependencies | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-mapper`<br/>Block Logger, Tracer, console |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| DTO mappers: `src/core/{context}/application/mappers/` | ✅ Generator + CI | Nx generator scaffolds correct path<br/>CI job: `enforce-file-structure` fails if misplaced |
| Persistence mappers: `src/core/{context}/infrastructure/mappers/` | ✅ Generator + CI | Nx generator scaffolds correct path<br/>CI job: `enforce-file-structure` fails if misplaced |
| Named `{EntityName}Mapper.ts` | ✅ Generator | Template auto-generates correct filename |
| Export class with static methods | ✅ TypeScript | Compiler error if not exported |
| Methods return transformed type or `Result<T, DomainError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/mapper-return-type` |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Is stateless | ✅ ESLint | `@repo/eslint-plugin-ddd/mapper-stateless` |
| Is pure (no side effects) | ⚠️ Manual Review | Code review: "Source objects/DTOs unchanged?" |
| Is idempotent (applying twice = applying once) | ⚠️ Manual Review | Code review: "No state changes between calls?" |
| No parameter mutation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-mutation-in-mapper` |
| Handles null/undefined gracefully | ⚠️ Manual Review | Code review: "Null handling consistent?" |
| Returns `Result<T, DomainError>` for uncertain mappings | ✅ ESLint | `@repo/eslint-plugin-ddd/mapper-return-type` |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Called by Use Cases (DTO → Domain) | ⚠️ Manual Review | Code review: "Mapper used by use cases?" |
| Called by Repository Adapters (DB → Domain) | ⚠️ Manual Review | Code review: "Mapper used in repo adapter?" |
| Called by API endpoints (Domain → response) | ⚠️ Manual Review | Code review: "Mapper used for responses?" |
| May call ValueObjects | ✅ ESLint | `@repo/eslint-plugin-ddd/mapper-deps-allowed` |
| May call other Mappers | ✅ ESLint | `@repo/eslint-plugin-ddd/mapper-deps-allowed` |
| No logging or infrastructure | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-mapper`<br/>`@repo/eslint-plugin-layers/no-infra-in-mapper` |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| DTO→Domain test exists | ✅ CI Job | `test-coverage-check` CI job<br/>Fail if `{Mapper}.toDomain.spec.ts` missing |
| Domain→DTO test exists | ✅ CI Job | `test-coverage-check` CI job<br/>Fail if `{Mapper}.toDto.spec.ts` missing |
| Persistence round-trip test exists | ✅ CI Job | `test-coverage-check` CI job<br/>Fail if `{Mapper}.persistence.spec.ts` missing |
| Test happy path DTO→Domain | ⚠️ Manual + Generator | Generator includes test stubs<br/>Dev fills in cases |
| Test missing required fields | ⚠️ Manual + Generator | Generator includes error case stubs |
| Test invalid field types | ⚠️ Manual + Generator | Generator includes type validation stubs |
| Test type coercion (string→number) | ⚠️ Manual + Generator | Generator includes coercion test stubs |
| Test Domain→DTO round-trip | ⚠️ Manual + Generator | Generator includes round-trip stubs |
| Test DB→Domain round-trip | ⚠️ Manual + Generator | Generator includes persistence stubs |
| Test purity (no mutations) | ⚠️ Manual | Code review: "Source unchanged?" |
| No mocks in core tests | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests` |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| No logging in mappers | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-mapper` |
| No tracing in mappers | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-mapper` |
| Use `Result<T, DomainError>` for uncertain mappings | ✅ ESLint | `@repo/eslint-plugin-ddd/mapper-return-type` |
| Never throw for type mismatches | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-mapper` |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Static methods (no instantiation) | ✅ ESLint | `@repo/eslint-plugin-ddd/mapper-stateless` |
| Multiple mapping directions supported | ⚠️ Manual Review | Code review: "Different methods for different directions?" |
| Composition via method chaining | ⚠️ Manual Review | Code review: "Nested object mapping clear?" |
| Deprecation with `@deprecated` | ✅ TypeScript | Compiler warns on usage |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Business logic in mapper | ⚠️ Manual Review | Code review: "Only transformations, no rules?" |
| Validation in mapper | ⚠️ Manual Review | Code review: "Validation in Factory, not mapper?" |
| Mutable state | ✅ ESLint | `@repo/eslint-plugin-ddd/mapper-stateless` |
| Mutating parameters | ✅ ESLint | `@repo/eslint-plugin-ddd/no-mutation-in-mapper` |
| Logging/tracing | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-mapper` |
| Infrastructure access | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-mapper` |
| Type casting without mapping | ⚠️ Manual Review | Code review: "Using `as` instead of proper mapping?" |
| Incomplete mapping (missing fields) | ⚠️ Manual Review | Code review: "All fields mapped?" |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Example shows DTO→Domain mapping | ✅ Generator | Template includes toDomain method |
| Example shows Domain→DTO mapping | ✅ Generator | Template includes toDto method |
| Example shows persistence mapping | ✅ Generator | Template includes toPersistence/fromPersistence |
| Imports from shared kernel | ✅ Generator | Generator includes `Result`, `DomainError` imports |
| ≤40 lines | ⚠️ Manual | Example kept short in spec, not enforced |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Generator creates DTO mapper | ✅ Generator | Plop template generates:<br/>- DTO mapper class<br/>- DTO test file<br/>- Fixture |
| Generator creates persistence mapper | ✅ Generator | Plop template generates:<br/>- Persistence mapper class<br/>- Persistence test file<br/>- Fixture |
| Correct path structure (DTO vs persistence) | ✅ Generator | Hardcoded in template by type parameter |
| Required imports included | ✅ Generator | Template includes `Result`, `DomainError` |
| Dual mapping stubs (toDomain, toDto) | ✅ Generator | Test file includes both direction stubs |
| Round-trip test stubs | ✅ Generator | Test includes round-trip validation stubs |
| Inventory entry created | ⚠️ Manual | Dev manually adds entry to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 10 | mapper-stateless, mapper-return-type, no-mutation-in-mapper |
| **TypeScript compiler** | 2 | Export checks, @deprecated |
| **Generator (Nx + Plop)** | 8 | Dual mappers, path structure, imports, test stubs |
| **CI jobs** | 3 | enforce-file-structure, test-coverage-check (DTO, persistence) |
| **Manual review** | 13 | Purity, business logic detection, field mapping, composition |

**Total requirements**: 36  
**Fully automated**: 18 (50%)  
**Partially automated**: 18 (50%)
