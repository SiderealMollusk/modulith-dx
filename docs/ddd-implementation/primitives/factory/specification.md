# Factory: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: A service responsible for constructing complex aggregates from multiple sources (DTO, database representation, API response) with all validation, composition, and invariant enforcement applied. Factories handle the complexity of reconstituting aggregates from external data.

**When to use**:
- Creating aggregates from HTTP request DTOs (API input)
- Reconstituting aggregates from database persistence (repo result)
- Complex multi-step validation during object creation
- Building aggregates from partial or uncertain data
- Domain objects require multiple interdependent components

**When NOT to use**:
- Simple domain object creation (use constructor)
- Application orchestration (use use case)
- Data transformation only (use Mapper)
- Business logic (put in aggregate/entity)
- Simple validation (use ValueObject constructor)

**Required base/interface**: None (pure class with static or instance methods)

**Allowed dependencies**:
- Entities, Aggregates, ValueObjects (what it creates)
- Specifications (for validation rules)
- ValueObjects (for attributes)
- Result (error handling)
- Other Factories (composition)

**Forbidden dependencies**:
- Infrastructure implementations (DB clients, HTTP)
- Application layer (use cases, handlers)
- Logger, Tracer (domain is pure logic)

## 2. Required Shape & Files

**Path**: `src/core/{context}/domain/factories/{AggregateNameFactory}.ts`

**Must be**: Class with static methods or instance methods, no state

**Required exports**:
```typescript
export class OrderFactory {
  // Reconstitute from persistence layer (DB)
  static reconstitute(data: OrderPersistenceData): Result<Order, DomainError> {
    // Apply all validations, reconstruct value objects
  }

  // Create from application layer (API request)
  static createFromDTO(dto: CreateOrderDTO): Result<Order, DomainError> {
    // Validate DTO, create new aggregate with domain defaults
  }
}
```

**Observability hook**: None. Factories are pure domain logic - no logging, tracing, or metrics.

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/domain/factories/{AggregateNameFactory}.spec.ts`
  - Creation from DTO: `{Factory}.dto.spec.ts`
  - Reconstitution from DB: `{Factory}.persistence.spec.ts`
- **Integration**: Not applicable (factories don't integrate with infrastructure)
- **E2E**: Covered via use case E2E tests that trigger factory creation

## 3. Invariants & Guards

**Must**:
- Be stateless (no mutable fields)
- Have no identity (don't extend Entity)
- Validate all invariants before returning aggregate
- Return `Result<Aggregate, DomainError>` for operations that can fail
- Handle all required fields (null checks, type coercion)
- Be deterministic (same input = same aggregate state)
- Have no side effects (don't mutate passed parameters)

**Never**:
- Hold aggregate references between method calls
- Mutate input DTOs or persistence data
- Access infrastructure (DB, HTTP, file system)
- Log or trace (domain is pure)
- Throw exceptions for expected failures (use Result)
- Partially construct aggregates (all or nothing)

**Validation rules**:
- Validate all input fields against domain rules
- Reconstruct all ValueObjects
- Check all aggregate invariants before returning
- Return `Result.fail(new DomainError(...))` for validation failures
- Handle missing or invalid data gracefully

**Span/log requirements**: None (forbidden in domain layer)

## 4. Collaboration Rules

**Who can call it**:
- Repositories (reconstitute from DB)
- Mappers (transform input before factory receives it)
- Use Cases (create from DTO)
- Event Handlers (from domain events)
- Other Factories (for sub-aggregates)

**What it may call**:
- Entities/Aggregates (creates new instances)
- Specifications (for complex validation rules)
- ValueObjects (constructs attributes)
- Other Factories (for sub-aggregates)
- Result (error handling)

**Allowed return types**:
- `Result<Aggregate, DomainError>` for creation/reconstitution
- Never: `Promise`, naked `void`, exceptions, partial aggregates

## 5. Testing Requirements (enforced)

**Unit tests** (separate specs for DTO and persistence paths):

**Create from DTO** (`{Factory}.dto.spec.ts`):
- Happy path (all fields valid, aggregate created)
- Missing required fields (returns Result.fail)
- Invalid field values (returns Result.fail)
- Type coercion (converts string to number, etc.)
- Aggregate invariants enforced (all checks run before returning)
- No side effects (doesn't mutate input DTO)

**Reconstitute from DB** (`{Factory}.persistence.spec.ts`):
- Happy path (all persistence fields map to domain)
- Corrupted data (missing fields, invalid values)
- Value object reconstruction (Id, Money, etc.)
- All aggregate invariants verified
- No side effects (doesn't mutate input data)

**Integration tests**: Not applicable (factories don't integrate with infrastructure)

**E2E tests**: Covered via use case E2E tests that trigger factory

**Fixtures/factories location**: `tests/fixtures/factories/{AggregateNameFactory}Fixture.ts`
- Provide valid DTOs for creation tests
- Provide persistence data for reconstitution tests
- Factory methods for different valid scenarios

## 6. Observability & Errors

**Logging/Tracing**: Forbidden. Factories are pure domain logic.

**Error policy**:
- Use `Result<Aggregate, DomainError>` for creation failures
- Return `Result.fail(new DomainError('CODE', 'Message'))` for invalid data
- Never throw for expected failures (invalid input)
- Only throw for programmer errors (null checks in dev)

**Example error handling**:
```typescript
static createFromDTO(dto: CreateOrderDTO): Result<Order, DomainError> {
  // Validate required fields
  if (!dto.customerId) {
    return Result.fail(new DomainError('MISSING_CUSTOMER', 'Customer ID required'));
  }
  if (!dto.items || dto.items.length === 0) {
    return Result.fail(new DomainError('NO_ITEMS', 'Order must have at least one item'));
  }
  // Construct value objects (may fail validation)
  const idResult = OrderId.create(dto.id);
  if (idResult.isFailure) return Result.fail(idResult.error);
  // ... construct aggregate
}
```

## 7. Lifecycle & Evolution

**Creation**: Define class with static methods for different creation paths

**Multiple creation paths** (common factory pattern):
```typescript
export class OrderFactory {
  // Path 1: Create from API request (new aggregate)
  static createFromDTO(dto: CreateOrderDTO): Result<Order, DomainError> {
    // Validate, create fresh aggregate with domain defaults
  }

  // Path 2: Reconstitute from database (existing aggregate)
  static reconstitute(data: OrderPersistenceData): Result<Order, DomainError> {
    // Validate, reconstruct aggregate from persistence
  }

  // Path 3: Create from event (event sourcing)
  static fromEvent(event: OrderCreatedEvent): Result<Order, DomainError> {
    // Reconstruct from event data
  }
}
```

**Modification**: Add new factory methods for new creation paths

**Deprecation path**:
- Mark methods with `@deprecated` comment
- Create new factory methods for new pattern
- Keep old methods for 2 sprints; remove after migration

## 8. Anti-Patterns (repo-specific)

- **Incomplete aggregates**: Returning aggregate without enforcing all invariants
- **Infrastructure in factory**: Calling database or API during creation
- **Logging/tracing**: No observability in domain factories
- **Anemic creation**: Not validating against domain rules
- **Mutation**: Accepting data, modifying input DTO/entity
- **Partial failures**: Creating aggregate then discovering invalid state

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/orders/domain/factories/OrderFactory.ts
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
import { Order } from '../entities/Order';
import { OrderId } from '../value-objects/OrderId';
import { Money } from '../value-objects/Money';
import { CreateOrderDTO } from '../../application/dtos/CreateOrderDTO';

export class OrderFactory {
  static createFromDTO(dto: CreateOrderDTO): Result<Order, DomainError> {
    // Validate required fields
    if (!dto.customerId) {
      return Result.fail(new DomainError('MISSING_CUSTOMER', 'Customer ID required'));
    }

    // Reconstruct value objects
    const idResult = OrderId.create();
    if (idResult.isFailure) return Result.fail(idResult.error);

    const totalResult = Money.create(dto.total);
    if (totalResult.isFailure) return Result.fail(totalResult.error);

    // Create aggregate with all invariants enforced
    const order = Order.create({
      id: idResult.value,
      customerId: dto.customerId,
      total: totalResult.value,
      items: dto.items || [],
    });

    return Result.ok(order);
  }

  static reconstitute(data: OrderPersistenceData): Result<Order, DomainError> {
    // Reconstruct value objects from persistence
    const id = OrderId.createExisting(data.id);
    const total = Money.create(data.total);
    if (total.isFailure) return Result.fail(total.error);

    // Load full aggregate state
    const order = Order.createExisting({
      id,
      customerId: data.customerId,
      total: total.value,
      items: data.items,
      version: data.version,
    });

    return Result.ok(order);
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate factory --context=orders --name=Order
```

**Generated files**:
- `src/core/orders/domain/factories/OrderFactory.ts` (pure class, no inheritance)
- `tests/unit/core/orders/domain/factories/OrderFactory.dto.spec.ts` (DTO creation tests)
- `tests/unit/core/orders/domain/factories/OrderFactory.persistence.spec.ts` (reconstitution tests)
- `tests/fixtures/factories/OrderFactoryFixture.ts` (test data)

**Generated imports**:
```typescript
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
```

**Required follow-up edits**:
1. Add method signatures for creation paths (createFromDTO, reconstitute, etc.)
2. Implement validation logic for all input paths
3. Implement value object reconstruction
4. Add all aggregate invariant checks
5. Write DTO creation unit tests
6. Write persistence reconstitution tests
7. Create test fixtures with valid and invalid data
8. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### OrderFactory (Factory)
- **File**: src/core/orders/domain/factories/OrderFactory.ts
- **Type**: Factory (DDD Primitive)
- **Role**: Create/reconstitute Order aggregate from DTOs and persistence
- **Status**: ⏳ (scaffolded, needs creation logic)
- **Tests**: DTO and persistence unit tests required
```
