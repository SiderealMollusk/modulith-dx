# Command: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism (ESLint rules, generators, CI checks, code review).

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Extend `Command<TResult>` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-command-base`<br/>Compiler enforces inheritance |
| Serializable (toPrimitives/fromPrimitives) | ✅ ESLint + Generator | `@repo/eslint-plugin-ddd/require-command-serialization`<br/>Generator includes stubs |
| Has `id` for idempotency | ✅ ESLint | `@repo/eslint-plugin-ddd/require-command-id` |
| Has `correlationId` for tracing | ✅ ESLint | `@repo/eslint-plugin-ddd/require-correlation-id` |
| Has Zod validation schema | ✅ ESLint | `@repo/eslint-plugin-ddd/require-command-validation` |
| No infrastructure dependencies | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-application` |
| No business logic (DTO only) | ⚠️ Manual Review | Code review: "Is command just a DTO?" |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Path: `src/core/{context}/application/commands/` | ✅ Generator + CI | Nx generator scaffolds correct path<br/>CI job: `enforce-file-structure` |
| Named `{CommandName}Command.ts` | ✅ Generator | Template auto-generates filename |
| Static `create()` factory | ✅ ESLint | `@repo/eslint-plugin-ddd/require-command-factory` |
| Immutable fields (readonly) | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-fields` |
| Return `Result<Command, ValidationError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-validation` |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Has `id` (commandId) | ✅ ESLint | `@repo/eslint-plugin-ddd/require-command-id` |
| Has `correlationId` | ✅ ESLint | `@repo/eslint-plugin-ddd/require-correlation-id` |
| Has `version` field | ⚠️ Manual Review | Code review: "Is versioning planned?" |
| Immutable (readonly) | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-fields` |
| No parameter mutation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-mutation-in-application` |
| Never throws | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-application` |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Called by CommandHandler | ⚠️ Manual Review | Code review: "Is command dispatched by handler?" |
| Called by CommandBus | ⚠️ Manual Review | Code review: "Integrated with bus?" |
| No repository access | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-application` |
| May call ValueObjects | ✅ ESLint | `@repo/eslint-plugin-ddd/command-deps-allowed` |
| May compose other Commands | ✅ ESLint | `@repo/eslint-plugin-ddd/command-deps-allowed` |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Validation test exists | ✅ CI Job | `test-coverage-check`<br/>Fail if `{Command}.validation.spec.ts` missing |
| Serialization test exists | ✅ CI Job | `test-coverage-check`<br/>Fail if `{Command}.serialization.spec.ts` missing |
| Test happy path validation | ⚠️ Manual + Generator | Generator includes test stubs<br/>Dev fills in cases |
| Test invalid field values | ⚠️ Manual + Generator | Generator includes negative test stubs |
| Test type coercion | ⚠️ Manual + Generator | Generator includes coercion stubs |
| Test round-trip serialization | ⚠️ Manual + Generator | Generator includes round-trip stubs |
| Test commandId immutability | ⚠️ Manual | Code review: "Does commandId survive round-trip?" |
| No mocks in tests | ✅ ESLint | `@repo/eslint-plugin-testing/no-mocks-in-core-tests` |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| No logging in command | ✅ ESLint | `@repo/eslint-plugin-ddd/no-observability-in-domain` |
| Use `Result<Command, ValidationError>` | ✅ ESLint | `@repo/eslint-plugin-ddd/use-result-for-validation` |
| Never throws for validation | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-application` |
| Has commandId for tracing | ✅ ESLint | `@repo/eslint-plugin-ddd/require-command-id` |
| Has correlationId for correlation | ✅ ESLint | `@repo/eslint-plugin-ddd/require-correlation-id` |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Static factory generates commandId | ✅ Generator | Factory includes `generateId()` call |
| Static factory generates correlationId | ✅ Generator | Factory includes `generateCorrelationId()` call |
| Supports versioning | ⚠️ Manual Review | Code review: "Version field present for evolution?" |
| Has migration path | ⚠️ Manual Review | Code review: "Handler supports version migrations?" |
| Deprecation with `@deprecated` | ✅ TypeScript | Compiler warns on usage |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Business logic in command | ⚠️ Manual Review | Code review: "Is this a DTO or domain object?" |
| Mutating fields | ✅ ESLint | `@repo/eslint-plugin-ddd/require-readonly-fields` |
| Missing commandId | ✅ ESLint | `@repo/eslint-plugin-ddd/require-command-id` |
| Throwing exceptions | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-application` |
| Repository access | ✅ ESLint | `@repo/eslint-plugin-layers/no-infra-in-application` |
| No validation schema | ✅ ESLint | `@repo/eslint-plugin-ddd/require-command-validation` |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Example extends Command<TResult> | ✅ Generator | Template includes base class |
| Example has static create() | ✅ Generator | Template includes factory stub |
| Example has validation schema (Zod) | ✅ Generator | Template includes Zod schema |
| Example has toPrimitives() | ✅ Generator | Template includes serialization |
| Example has commandId | ✅ Generator | Template includes id field |
| Example ≤40 lines | ⚠️ Manual | Example kept short, not enforced |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|-----------------|
| Generator creates command file | ✅ Generator | Plop template generates:<br/>- Command class<br/>- Zod schema<br/>- Static factory |
| Generator creates validation test | ✅ Generator | Plop generates `{Command}.validation.spec.ts` |
| Generator creates serialization test | ✅ Generator | Plop generates `{Command}.serialization.spec.ts` |
| Generator creates factory fixture | ✅ Generator | Plop generates `{Command}Factory.ts` |
| Correct path structure | ✅ Generator | Hardcoded: `application/commands/` |
| Required imports included | ✅ Generator | Template includes Command, Result, ValidationError, Zod |
| Validation schema stub | ✅ Generator | Template includes Zod schema scaffold |
| Test stubs created | ✅ Generator | Tests include stubs for happy/error paths |
| Inventory entry created | ⚠️ Manual | Dev manually adds entry to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 11 | require-command-base, require-command-id, require-command-validation |
| **TypeScript compiler** | 2 | Inheritance, @deprecated |
| **Generator (Nx + Plop)** | 8 | File scaffolding, factory, schema, test stubs |
| **CI jobs** | 2 | enforce-file-structure, test-coverage-check |
| **Manual review** | 6 | Version planning, handler integration, business logic detection |

**Total requirements**: 27  
**Fully automated**: 18 (67%)  
**Partially automated**: 9 (33%)