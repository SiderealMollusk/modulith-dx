# Query Primitive: Enforcement & Automation

## 1. Validation Requirements (Zod schema)

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| Extends Query base | All queries extend Query<TResult> | ✅ Full | ESLint `require-query-base` |
| Static factory | create() static method exists | ✅ Full | ESLint `require-query-factory` |
| Zod schema | Defines z.object() validation schema | ✅ Full | ESLint `require-query-validation` |
| Schema safeParse | Uses schema.safeParse() in factory | ✅ Full | ESLint `require-query-validation` |
| Result return type | Returns Result<Query, ValidationError> | ✅ Full | TypeScript compiler (`--strict`) |
| Immutable fields | All fields are readonly | ✅ Full | ESLint `require-readonly-fields` |
| queryId field | Has id/queryId for deduplication | ✅ Full | ESLint `require-query-id` |
| Cache metadata | Has optional cacheKey and cacheTTL | ⚠️ Partial | ESLint `recommend-query-caching` (warn) |
| No mutations | Never modifies query state | ✅ Full | ESLint `no-mutation-in-application` |
| Error handling | Returns Result.fail(ValidationError) | ✅ Full | ESLint `use-result-for-validation` |

## 2. File Structure Requirements

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| File path | src/core/{context}/application/queries/{Name}.ts | ✅ Full | Generator scaffolds correct path |
| Naming | Class name = {Name}Query (PascalCase) | ✅ Full | ESLint `query-naming-convention` |
| Exports | Exports class and schema | ✅ Full | ESLint `require-query-exports` |
| No other classes | Single query per file | ✅ Full | ESLint `one-query-per-file` |
| Schema colocated | Validation schema in same file | ✅ Full | ESLint `colocated-validation-schema` |
| Index export | Exported in application/queries/index.ts | ✅ Full | Generator adds to index |
| Test files | Validation.spec.ts and serialization.spec.ts | ✅ Full | Generator creates both files |

## 3. Type Requirements (TypeScript)

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| Generic TResult | Defines result type Query<TResult> | ✅ Full | TypeScript compiler |
| Constructor signature | (queryParams, id?, version?, cacheKey?, cacheTTL?) | ⚠️ Partial | ESLint `query-constructor-shape` (warn) |
| toPrimitives() | Returns serialized object | ✅ Full | ESLint `require-query-serialization` |
| fromPrimitives() | Static method to deserialize | ✅ Full | ESLint `require-query-deserialization` |
| No implicit any | Strict type safety | ✅ Full | TypeScript `--strict` |
| Readonly fields | typeof this.field is readonly | ✅ Full | TypeScript `readonly` keyword |

## 4. Validation Requirements

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| Schema validation tests | tests/unit/.../queries/{Name}.validation.spec.ts | ✅ Full | Generator creates spec file |
| Happy path test | Valid input creates query | ✅ Full | Generator test template |
| Error path tests | Invalid input returns Result.fail | ✅ Full | Generator test template |
| Type coercion tests | String→Number conversions handled | ⚠️ Partial | Manual review checklist |
| Filter validation | Enum/constraint validation | ⚠️ Partial | Manual review checklist |
| Pagination tests | Limit/offset constraints tested | ⚠️ Partial | Manual review checklist |
| Null safety | Missing fields return validation error | ✅ Full | ESLint `required-field-validation` |

## 5. Serialization Requirements

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| Serialization test file | tests/unit/.../queries/{Name}.serialization.spec.ts | ✅ Full | Generator creates spec file |
| toPrimitives() test | Serializes to object | ✅ Full | Generator test template |
| fromPrimitives() test | Deserializes from object | ✅ Full | Generator test template |
| Round-trip test | toPrimitives() → fromPrimitives() preserves data | ✅ Full | ESLint `round-trip-serialization` |
| queryId preserved | Deduplication ID survives serialization | ✅ Full | Test coverage check |
| cacheKey preserved | Cache key survives serialization | ⚠️ Partial | Manual review checklist |
| Version field | version field preserved (for migrations) | ✅ Full | Test coverage check |

## 6. Pure Function Requirements

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| No side effects | Query cannot mutate anything | ✅ Full | ESLint `no-side-effects-in-application` |
| No async | Query is synchronous (handler does async) | ✅ Full | ESLint `no-async-in-query` |
| No repository access | Queries don't access repos (handlers do) | ✅ Full | ESLint `no-infra-in-application` |
| No entity mutations | Doesn't modify entities/aggregates | ✅ Full | ESLint `no-mutation-in-application` |
| No throwing | Never throws, always returns Result | ✅ Full | ESLint `no-throw-in-application` |
| Deterministic | Same input always produces same query | ✅ Full | ESLint `deterministic-query-creation` |

## 7. Dependency Requirements

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| No Command deps | Query doesn't depend on Commands | ✅ Full | ESLint `no-command-in-query` |
| No entity deps | Doesn't import Entity/AggregateRoot | ✅ Full | ESLint `no-entity-in-application` |
| No infra deps | No repository implementations | ✅ Full | ESLint `no-infra-in-application` |
| ValueObject OK | Can use ValueObjects as parameters | ✅ Full | ESLint `allowed-deps` whitelist |
| Specification OK | Can use Specifications for filters | ✅ Full | ESLint `allowed-deps` whitelist |
| Query composition OK | Can call other query factories | ⚠️ Partial | Manual review checklist |
| Zod OK | Zod import for validation | ✅ Full | ESLint `allowed-deps` whitelist |
| Result OK | Result import for return type | ✅ Full | ESLint `allowed-deps` whitelist |

## 8. Observability Requirements

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| No logging | Query itself logs nothing | ✅ Full | ESLint `no-logging-in-query` |
| queryId present | Has id field for deduplication | ✅ Full | ESLint `require-query-id` |
| cacheKey optional | Computed cache key for handler | ⚠️ Partial | Recommendation only |
| cacheTTL optional | Cache time-to-live in seconds | ⚠️ Partial | Recommendation only |
| Version field | Supports query versioning | ⚠️ Partial | Recommendation for evolution |
| Inventory entry | Added to OBSERVABILITY_INVENTORY.md | ✅ Full | Generator adds template |

## 9. Code Style & Conventions

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| PascalCase class name | {Name}Query format | ✅ Full | ESLint `query-naming-convention` |
| UPPER_CASE constants | Enum values PENDING, SHIPPED etc. | ✅ Full | ESLint `naming-convention` |
| snake_case file name | query-name.ts (if multiple) | ⚠️ Partial | Linter recommendation |
| Import order | Query base before Zod before Result | ✅ Full | ESLint `import-order` |
| Line length | ≤ 100 chars (except test data) | ✅ Full | Prettier + ESLint |
| Comments | Document complex filters | ⚠️ Partial | Manual review checklist |

## 10. Generator & CI Requirements

| Requirement | Description | Automated | Mechanism |
|---|---|---|---|
| Generator scaffolds | nx generate query --context=... --name=... | ✅ Full | nx plugin/schematic |
| Validation test stub | Template with happy path + error cases | ✅ Full | Generator template |
| Serialization test stub | Template with round-trip test | ✅ Full | Generator template |
| Factory stub | Test data factory for query | ✅ Full | Generator creates fixture |
| CI: File structure | Validates path and naming | ✅ Full | CI job `enforce-file-structure` |
| CI: Test coverage | Both spec files exist and have coverage | ✅ Full | CI job `test-coverage-check` |
| CI: ESLint | All rules pass before merge | ✅ Full | CI job `eslint` with query rules |
| CI: Type checking | TypeScript --strict passes | ✅ Full | CI job `typecheck` |
| Manual review: Logic | Does query avoid business logic? | ⚠️ Partial | PR review checklist |
| Manual review: Cache | Is caching strategy documented? | ⚠️ Partial | PR review checklist |

---

## Summary

**Total Requirements**: 35
**Fully Automated**: 24 (69%)
**Partially Automated**: 11 (31%)

**Key Automation Mechanisms**:
1. **ESLint Rules** (12 rules):
   - `require-query-base` (extends Query<TResult>)
   - `require-query-factory` (static create method)
   - `require-query-validation` (Zod schema + safeParse)
   - `require-query-id` (queryId for deduplication)
   - `require-query-serialization` (toPrimitives)
   - `require-query-deserialization` (fromPrimitives)
   - `require-readonly-fields` (immutability)
   - `no-mutation-in-application` (pure logic)
   - `use-result-for-validation` (error handling)
   - `no-async-in-query` (synchronous)
   - `query-naming-convention` (class name format)
   - `colocated-validation-schema` (schema in same file)

2. **Generator** (6 artifacts):
   - Query class with Zod schema
   - Static factory method
   - toPrimitives() and fromPrimitives()
   - validation.spec.ts with test templates
   - serialization.spec.ts with test templates
   - QueryFactory.ts for test data

3. **CI Jobs** (3 checks):
   - `enforce-file-structure` (path, naming, exports)
   - `test-coverage-check` (both spec files exist and pass)
   - `eslint` (all 12 query rules pass)
   - `typecheck` (TypeScript --strict)

4. **Manual Review** (5 checkpoints):
   - Business logic detection (PR review)
   - Cache strategy documentation (PR review)
   - Filter complexity (PR review)
   - Pagination edge cases (PR review)
   - Query composition risk (PR review)

**Scaffolding Command**:
```bash
nx generate query --context=orders --name=FindOrdersByCustomer --result="Order[]"
```

**Generated Output**:
- src/core/orders/application/queries/FindOrdersByCustomerQuery.ts (60 lines)
- tests/unit/core/orders/application/queries/FindOrdersByCustomerQuery.validation.spec.ts (25 lines)
- tests/unit/core/orders/application/queries/FindOrdersByCustomerQuery.serialization.spec.ts (20 lines)
- tests/fixtures/queries/FindOrdersByCustomerQueryFactory.ts (30 lines)
- Updated src/core/orders/application/queries/index.ts
- Updated docs/enforced-architecture/OBSERVABILITY_INVENTORY.md (template entry)