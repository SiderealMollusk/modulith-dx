# Repository: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism.

## Section 1: What It Is

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Port must be interface | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-port-is-interface`<br/>Fail if port is class |
| Adapter must extend `BaseRepositoryAdapter` | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-base-repository-adapter`<br/>TypeScript enforces generic |
| Adapter must implement port | ✅ TypeScript | Compiler enforces `implements TPort` |
| Port in application/, adapter in infrastructure/ | ✅ Generator + CI | Generator scaffolds paths<br/>CI: `enforce-file-structure` |

## Section 2: Required Shape & Files

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Port path: application/ports/ | ✅ Generator + CI | Generator enforces path<br/>CI fails if misplaced |
| Adapter path: infrastructure/adapters/ | ✅ Generator + CI | Generator enforces path<br/>CI fails if misplaced |
| Port uses async methods | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-port-async`<br/>Detect non-async methods |
| Port returns Promise<Result<T, E>> | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-port-result`<br/>Check return types |
| Adapter uses withSpan() | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-adapter-spans`<br/>Check for withSpan calls |
| Adapter injects Logger + Tracer | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-adapter-observability`<br/>Check constructor params |

## Section 3: Invariants & Guards

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Port has no implementation | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-port-is-interface` |
| Port never throws | ✅ ESLint | `@repo/eslint-plugin-ddd/no-throw-in-ports`<br/>Ports are interfaces, can't throw |
| Adapter wraps exceptions | ⚠️ Manual Review | Code review: "Are exceptions caught and wrapped?" |
| Adapter uses Mappers | ⚠️ Manual Review | Code review: "Is mapper used for domain ↔ DB?" |
| Return Result<T, ApplicationError> | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-port-result` |

## Section 4: Collaboration Rules

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Adapter no use case calls | ✅ ESLint | `@repo/eslint-plugin-layers/no-usecase-in-infrastructure`<br/>Detect imports from application/use-cases/ |
| Adapter no handler calls | ✅ ESLint | `@repo/eslint-plugin-layers/no-handler-in-infrastructure` |
| Adapter may call DB clients | ✅ Allowed | No enforcement needed (infrastructure layer) |
| Adapter may call Mappers | ✅ Allowed | No enforcement needed |

## Section 5: Testing Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Adapter integration test exists | ✅ CI Job | `test-coverage-check` fails if integration test missing |
| Test with real/test DB | ⚠️ Manual + Review | Generator includes test container stub<br/>Code review checks |
| Test span creation | ✅ Integration Test | Test verifies span context exists |
| Test log output | ✅ Integration Test | Test verifies logs emitted |
| Test error handling | ⚠️ Manual + Review | Generator includes error test stub |
| No mocks for DB | ⚠️ Manual Review | Code review: "Is test using real DB/test container?" |

## Section 6: Observability & Errors

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Adapter spans per operation | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-adapter-spans`<br/>Check withSpan calls |
| Log entry/success/failure | ⚠️ Manual Review | Code review: "Are all operations logged?" |
| Metrics for latency/errors | ✅ Base Class | BaseRepositoryAdapter auto-records metrics in withSpan |
| Wrap exceptions in ApplicationError | ⚠️ Manual Review | Code review checklist |
| Never throw (use Result) | ⚠️ Manual Review | Code review: "Are exceptions caught?" |

## Section 7: Lifecycle & Evolution

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Port is interface | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-port-is-interface` |
| Adapter implements port | ✅ TypeScript | Compiler enforces implementation |
| Deprecate with @deprecated | ✅ TypeScript | Compiler warns on usage |

## Section 8: Anti-Patterns

| Anti-Pattern | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Leaky abstractions (SQL in port) | ⚠️ Manual Review | Code review: "Does port expose DB details?" |
| Missing observability | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-adapter-spans`<br/>`repository-adapter-observability` |
| Throwing exceptions | ⚠️ Manual Review | Code review checklist |
| No mapper | ⚠️ Manual Review | Code review: "Is mapper used?" |
| Synchronous adapter | ✅ ESLint | `@repo/eslint-plugin-ddd/repository-port-async` |
| Use case calls | ✅ ESLint | `@repo/eslint-plugin-layers/no-usecase-in-infrastructure` |

## Section 9: Canonical Example

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Example follows conventions | ✅ Generator | Generator uses canonical template |
| Port is interface | ✅ Generator | Template generates interface |
| Adapter uses withSpan | ✅ Generator | Template includes withSpan calls |

## Section 10: Scaffolding Contract

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Generator creates 4 files | ✅ Generator | Plop template generates:<br/>- Port interface<br/>- Adapter class<br/>- Integration test<br/>- Fixture |
| Correct paths (application/, infrastructure/) | ✅ Generator | Hardcoded in template |
| Required imports included | ✅ Generator | Template includes BaseRepositoryAdapter, Logger, Tracer, Result |
| Inventory updated | ⚠️ Manual | Dev adds to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count | Examples |
|-----------|-------|----------|
| **ESLint rules** | 10 | repository-port-is-interface, repository-adapter-spans, no-usecase-in-infrastructure |
| **TypeScript compiler** | 3 | Implements check, async enforcement, return types |
| **Base class** | 1 | BaseRepositoryAdapter auto-records metrics |
| **Generator (Nx + Plop)** | 6 | Port/adapter scaffolding, test stubs |
| **CI jobs** | 2 | enforce-file-structure, test-coverage-check |
| **Manual review** | 9 | Exception wrapping, mapper usage, DB testing |

**Total requirements**: 31  
**Fully automated**: 18 (58%)  
**Partially automated**: 13 (42%)

---

## Enforcement Roadmap

### Phase 1: Base Class (Week 1)
- ✅ BaseRepositoryAdapter with withSpan() helper
- ✅ Auto-record latency metrics

### Phase 2: Generator (Week 1)
- ✅ Scaffold port interface in application/ports/
- ✅ Scaffold adapter in infrastructure/adapters/
- ✅ Include withSpan calls in adapter
- ✅ Create integration test with test container stub
- ✅ Create fixture factory

### Phase 3: ESLint Rules (Week 2-3)
- ✅ repository-port-is-interface
- ✅ repository-port-async
- ✅ repository-port-result
- ✅ require-base-repository-adapter
- ✅ repository-adapter-spans
- ✅ repository-adapter-observability
- ✅ no-usecase-in-infrastructure
- ✅ no-handler-in-infrastructure

### Phase 4: CI Jobs (Week 4)
- ✅ enforce-file-structure
- ✅ test-coverage-check

### Phase 5: Code Review Checklist (Week 4)
- ✅ Repository review: exception wrapping, mapper, real DB tests, all operations logged
