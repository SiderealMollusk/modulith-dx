# UseCase: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism.

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Must extend `BaseUseCase<TInput, TOutput>` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-base-usecase`<br/>TypeScript enforces generics |
| No infrastructure dependencies (use ports) | ✅ ESLint | `@repo/eslint-plugin-layers/no-direct-infra-in-usecase`<br/>Block imports from infrastructure/ adapters |
| No handler dependencies | ✅ ESLint | `@repo/eslint-plugin-layers/no-handler-in-usecase` |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Path: application/use-cases/ | ✅ Generator + CI | Generator scaffolds path<br/>CI: `enforce-file-structure` |
| Implement `executeImpl()` | ✅ ESLint | `@repo/eslint-plugin-ddd/require-execute-impl`<br/>Check for protected executeImpl method |
| Return Promise<Result<TOutput, E>> | ✅ ESLint | `@repo/eslint-plugin-ddd/usecase-result-return` |
| Zod schema for TInput | ✅ ESLint | `@repo/eslint-plugin-ddd/require-dto-schema`<br/>Check DTO file has zod export |
| Inject Logger + Tracer | ✅ ESLint | `@repo/eslint-plugin-ddd/usecase-observability-injection` |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Extend BaseUseCase | ✅ ESLint | `@repo/eslint-plugin-ddd/require-base-usecase` |
| Zod schema validation | ✅ Base Class | BaseUseCase auto-validates in execute() |
| Return Result (no throw) | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-usecase` |
| Inject repos via ports | ✅ ESLint | `@repo/eslint-plugin-layers/usecase-port-dependencies`<br/>Check constructor params are interfaces |
| Publish events after commit | ⚠️ Manual Review | Code review: "Are events published after save?" |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| No direct infrastructure | ✅ ESLint | `@repo/eslint-plugin-layers/no-direct-infra-in-usecase` |
| No other use case calls | ✅ ESLint | `@repo/eslint-plugin-layers/no-usecase-chains`<br/>Detect imports from ../use-cases/ |
| Use repository ports | ✅ ESLint | `@repo/eslint-plugin-layers/usecase-port-dependencies` |
| Return Promise<Result<T, E>> | ✅ ESLint | `@repo/eslint-plugin-ddd/usecase-result-return` |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Core unit test exists | ✅ CI Job | `test-coverage-check` fails if `{Name}.core.spec.ts` missing |
| Integration test exists | ✅ CI Job | `test-coverage-check` fails if integration test missing |
| E2E test exists | ✅ CI Job | `test-coverage-check` fails if E2E test missing |
| Core test mocks repos | ⚠️ Manual Review | Generator includes mock stubs |
| Integration uses real repos | ⚠️ Manual Review | Code review: "Using test containers?" |
| E2E via handler | ⚠️ Manual Review | E2E test makes HTTP/gRPC request |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Span auto-created | ✅ Base Class | BaseUseCase execute() creates span |
| Logs entry/success/failure | ✅ Base Class | BaseUseCase auto-logs |
| Metrics for latency/errors | ✅ Base Class | BaseUseCase auto-records metrics |
| Use Result (no throw) | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-usecase` |
| ApplicationError for failures | ✅ ESLint | `@repo/eslint-plugin-ddd/usecase-application-error`<br/>Check error type in Result.fail() |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Extend BaseUseCase | ✅ Generator + ESLint | Generator scaffolds, ESLint enforces |
| Add dependencies to constructor | ✅ TypeScript | Compiler enforces injection |
| Deprecate with @deprecated | ✅ TypeScript | Compiler warns on usage |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Anemic use cases | ⚠️ Manual Review | Code review: "Is there orchestration logic?" |
| God use cases | ⚠️ Manual Review | Code review: "Is use case doing too much?" |
| Missing validation | ✅ ESLint | `@repo/eslint-plugin-ddd/require-dto-schema` |
| Throwing exceptions | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-usecase` |
| Direct infrastructure | ✅ ESLint | `@repo/eslint-plugin-layers/no-direct-infra-in-usecase` |
| Use case chains | ✅ ESLint | `@repo/eslint-plugin-layers/no-usecase-chains` |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Example follows conventions | ✅ Generator | Generator uses canonical template |
| Uses BaseUseCase | ✅ Generator | Template extends BaseUseCase |
| Includes observability | ✅ Generator | Template injects Logger/Tracer |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Generator creates 6 files | ✅ Generator | Plop template generates:<br/>- UseCase<br/>- Input/Output DTOs<br/>- Unit test<br/>- Integration test<br/>- E2E test |
| Correct path structure | ✅ Generator | Hardcoded in template |
| Required imports included | ✅ Generator | Template includes BaseUseCase, Result, Logger, Tracer |
| Inventory updated | ⚠️ Manual | Dev adds to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 11 | require-base-usecase, no-throw-in-usecase, no-usecase-chains |
| **TypeScript compiler** | 3 | Generic enforcement, injection, return types |
| **Base class** | 3 | Auto-validate, auto-span, auto-log/metrics |
| **Generator (Nx + Plop)** | 6 | UseCase + DTOs + 3 test files |
| **CI jobs** | 4 | enforce-file-structure, test-coverage-check (unit, integration, e2e) |
| **Manual review** | 6 | Event publishing, orchestration logic, test quality |

**Total requirements**: 33  
**Fully automated**: 24 (73%)  
**Partially automated**: 9 (27%)

---

## Enforcement Roadmap

### Phase 1: Base Class (Week 1)
- ✅ BaseUseCase with execute() wrapper
- ✅ Auto-validate DTOs with Zod
- ✅ Auto-create span, log, metrics

### Phase 2: Generator (Week 1)
- ✅ Scaffold use case extending BaseUseCase
- ✅ Generate input/output DTOs with Zod schemas
- ✅ Create unit/integration/E2E test stubs
- ✅ Include observability injection

### Phase 3: ESLint Rules (Week 2-3)
- ✅ require-base-usecase
- ✅ require-execute-impl
- ✅ require-dto-schema
- ✅ usecase-result-return
- ✅ no-throw-in-usecase
- ✅ no-direct-infra-in-usecase
- ✅ no-usecase-chains
- ✅ usecase-port-dependencies
- ✅ usecase-application-error

### Phase 4: CI Jobs (Week 4)
- ✅ enforce-file-structure
- ✅ test-coverage-check (core, integration, e2e)

### Phase 5: Code Review Checklist (Week 4)
- ✅ UseCase review: orchestration logic, event publishing, test quality
