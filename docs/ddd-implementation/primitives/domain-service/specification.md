# DomainService: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: Stateless operations that don't naturally belong to a single entity or value object. Domain services encapsulate domain logic that spans multiple aggregates, requires cross-aggregate coordination, or orchestrates complex business processes without owning identity.

**When to use**:
- Logic spans multiple aggregates (transfer money between accounts)
- Stateless operation (no entity identity, no persistence needed)
- Domain behavior doesn't fit in entity (PricingService, ShippingService)
- Coordination between aggregates (OrderService orchestrates Order + Inventory)
- Shared business logic used by multiple entities (PaymentProcessingService)

**When NOT to use**:
- Single entity behavior (put in entity method)
- Application orchestration (use use case for that)
- Infrastructure operations (use adapter or application service)
- Simple calculations (put in ValueObject)
- Stateful logic (use Entity or AggregateRoot)

**Required base/interface**: None (pure class with methods). No inheritance needed.

**Allowed dependencies**:
- Entities, Aggregates, ValueObjects (what it operates on)
- Specifications (for rule evaluation)
- Other Domain Services (composition)
- Repositories (via ports, queries only - no writes)
- Result (error handling)

**Forbidden dependencies**:
- Infrastructure implementations (DB clients, HTTP, file system)
- Application layer (use cases, handlers)
- Logger, Tracer (domain is pure logic)

## 2. Required Shape & Files

**Path**: `src/core/{context}/domain/services/{ServiceName}.ts`

**Must be**: Class with static or instance methods, no state

**Required exports**:
```typescript
export class PricingService {
  calculateDiscount(
    order: Order,
    customer: Customer,
    promotionCode?: string
  ): Result<Money, DomainError> {
    // Stateless coordination logic
  }

  calculateShipping(
    order: Order,
    destination: Address
  ): Result<Money, DomainError> {
    // Another domain operation
  }
}
```

**Observability hook**: None. Domain services are pure logic - no logging, tracing, or metrics.

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/domain/services/{ServiceName}.spec.ts`
  - Core logic: `{ServiceName}.core.spec.ts` (business logic, coordination, error cases)
- **Integration**: Not applicable (domain services don't integrate with infrastructure)
- **E2E**: Indirectly tested via use case E2E tests that call the service

## 3. Invariants & Guards

**Must**:
- Be stateless (no mutable fields)
- Have no entity identity (doesn't extend Entity)
- Take aggregates/entities as parameters (operate on passed objects)
- Return `Result<T, DomainError>` for operations that can fail
- Return primitive/ValueObject for deterministic calculations
- Be deterministic (same inputs = same output)
- Have no side effects (don't mutate passed objects)

**Never**:
- Hold mutable state between method calls
- Mutate parameters (operate immutably)
- Access infrastructure (DB, HTTP, file system)
- Log or trace (domain is pure)
- Throw exceptions for expected failures (use Result)
- Store aggregate references (operate on passed params only)

**Validation rules**:
- All validation in method body
- Return `Result.fail(new DomainError(...))` for failures
- Edge cases handled gracefully (null checks, boundary values)

**Span/log requirements**: None (forbidden in domain layer)

## 4. Collaboration Rules

**Who can call it**:
- Entities (self-contained logic using entity + external data)
- Aggregates (business operations spanning the cluster)
- Use Cases (application orchestration)
- Other Domain Services (composition)

**What it may call**:
- Entities/Aggregates (passed as parameters or queried via repository)
- Specifications (evaluate rules)
- ValueObjects (for attributes)
- Other Domain Services (composition)
- Result (error handling)
- Pure utility functions

**Allowed return types**:
- `Result<T, DomainError>` for operations that can fail
- Primitive types or ValueObjects for deterministic calculations
- Never: `Promise`, naked `void`, exceptions

## 5. Testing Requirements (enforced)

**Unit tests** (`{ServiceName}.core.spec.ts`):
- Happy path (normal operation succeeds)
- Error cases (returns Result.fail for business rule violations)
- Edge cases (null/undefined parameters, boundary values)
- Composition with multiple aggregates
- Determinism (same inputs = same output)
- No side effects (verify parameters unchanged)
- No mocks (operate on real domain objects)

**Integration tests**: Not applicable (domain services don't integrate with infrastructure)

**E2E tests**: Covered via use case E2E tests that invoke the service

**Fixtures/factories location**: `tests/fixtures/services/{ServiceName}Factory.ts`
- Provide test domain objects (orders, customers, etc.)
- Factory methods for different scenarios

## 6. Observability & Errors

**Logging/Tracing**: Forbidden. Domain services are pure logic.

**Error policy**:
- Use `Result<T, DomainError>` for expected failures
- Return `Result.fail(new DomainError('CODE', 'Message'))` for business rule violations
- Never throw for domain failures
- Only throw for programmer errors (null checks in dev mode)

**Example error handling**:
```typescript
calculateDiscount(order: Order, customer: Customer): Result<Money, DomainError> {
  if (order.total.isLessThan(new Money(10))) {
    return Result.fail(new DomainError('ORDER_TOO_SMALL', 'Discount only for orders > $10'));
  }
  return Result.ok(order.total.multiply(customer.discountPercentage));
}
```

## 7. Lifecycle & Evolution

**Creation**: Define class with static or instance methods, no state

**Modification**: Add new methods for domain operations

**Composition**: Services can call other services
```typescript
export class OrderService {
  constructor(
    private pricingService: PricingService,
    private inventoryService: InventoryService
  ) {}

  processOrder(order: Order): Result<ProcessedOrder, DomainError> {
    const priceResult = this.pricingService.calculateDiscount(order);
    if (priceResult.isFailure) return Result.fail(priceResult.error);
    // ...
  }
}
```

**Deprecation path**:
- Mark with `@deprecated` comment
- Create new service with migration guide
- Keep old service for 2 sprints; remove after migration

## 8. Anti-Patterns (repo-specific)

- **Stateful services**: Holding aggregate references or mutable fields
- **Infrastructure leakage**: Calling repositories for writes (only queries)
- **Logging/tracing**: No observability in domain services
- **Anemic entities**: All logic in service instead of entity (should be in entity)
- **Use case logic**: Application orchestration (belongs in use case, not domain service)
- **Throwing exceptions**: Using throw instead of Result

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/orders/domain/services/PricingService.ts
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
import { Order } from '../entities/Order';
import { Customer } from '../entities/Customer';
import { Money } from '../value-objects/Money';
import { Percentage } from '../value-objects/Percentage';

export class PricingService {
  calculateDiscount(
    order: Order,
    customer: Customer,
    promotionCode?: string
  ): Result<Money, DomainError> {
    // Start with base discount
    let discountPercentage = customer.discountPercentage;

    // Apply promotion if valid
    if (promotionCode) {
      if (promotionCode === 'LOYALTY10') {
        discountPercentage = discountPercentage.add(new Percentage(10));
      } else if (promotionCode === 'HOLIDAY20') {
        discountPercentage = discountPercentage.add(new Percentage(20));
      }
    }

    // Cap at 50%
    if (discountPercentage.value > 50) {
      discountPercentage = new Percentage(50);
    }

    // Calculate discount amount
    const discount = order.total.multiply(discountPercentage.asDecimal());
    return Result.ok(discount);
  }

  canShip(order: Order, warehouse: Warehouse): Result<boolean, DomainError> {
    if (!warehouse.hasInventory(order.items)) {
      return Result.fail(new DomainError('OUT_OF_STOCK', 'Insufficient inventory'));
    }
    return Result.ok(true);
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate domain-service --context=orders --name=Pricing
```

**Generated files**:
- `src/core/orders/domain/services/PricingService.ts` (pure class, no inheritance)
- `tests/unit/core/orders/domain/services/PricingService.core.spec.ts` (unit tests)
- `tests/fixtures/services/PricingServiceFactory.ts` (test fixtures)

**Generated imports**:
```typescript
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
```

**Required follow-up edits**:
1. Add method signatures for domain operations
2. Implement business logic with Result error handling
3. Add any constructor dependencies (other services, repositories)
4. Write core unit tests for each method
5. Test error cases and edge conditions
6. Create test fixtures with domain objects
7. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### PricingService (DomainService)
- **File**: src/core/orders/domain/services/PricingService.ts
- **Type**: DomainService (DDD Primitive)
- **Role**: Calculate pricing with discounts and promotions
- **Status**: ⏳ (scaffolded, needs business logic)
- **Tests**: Unit core test required (calculations, error cases)
```
