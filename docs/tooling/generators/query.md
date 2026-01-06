# Query Generator

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

Similar to [Command Generator](command.md) but for **read operations**.

## Quick Start

```bash
nx generate query --context=orders --name=GetOrdersByCustomer --result="Order[]"
```

**Creates**:
- `GetOrdersByCustomer.ts`
- `GetOrdersByCustomer.validation.spec.ts`
- `GetOrdersByCustomer.serialization.spec.ts`

## Key Differences from Command

### Query
```typescript
export class GetOrdersByCustomer extends Query<Order[]> {
  readonly cacheKey: string; // ✅ Queries often cached

  static create(customerId: string): Result<GetOrdersByCustomer, ValidationError> {
    // Same Zod validation + Result pattern
  }

  toPrimitives() { }
  static fromPrimitives(data) { }
}
```

### vs Command
```typescript
// ❌ Commands mutate
export class PlaceOrder extends Command<Order> { }

// ✅ Queries read
export class GetOrdersByCustomer extends Query<Order[]> { }
```

## Caching Support

Queries support caching via `cacheKey`:

```typescript
export class GetUserById extends Query<UserDto> {
  readonly cacheKey: string;

  private constructor(
    readonly userId: string,
    readonly cacheKey: string, // Key for Redis/in-memory cache
  ) {
    super();
  }

  static create(userId: string): Result<GetUserById, ValidationError> {
    // ...
    return Result.ok(new GetUserById(
      userId,
      `user:${userId}`, // Cache key
    ));
  }
}
```

Handler can use:
```typescript
async handle(req): Promise<Result<UserDto, Error>> {
  const query = GetUserById.create(req.params.id).value!;

  // Check cache
  const cached = await this.cache.get(query.cacheKey);
  if (cached) return Result.ok(cached);

  // Execute query if cache miss
  const result = await this.useCase.execute(query);
  if (result.isSuccess) {
    await this.cache.set(query.cacheKey, result.value, 300); // 5 min TTL
  }
  return result;
}
```

## Testing

Same 2 test files as Command:
- `{Name}.validation.spec.ts` — Zod schema tests
- `{Name}.serialization.spec.ts` — Round-trip tests

See [Command Generator](command.md) for detailed test examples.

---

For full spec, see [docs/ddd-implementation/primitives/query/specification.md](../../ddd-implementation/primitives/query/specification.md).
