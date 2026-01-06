# Query: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: A serializable, immutable request object that encapsulates an intent to read/query domain state without side effects. Queries are used to fetch data from use cases or query handlers, with optional caching, filtering, and pagination support. Each query maps to exactly one query handler.

**When to use**:
- Fetching data without mutations (reads, searches, aggregations)
- Triggering query handlers from API endpoints
- Building query buses with caching layers
- Pagination, filtering, sorting requests
- Read model queries (CQRS)
- Cross-context queries (via facades)

**When NOT to use**:
- Mutating domain state (use Command instead)
- Business operations (use Command)
- Side effects (queries must be pure)
- Simple function calls without crossing boundaries

**Required base/interface**: Extend `Query<TResult>` abstract class or implement `IQuery<TResult>`

**Allowed dependencies**:
- ValueObjects (for parameters)
- Zod (for validation schema)
- Specifications (for filters)
- Other Queries (composition)

**Forbidden dependencies**:
- Repositories (queries are handled by handlers, not directly accessing repos)
- Infrastructure implementations
- Commands (queries are independent)
- Entities/Aggregates (queries are DTOs)
- Logger, Tracer (queries are pure logic)

## 2. Required Shape & Files

**Path**: `src/core/{context}/application/queries/{QueryName}.ts`

**Must be**: Class extending `Query<TResult>` with static factory

**Required exports**:
```typescript
export class FindOrdersByCustomerQuery extends Query<Order[]> {
  constructor(
    readonly customerId: string,
    readonly filters?: {
      status?: string;
      createdAfter?: Date;
    },
    readonly pagination?: {
      limit: number;
      offset: number;
    },
    // IQuery required fields:
    readonly id: string, // queryId for deduplication
    readonly version: number = 1,
    readonly cacheKey?: string, // "orders:customer:{customerId}"
    readonly cacheTTL?: number // seconds, e.g. 300
  ) {
    super();
  }

  static create(dto: {
    customerId: string;
    filters?: object;
    pagination?: object;
  }): Result<FindOrdersByCustomerQuery, ValidationError> {
    const validated = FindOrdersByCustomerQuerySchema.safeParse(dto);
    if (!validated.success) {
      return Result.fail(new ValidationError('INVALID_QUERY', validated.error.message));
    }

    const customerId = dto.customerId;
    const cacheKey = `orders:customer:${customerId}`;

    return Result.ok(
      new FindOrdersByCustomerQuery(
        customerId,
        dto.filters,
        dto.pagination,
        generateId(),
        1,
        cacheKey,
        300 // 5 minute cache
      )
    );
  }

  toPrimitives(): {
    queryId: string;
    type: string;
    customerId: string;
    filters?: object;
    pagination?: object;
    cacheKey?: string;
  } {
    return {
      queryId: this.id,
      type: 'FindOrdersByCustomerQuery',
      customerId: this.customerId,
      filters: this.filters,
      pagination: this.pagination,
      cacheKey: this.cacheKey,
    };
  }

  static fromPrimitives(data: object): Result<FindOrdersByCustomerQuery, ValidationError> {
    try {
      const query = new FindOrdersByCustomerQuery(
        data.customerId,
        data.filters,
        data.pagination,
        data.queryId,
        data.version,
        data.cacheKey,
        data.cacheTTL
      );
      return Result.ok(query);
    } catch (e) {
      return Result.fail(new ValidationError('DESERIALIZE_FAILED', e.message));
    }
  }
}

export const FindOrdersByCustomerQuerySchema = z.object({
  customerId: z.string().uuid(),
  filters: z.object({
    status: z.enum(['pending', 'shipped', 'delivered']).optional(),
    createdAfter: z.date().optional(),
  }).optional(),
  pagination: z.object({
    limit: z.number().min(1).max(100),
    offset: z.number().min(0),
  }).optional(),
});
```

**Observability hook**: 
- `queryId` for deduplication
- `cacheKey` for cache layer integration
- `cacheTTL` for cache invalidation
- Pure logic (no side effects to observe)

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/application/queries/{QueryName}.spec.ts`
  - Validation: `{QueryName}.validation.spec.ts` (valid/invalid inputs)
  - Serialization: `{QueryName}.serialization.spec.ts` (to/from primitives)
- **Integration**: `tests/integration/...` (query handler integration)
- **E2E**: Covered via API E2E tests that dispatch query

## 3. Invariants & Guards

**Must**:
- Have `id` (queryId) for deduplication
- Have `version` for migration
- Be immutable (readonly fields)
- Be serializable (toPrimitives/fromPrimitives)
- Have Zod validation schema
- Return `Result<Query, ValidationError>` from create factory
- Be pure (no side effects)
- Never throw (use Result)

**Never**:
- Mutate parameters
- Hold mutable state
- Access infrastructure or repositories
- Have side effects (fetching data is OK, mutating is not)
- Throw exceptions (use Result)
- Have timeout/expiration logic (that's cache layer)

**Validation rules**:
- All required fields validated in create() factory
- Return `Result.fail(ValidationError)` for invalid input
- Type coercion handled (string → number, etc.)
- Zod schema is source of truth for validation

**Span/log requirements**: 
- No logging/tracing in query itself
- Handlers/buses log query execution
- queryId used for deduplication

## 4. Collaboration Rules

**Who can call it**:
- QueryHandlers (dispatch to repository/service)
- QueryBus (routing, deduplication, caching)
- API endpoints (convert request to query)
- Use Cases (fetch data during execution)
- Other QueryHandlers (composition)

**What it may call**:
- Zod for validation
- ValueObjects (for parameters)
- Specifications (for filters)
- Static factory methods of other Queries
- Result (error handling)

**Allowed return types**:
- `Result<Query, ValidationError>` from factory
- `Query` once constructed
- `object` from toPrimitives()
- Never: `Promise`, `void`, exceptions

## 5. Testing Requirements (enforced)

**Unit tests** (separate specs for validation and serialization):

**Validation** (`{QueryName}.validation.spec.ts`):
- Happy path (all fields valid, query created)
- Missing required fields (returns Result.fail)
- Invalid field types (returns Result.fail)
- Type coercion (string → number)
- Filter validation (valid enum values)
- Pagination bounds (limit, offset constraints)
- No side effects (input DTO unchanged)

**Serialization** (`{QueryName}.serialization.spec.ts`):
- toPrimitives() produces correct object
- fromPrimitives() reconstructs query
- Round-trip preserves all data
- queryId survives serialization (deduplication)
- cacheKey correct format

**Integration tests**: Not applicable (queries are DTOs)

**E2E tests**: Covered via API E2E tests that dispatch query

**Fixtures/factories location**: `tests/fixtures/queries/{QueryName}Factory.ts`
- Factory methods for valid queries
- Factory methods for different filters/pagination
- Invalid query data for negative tests

## 6. Observability & Errors

**Logging/Tracing**: Forbidden in query itself. Handlers log query execution.

**Error policy**:
- Use `Result<Query, ValidationError>` for creation failures
- Return `Result.fail(ValidationError)` for invalid input
- Never throw for expected failures
- Only throw for programmer errors (null checks in dev)

**Example error handling**:
```typescript
static create(dto: FindOrdersDTO): Result<FindOrdersByCustomerQuery, ValidationError> {
  const validated = FindOrdersByCustomerQuerySchema.safeParse(dto);
  if (!validated.success) {
    return Result.fail(
      new ValidationError('INVALID_FIND_ORDERS_QUERY', validated.error.message)
    );
  }

  // Additional validation
  if (dto.pagination?.limit > 100) {
    return Result.fail(
      new ValidationError('PAGINATION_LIMIT_EXCEEDED', 'Max 100 items per page')
    );
  }

  return Result.ok(
    new FindOrdersByCustomerQuery(
      dto.customerId,
      dto.filters,
      dto.pagination,
      generateId(),
      1,
      `orders:customer:${dto.customerId}`,
      300
    )
  );
}
```

## 7. Lifecycle & Evolution

**Creation**: Static factory with validation, generates queryId, computes cacheKey

**Caching**: Query can have optional cacheKey and cacheTTL
- Cache layer checks queryId → returns cached result
- Cache key is deterministic based on query parameters
- TTL determines how long to cache

**Versioning**: Queries evolve with version field
```typescript
// Version 1 (original)
new FindOrdersByCustomerQuery(customerId, filters, pagination, id)

// Version 2 (added sorting)
new FindOrdersByCustomerQuery(
  customerId,
  filters,
  pagination,
  id,
  2,  // ← version
  cacheKey,
  cacheTTL,
  sorting  // ← new field
)

// Handler checks version and applies migration
```

**Deprecation path**:
- Mark with `@deprecated` comment
- Create new query version
- Keep old handler for 2 sprints
- Provide migration guide

## 8. Anti-Patterns (repo-specific)

- **Business logic in query**: Queries are DTOs, not domain objects
- **Mutation in query handler**: Queries must be pure
- **No validation schema**: All inputs must be validated
- **Missing queryId**: Breaks deduplication
- **Throwing exceptions**: Use Result
- **Hardcoded cache TTL**: Should be configurable
- **Complex filtering**: Keep queries simple; use Specifications
- **No pagination**: Queries should support pagination

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/orders/application/queries/FindOrdersByCustomerQuery.ts
import { Query } from '@shared/kernel/query';
import { Result } from '@shared/kernel/result';
import { ValidationError } from '@shared/kernel/errors';
import { z } from 'zod';

export class FindOrdersByCustomerQuery extends Query<string[]> {
  constructor(
    readonly customerId: string,
    readonly status?: string,
    readonly id: string = generateId(),
    readonly version: number = 1,
    readonly cacheKey?: string,
    readonly cacheTTL: number = 300
  ) {
    super();
  }

  static create(dto: {
    customerId: string;
    status?: string;
  }): Result<FindOrdersByCustomerQuery, ValidationError> {
    const schema = z.object({
      customerId: z.string().uuid(),
      status: z.enum(['pending', 'shipped', 'delivered']).optional(),
    });

    const validated = schema.safeParse(dto);
    if (!validated.success) {
      return Result.fail(new ValidationError('INVALID_QUERY', validated.error.message));
    }

    return Result.ok(
      new FindOrdersByCustomerQuery(
        dto.customerId,
        dto.status,
        generateId(),
        1,
        `orders:${dto.customerId}:${dto.status || 'all'}`,
        300
      )
    );
  }

  toPrimitives() {
    return {
      queryId: this.id,
      customerId: this.customerId,
      status: this.status,
      cacheKey: this.cacheKey,
    };
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate query --context=orders --name=FindOrdersByCustomer --result="Order[]"
```

**Generated files**:
- `src/core/orders/application/queries/FindOrdersByCustomerQuery.ts` (query class with validation schema)
- `tests/unit/core/orders/application/queries/FindOrdersByCustomerQuery.validation.spec.ts` (validation tests)
- `tests/unit/core/orders/application/queries/FindOrdersByCustomerQuery.serialization.spec.ts` (serialization tests)
- `tests/fixtures/queries/FindOrdersByCustomerQueryFactory.ts` (test data)

**Generated imports**:
```typescript
import { Query } from '@shared/kernel/query';
import { Result } from '@shared/kernel/result';
import { ValidationError } from '@shared/kernel/errors';
import { z } from 'zod';
```

**Required follow-up edits**:
1. Define Zod validation schema for query parameters
2. Implement create() factory with full validation
3. Compute cacheKey and cacheTTL based on parameters
4. Implement toPrimitives() for serialization
5. Implement fromPrimitives() for deserialization
6. Add version field if planning evolution
7. Write validation unit tests (happy path, error cases)
8. Write serialization round-trip tests
9. Create query factory with test data
10. Create QueryHandler to dispatch the query
11. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### FindOrdersByCustomerQuery (Query)
- **File**: src/core/orders/application/queries/FindOrdersByCustomerQuery.ts
- **Type**: Query (DDD Primitive)
- **Role**: Find orders for a customer with optional filtering
- **TResult**: Order[]
- **Cache**: {query.cacheKey} (TTL: {query.cacheTTL}s)
- **Status**: ⏳ (scaffolded, needs validation + handler)
- **Tests**: Validation and serialization unit tests required
```