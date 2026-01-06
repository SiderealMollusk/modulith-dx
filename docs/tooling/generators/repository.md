# Repository Generator

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

See [docs/ddd-implementation/primitives/repository/specification.md](../../ddd-implementation/primitives/repository/specification.md) for full details.

## Quick Start

```bash
nx generate @local/ddd:repository --context=orders --aggregate=Order
```

Creates:
```
src/core/orders/
├── application/
│   └── ports/
│       └── OrderRepository.ts (interface)
└── infrastructure/
    └── adapters/
        ├── InMemoryOrderRepository.ts (in-memory adapter)
        ├── PostgresOrderRepository.ts (template)
        └── InMemoryOrderRepository.integration.spec.ts (test)
```

See [TEMPLATE.md](TEMPLATE.md) for common patterns (base class, dependency injection, Result type, etc).

## Generated Structure

### Port (Interface)
```typescript
export interface OrderRepository {
  findById(id: OrderId): Promise<Result<Order | null, RepositoryError>>;
  findAll(): Promise<Result<Order[], RepositoryError>>;
  findByCustomerId(customerId: CustomerId): Promise<Result<Order[], RepositoryError>>;
  
  save(order: Order): Promise<Result<void, RepositoryError>>;
  delete(id: OrderId): Promise<Result<void, RepositoryError>>;
}
```

### Adapter (In-Memory Implementation)
```typescript
export class InMemoryOrderRepository extends BaseRepositoryAdapter<OrderRepository> implements OrderRepository {
  private orders = new Map<string, Order>();

  async findById(id: OrderId): Promise<Result<Order | null, RepositoryError>> {
    return this.withSpan('OrderRepository.findById', async () => {
      const order = this.orders.get(id.value) ?? null;
      this.logger.debug(`Found order ${id.value}:`, order ? 'yes' : 'no');
      return Result.ok(order);
    });
  }

  async save(order: Order): Promise<Result<void, RepositoryError>> {
    return this.withSpan('OrderRepository.save', async () => {
      this.orders.set(order.id.value, order);
      this.logger.debug(`Saved order ${order.id.value}`);
      return Result.ok();
    });
  }

  // ... other methods
}
```

### Integration Test
```typescript
describe('InMemoryOrderRepository (Integration)', () => {
  let repository: InMemoryOrderRepository;

  beforeEach(() => {
    repository = new InMemoryOrderRepository();
  });

  describe('save and find', () => {
    it('should save and retrieve order', async () => {
      const order = Order.create('cust-123', [...]).value!;

      await repository.save(order);
      const result = await repository.findById(order.id);

      expect(result.isSuccess).toBe(true);
      expect(result.value?.id).toEqual(order.id);
    });
  });

  describe('findByCustomerId', () => {
    it('should find multiple orders by customer', async () => {
      const cust = new CustomerId('cust-123');
      const order1 = Order.create(cust.value, [...]).value!;
      const order2 = Order.create(cust.value, [...]).value!;

      await repository.save(order1);
      await repository.save(order2);

      const result = await repository.findByCustomerId(cust);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
    });
  });
});
```

## Key Features

- ✅ Port (interface) in `application/ports/`
- ✅ Adapter (implementation) in `infrastructure/adapters/`
- ✅ Extends `BaseRepositoryAdapter` for observability
- ✅ Returns `Promise<Result<T, RepositoryError>>`
- ✅ Full logging/tracing via `withSpan()`
- ✅ In-memory implementation for testing
- ✅ Integration tests (with real repository)

## Dependency Injection Pattern

### In UseCase
```typescript
export class PlaceOrderUseCase extends BaseUseCase<PlaceOrderInput, OrderDto> {
  constructor(
    private orderRepository: OrderRepository, // ✅ Depends on port, not adapter
    private eventBus: EventBus,
  ) {
    super();
  }

  async execute(input): Promise<Result<OrderDto, ApplicationError>> {
    const order = await this.orderRepository.findById(id); // ✅ Works with any adapter
    // ...
  }
}
```

### In Handler/Bootstrap
```typescript
// ✅ Inject concrete adapter, not interface
const orderRepository: OrderRepository = new InMemoryOrderRepository();
// Or production: = new PostgresOrderRepository(db);
const useCase = new PlaceOrderUseCase(orderRepository, eventBus);
```

## Key Rules

✅ **DO**:
- Create port (interface) separate from adapters
- Return `Result<T, RepositoryError>` from all methods
- Use `withSpan()` for observability
- Create at least one concrete adapter (in-memory)
- Include integration tests

❌ **DON'T**:
- Expose repository implementation details in port
- Throw exceptions (return Result instead)
- Include business logic in repository
- Forget logging/tracing

## Related Documentation

- [Repository specification](../../ddd-implementation/primitives/repository/specification.md)
- [UseCase generator](use-case.md) — Uses repositories
- [Ports and Adapters](../../ddd-implementation/primitives/repository/specification.md#pattern)

---

See [generators/README.md](README.md) for overview of all generators.

## Template: {Name}.specification.md (generate alongside the repository)

Use this exact content when scaffolding the instance-level spec for a repository. Keep it delta-focused; defer to the parent spec for general rules.

```markdown
# {Name} Repository Specification

**Parent spec**: ../../ddd-implementation/primitives/repository/specification.md  
**Purpose**: capture only instance-specific details; omit anything identical to the parent.

## What this repository handles (1–2 sentences)
- [FILL IN: aggregate/entity managed; read/write scope]
- [FILL IN: consistency/latency expectations]

## Port shape
- [FILL IN: required methods and semantics]
- [FILL IN: return types/results and error semantics]

## Adapters and data stores
- [FILL IN: primary adapter (db/cache/queue) and constraints]
- [FILL IN: transaction/consistency rules; indexing expectations]

## Events and side effects
- [FILL IN: emitted domain events or outbox usage]
- [FILL IN: retries/idempotency expectations]

## Observability
- [FILL IN: tracing/logging/metrics requirements if special]

## Related docs
- Parent: ../../ddd-implementation/primitives/repository/specification.md
- Neighbors: [FILL IN other relevant specs]

**Generated by**: nx generate @local/ddd:repository --context={context} --aggregate={aggregate}  
**Last updated**: [Auto-generated date]
```

## Template: {Name}.enforcement.md (generate alongside the repository)

Generate this file verbatim. It documents instance-specific guardrails beyond the parent enforcement contract.

```markdown
# {Name} Repository Enforcement

**Parent enforcement**: ../../ddd-implementation/primitives/repository/enforcement.md  
**Purpose**: capture only what is unique to this repository; the parent already enforces the rest.

## Why this repository is sensitive
- [FILL IN: critical data path, SLAs, regulatory constraints]
- [FILL IN: consumers/adapters depending on behavior]

## Required shape & contract deltas
- [FILL IN: methods that must not change signatures/semantics]
- [FILL IN: transactional/consistency guarantees specific here]

## Safe changes checklist (impact map)
- If port changes: update adapters, use cases, tests, contracts
- If persistence changes: update migrations/schema/indexes and integration tests
- If observability changes: update tracing/logging/metrics expectations

## Minimal tests required
- Unit: method-level behavior with happy/failure paths
- Integration: against chosen adapter/store for critical flows
- Idempotency/consistency: scenarios relevant to this repository

## Collaborators
- Callers: [FILL IN: which use cases/services depend on it]
- Adapters: [FILL IN: in-memory/db/other adapters maintained]

## Anti-patterns (instance-specific)
- [FILL IN: unique bans beyond parent, e.g., leaking ORM entities]

## Observability (only if special)
- [FILL IN tracing/logging requirements] or “None”

**Generated by**: nx generate @local/ddd:repository --context={context} --aggregate={aggregate}  
**Last updated**: [Auto-generated date]
```
