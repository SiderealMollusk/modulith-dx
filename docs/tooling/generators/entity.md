# Entity Generator

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

See [docs/ddd-implementation/primitives/entity/specification.md](../../ddd-implementation/primitives/entity/specification.md) for full details.

## Quick Start

```bash
nx generate @local/ddd:entity --context=orders --name=Order --idType=OrderId
```

**Creates**:
```
src/core/orders/
├── domain/
│   ├── entities/
│   │   └── Order.ts (generated)
│   └── value-objects/
│       └── OrderId.ts (must exist or be created separately)
└── tests/
    └── unit/
        └── domain/
            └── entities/
                └── Order.spec.ts (generated)
```

## Generated Structure

### Entity Class
```typescript
export class Order extends BaseEntity<OrderId> {
  private constructor(
    readonly id: OrderId,
    readonly customerId: string,
    readonly items: OrderItem[],
    readonly status: OrderStatus,
  ) {
    super(id);
  }

  static create(
    customerId: string,
    items: OrderItem[],
  ): Result<Order, DomainError> {
    // Validation...
    return Result.ok(new Order(
      new OrderId(generateId()),
      customerId,
      items,
      'pending',
    ));
  }

  // Business methods...
  confirmOrder(): Result<void, DomainError> {
    // Check invariants, possibly raise event
    return Result.ok();
  }
}
```

### Test Template
```typescript
describe('Order', () => {
  describe('create', () => {
    it('should create valid order', () => {
      const result = Order.create('cust-123', [
        { sku: 'WIDGET', quantity: 5 },
      ]);
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('invariants', () => {
    it('should enforce at least one item', () => {
      // Test that empty items array fails
    });
  });

  describe('business methods', () => {
    it('should confirm order when valid', () => {
      // Test confirmOrder() logic
    });
  });
});
```

## Key Features

- ✅ Extends `BaseEntity<TId>`
- ✅ Private constructor + static factory
- ✅ All fields readonly
- ✅ Returns `Result<Order, DomainError>`
- ✅ Includes unit test stub
- ✅ Supports event collection (via BaseEntity)

See [Command Generator](command.md) for detailed walkthrough example.
