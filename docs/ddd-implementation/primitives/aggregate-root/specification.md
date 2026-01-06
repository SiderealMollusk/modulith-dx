# AggregateRoot: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: A cluster of entities and value objects with a single entity acting as the root. The root enforces invariants across the cluster and controls access to cluster members. The aggregate is the consistency boundary.

**When to use**:
- Cluster of objects must be consistent as a unit
- Need transaction boundary (save all or nothing)
- Complex invariants span multiple entities
- External access should go through a single entry point

**When NOT to use**:
- Single entity with no children (just use Entity)
- Weak relationships between objects (use separate aggregates)
- Objects have independent lifecycles (use separate aggregates)

**Required base/interface**: `BaseEntity<TId extends Brand<string, any>>` (same as Entity) + domain event collection

**Allowed dependencies**:
- Entities (child members of aggregate)
- ValueObjects (attributes)
- DomainEvents (emit state changes)
- Specifications/Policies (validation)
- Result (error handling)

**Forbidden dependencies**:
- Other AggregateRoots (use IDs for references, not direct refs)
- Infrastructure (repositories, HTTP, database)
- Application layer (use cases, handlers)
- Logger, Tracer, or any observability

## 2. Required Shape & Files

**Path**: `src/core/{context}/domain/entities/{Name}.ts` (same as Entity - AggregateRoot is a special Entity)

**Must extend**: `BaseEntity<TId>` and implement aggregate-specific behavior

**Required exports**:
```typescript
export class Order extends BaseEntity<OrderId> {
  // Child entities/value objects (private)
  private _items: OrderItem[] = [];
  
  // Static factory method
  static create(props: CreateOrderProps): Result<Order, DomainError>;
  
  // Identity
  get id(): OrderId;
  
  // Aggregate-wide invariant enforcement
  addItem(item: OrderItem): Result<void, DomainError>;
  removeItem(itemId: OrderItemId): Result<void, DomainError>;
  
  // Domain events accessor
  getDomainEvents(): DomainEvent[];
  clearDomainEvents(): void;
}
```

**Observability hook**: None. AggregateRoots are pure domain - no logging, tracing, or metrics.

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/domain/entities/{Name}.spec.ts`
  - Core logic: `{Name}.core.spec.ts` (invariants across cluster, event emission)
- **Integration**: Not applicable (aggregates don't touch infrastructure directly)
- **E2E**: Indirectly tested via use case E2E tests

## 3. Invariants & Guards

**Must**:
- Have stable identity (ID never changes)
- Use branded ID type (OrderId, CartId, etc.)
- Enforce invariants across all child entities/VOs
- Emit DomainEvents for state changes
- Provide access to children only through root methods
- Return `Result<T, DomainError>` for operations that can fail
- Collect domain events for publishing (via `getDomainEvents()`)

**Never**:
- Allow direct mutation of child entities from outside
- Reference other aggregates by object reference (use IDs)
- Leak child entities (return readonly collections or copies)
- Throw exceptions for domain failures (use Result)
- Access infrastructure (DB, HTTP, file system)
- Log or trace (domain is pure)

**Validation rules**:
- Validate aggregate-wide invariants in root methods
- Delegate entity-level validation to child entities
- Return `Result.fail(new DomainError(...))` for violations

**Span/log requirements**: None (forbidden in domain layer)

## 4. Collaboration Rules

**Who can call it**:
- Domain Services (orchestrate cross-aggregate logic)
- Use Cases (application layer orchestration)
- Factories (for complex creation)
- Repositories (load/save aggregate)

**What it may call**:
- Child Entities (composition)
- ValueObjects (attributes)
- Specifications/Policies (validation)
- DomainEvents (emit state changes)
- Result (error handling)

**Allowed return types**:
- `Result<T, DomainError>` for operations
- Primitive types or ValueObjects for getters
- Readonly collections for child entities
- `DomainEvent[]` for event accessor
- Never: naked `Promise` (no async in domain)

## 5. Testing Requirements (enforced)

**Unit tests** (`{Name}.core.spec.ts`):
- Aggregate-wide invariants (e.g., "Order total must match sum of items")
- Child entity creation/modification through root
- Event emission on state changes
- Edge cases (empty aggregate, boundary values)
- Child entity encapsulation (external code can't mutate children directly)
- No mocks (aggregates are pure)

**Integration tests**: Not applicable (aggregates don't integrate with infrastructure)

**E2E tests**: Covered via use case E2E tests that exercise aggregate behavior

**Fixtures/factories location**: `tests/fixtures/entities/{Name}Factory.ts`
- Provide `validOrder()`, `orderWithTenItems()`, etc.

## 6. Observability & Errors

**Logging/Tracing**: Forbidden. AggregateRoots are pure domain logic.

**Error policy**:
- Use `Result<T, DomainError>` for expected failures
- DomainError has code + message: `new DomainError('ORDER_TOTAL_MISMATCH', 'Order total must match items')`
- Never throw for domain validation failures
- Only throw for programmer errors (e.g., null checks in dev)

**Event emission**:
- Emit DomainEvents for state changes: `OrderPlaced`, `OrderItemAdded`, `OrderCancelled`
- Store events in private collection: `private _domainEvents: DomainEvent[] = []`
- Provide `getDomainEvents()` for retrieval and `clearDomainEvents()` for cleanup

## 7. Lifecycle & Evolution

**Creation**: Static factory method `create()` validates and returns `Result<AggregateRoot, DomainError>`

**Modification**: Behavior methods return `Result<void, DomainError>` and enforce invariants
```typescript
addItem(item: OrderItem): Result<void, DomainError> {
  if (this._status === 'cancelled') {
    return Result.fail(new DomainError('ORDER_CANCELLED', 'Cannot add items to cancelled order'));
  }
  
  this._items.push(item);
  this.addDomainEvent(new OrderItemAdded(this.id, item.id));
  return Result.ok(undefined);
}
```

**Deletion**: Soft delete or repository delete (not aggregate responsibility)

**Deprecation path**:
- Mark with `@deprecated` comment
- Create new aggregate with migration guide
- Keep old aggregate for 2 sprints; remove after migration

## 8. Anti-Patterns (repo-specific)

- **Anemic aggregates**: No behavior, just data holders (put invariant enforcement in root)
- **Large cluster**: Too many child entities (split into separate aggregates)
- **Direct child access**: Exposing mutable children (return readonly or copies)
- **Cross-aggregate references**: Holding object references to other aggregates (use IDs)
- **Infrastructure leakage**: Database, HTTP, or file system access
- **Logging in domain**: No console.log, no Logger injection

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/orders/domain/entities/Order.ts
import { BaseEntity } from '@shared/kernel/domain/BaseEntity';
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
import { OrderId } from '../value-objects/OrderId';
import { OrderItem } from './OrderItem';
import { OrderPlaced } from '../events/OrderPlaced';
import { OrderItemAdded } from '../events/OrderItemAdded';

export class Order extends BaseEntity<OrderId> {
  private _items: OrderItem[] = [];
  private _status: 'pending' | 'cancelled' = 'pending';

  private constructor(id: OrderId) {
    super(id);
  }

  static create(id: OrderId): Result<Order, DomainError> {
    const order = new Order(id);
    order.addDomainEvent(new OrderPlaced(id));
    return Result.ok(order);
  }

  get items(): readonly OrderItem[] {
    return this._items; // Readonly prevents external mutation
  }

  get total(): number {
    return this._items.reduce((sum, item) => sum + item.price, 0);
  }

  addItem(item: OrderItem): Result<void, DomainError> {
    if (this._status === 'cancelled') {
      return Result.fail(new DomainError('ORDER_CANCELLED', 'Cannot add items to cancelled order'));
    }
    
    this._items.push(item);
    this.addDomainEvent(new OrderItemAdded(this.id, item.id));
    return Result.ok(undefined);
  }

  cancel(): void {
    this._status = 'cancelled';
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate aggregate --context=orders --name=Order
```

**Generated files**:
- `src/core/orders/domain/entities/Order.ts` (extends BaseEntity, event collection)
- `src/core/orders/domain/value-objects/OrderId.ts` (branded ID type)
- `tests/unit/core/orders/domain/entities/Order.core.spec.ts` (unit tests)
- `tests/fixtures/entities/OrderFactory.ts` (test fixtures)

**Generated imports**:
```typescript
import { BaseEntity } from '@shared/kernel/domain/BaseEntity';
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
import { DomainEvent } from '@shared/kernel/events';
```

**Required follow-up edits**:
1. Add private fields for child entities/value objects
2. Implement static `create()` with initial events
3. Add behavior methods enforcing invariants
4. Define DomainEvents for state changes
5. Implement `getDomainEvents()` and `clearDomainEvents()`
6. Write core unit tests for invariants
7. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### Order (AggregateRoot)
- **File**: src/core/orders/domain/entities/Order.ts
- **Type**: AggregateRoot (DDD Primitive)
- **Role**: Consistency boundary for order cluster
- **Status**: ⏳ (scaffolded, needs invariant logic)
- **Tests**: Unit core test required (invariants, events)
```
