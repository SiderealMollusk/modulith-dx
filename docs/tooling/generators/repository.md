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
