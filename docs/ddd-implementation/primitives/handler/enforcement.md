# Handler: Automation & Enforcement Mapping

This document maps every requirement from [specification.md](./specification.md) to its automation mechanism.

## Section 1-3: Core Requirements

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Must extend BaseHandler | ✅ ESLint + TypeScript | `@repo/eslint-plugin-ddd/require-base-handler` |
| Path: interface/handlers/ | ✅ Generator + CI | Generator scaffolds path<br/>CI: `enforce-file-structure` |
| Use withSpan() wrapper | ✅ ESLint | `@repo/eslint-plugin-ddd/handler-require-span` |
| Validate request (Zod) | ✅ ESLint | `@repo/eslint-plugin-ddd/handler-validate-request` |
| Invoke use case only | ✅ ESLint | `@repo/eslint-plugin-layers/handler-no-direct-repos` |
| Map Result to response | ⚠️ Manual Review | Code review: "Is Result properly mapped?" |
| No unhandled exceptions | ✅ ESLint | `@repo/eslint-plugin-ddd/handler-catch-all`<br/>Check for try-catch in handle() |
| No business logic | ⚠️ Manual Review | Code review: "Does handler only delegate?" |
| Set correlation ID | ✅ Base Class | BaseHandler auto-sets in span context |

## Section 4-6: Collaboration & Observability

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Call use cases only | ✅ ESLint | `@repo/eslint-plugin-layers/handler-dependencies`<br/>Allow use-cases/, block repos |
| No repository access | ✅ ESLint | `@repo/eslint-plugin-layers/handler-no-direct-repos` |
| Span per request | ✅ Base Class | BaseHandler withSpan() auto-creates |
| Log entry/success/failure | ✅ Base Class | BaseHandler auto-logs (if logger injected) |
| Metrics for latency/errors | ✅ Base Class | BaseHandler auto-records |
| Map errors to status codes | ⚠️ Manual Review | Code review: "Are errors mapped correctly?" |
| Sanitize error messages | ⚠️ Manual Review | Code review: "Are stack traces hidden?" |

## Section 7-10: Testing & Scaffolding

| Requirement | Automation Mechanism | Implementation |
|------------|---------------------|----------------|
| Unit test exists | ✅ CI Job | `test-coverage-check` |
| Integration test exists | ✅ CI Job | `test-coverage-check` |
| E2E test exists | ✅ CI Job | `test-coverage-check` |
| Generator creates 4 files | ✅ Generator | Handler + 3 test files |
| Includes Zod schema | ✅ Generator | Template includes schema stub |
| Inventory updated | ⚠️ Manual | Dev adds to OBSERVABILITY_INVENTORY.md |

---

## Summary of Automation Coverage

| Mechanism | Count |
|-----------|-------|
| **ESLint rules** | 7 |
| **Base class** | 4 |
| **Generator** | 4 |
| **CI jobs** | 4 |
| **Manual review** | 5 |

**Total requirements**: 24  
**Fully automated**: 15 (63%)  
**Partially automated**: 9 (37%)
