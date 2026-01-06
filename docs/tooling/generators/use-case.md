# Use Case Generator

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

See [docs/ddd-implementation/primitives/use-case/specification.md](../../ddd-implementation/primitives/use-case/specification.md) for full details.

## Quick Start

```bash
nx generate @local/ddd:use-case --context=orders --name=PlaceOrder
```

Creates:
```
src/core/orders/application/use-cases/
├── PlaceOrderUseCase.ts (generated)
├── PlaceOrderUseCase.spec.ts (generated unit test)
└── PlaceOrderUseCase.integration.spec.ts (optional stub)
```

See [TEMPLATE.md](TEMPLATE.md) for common patterns (base class, dependency injection, Result type, etc).

## Generated Structure

### UseCase Class
```typescript
export class PlaceOrderUseCase extends BaseUseCase<PlaceOrderInput, OrderDto> {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: EventBus,
    // ... other dependencies
  ) {
    super();
  }

  async execute(input: PlaceOrderInput): Promise<Result<OrderDto, ApplicationError>> {
    // 1. Validate input via domain
    // 2. Load aggregates from repositories
    // 3. Perform business logic
    // 4. Save changes
    // 5. Publish domain events
    // 6. Return DTO

    return Result.ok(orderDto);
  }
}
```

### Test Template (Unit)
```typescript
describe('PlaceOrderUseCase (Unit)', () => {
  let useCase: PlaceOrderUseCase;
  let orderRepository: MockOrderRepository;

  beforeEach(() => {
    orderRepository = new MockOrderRepository();
    useCase = new PlaceOrderUseCase(
      orderRepository,
      // ... other mocks
    );
  });

  describe('happy path', () => {
    it('should place valid order', async () => {
      const result = await useCase.execute({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.id).toBeDefined();
    });
  });

  describe('validation failures', () => {
    it('should reject empty items', async () => {
      const result = await useCase.execute({
        customerId: 'cust-123',
        items: [],
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('business rule failures', () => {
    it('should reject if customer not found', async () => {
      // Setup: customer doesn't exist in mock
      const result = await useCase.execute({
        customerId: 'unknown',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      });

      expect(result.isFailure).toBe(true);
    });
  });
});
```

## Key Features

- ✅ Extends `BaseUseCase<TInput, TOutput>`
- ✅ Async execute method
- ✅ Returns `Result<T, ApplicationError>`
- ✅ Full observability (logging, tracing, metrics via base class)
- ✅ Dependencies injected via constructor
- ✅ Unit tests with mocks
- ✅ Integration test stub (optional)

## Key Rules

✅ **DO**:
- Take Commands/Queries as input
- Load aggregates from repositories
- Perform domain operations
- Return DTOs (not entities)
- Publish domain events
- Inject dependencies via constructor
- Write both unit and integration tests

❌ **DON'T**:
- Query database directly (use repositories)
- Include HTTP/gRPC logic (handlers do that)
- Throw exceptions (return Result instead)
- Return domain entities (convert to DTOs)
- Skip testing for edge cases

## Related Documentation

- [UseCase specification](../../ddd-implementation/primitives/use-case/specification.md)
- [Handler generator](handler.md) — Handlers call use cases
- [Command/Query generators](command.md) — Input to use cases
- [Repository generator](repository.md) — Dependencies for use cases

---

See [generators/README.md](README.md) for overview of all generators.
