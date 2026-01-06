# Quick Start: Tooling Guide

**Status**: 🟠 [Tooling not yet implemented](status.md) — this is the spec.

## For Right Now (Manual Approach)

You can create primitives today without the generators. Follow this workflow:

### 1. Creating a Command

**Manual steps**:

```bash
# 1. Create the command file
mkdir -p src/core/orders/application/commands
touch src/core/orders/application/commands/PlaceOrder.ts

# 2. Create validation test
touch src/core/orders/application/commands/PlaceOrder.validation.spec.ts

# 3. Create serialization test
touch src/core/orders/application/commands/PlaceOrder.serialization.spec.ts
```

**Template** (`PlaceOrder.ts`):
```typescript
import { Command, Result } from '@shared/kernel';
import { z } from 'zod';
import { OrderId } from '../value-objects/OrderId';
import { CustomerId } from '../../identity/domain/value-objects/CustomerId';

export const PlaceOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(z.object({
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
});

export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;

export class PlaceOrder extends Command<OrderId> {
  private constructor(
    readonly customerId: CustomerId,
    readonly items: Array<{ sku: string; quantity: number }>,
    readonly id: string,
    readonly correlationId: string,
    readonly version: number = 1,
  ) {
    super();
  }

  static create(input: PlaceOrderInput): Result<PlaceOrder, ValidationError> {
    const validated = PlaceOrderSchema.safeParse(input);
    if (!validated.success) {
      return Result.fail(new ValidationError(validated.error.message));
    }

    return Result.ok(new PlaceOrder(
      new CustomerId(validated.data.customerId),
      validated.data.items,
      generateId(),
      generateCorrelationId(),
    ));
  }

  toPrimitives() {
    return {
      customerId: this.customerId.value,
      items: this.items,
      id: this.id,
      correlationId: this.correlationId,
      version: this.version,
    };
  }

  static fromPrimitives(primitives: any): Result<PlaceOrder, ValidationError> {
    const validated = PlaceOrderSchema.safeParse(primitives);
    if (!validated.success) {
      return Result.fail(new ValidationError(validated.error.message));
    }
    return Result.ok(new PlaceOrder(
      new CustomerId(validated.data.customerId),
      validated.data.items,
      primitives.id,
      primitives.correlationId,
      primitives.version || 1,
    ));
  }
}
```

**Validation test** (`PlaceOrder.validation.spec.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { PlaceOrder } from './PlaceOrder';

describe('PlaceOrder Validation', () => {
  it('should create valid command', () => {
    const result = PlaceOrder.create({
      customerId: 'cust-123',
      items: [{ sku: 'SKU-001', quantity: 2 }],
    });
    expect(result.isSuccess).toBe(true);
  });

  it('should reject empty items', () => {
    const result = PlaceOrder.create({
      customerId: 'cust-123',
      items: [],
    });
    expect(result.isFailure).toBe(true);
  });

  it('should reject invalid quantity', () => {
    const result = PlaceOrder.create({
      customerId: 'cust-123',
      items: [{ sku: 'SKU-001', quantity: -1 }],
    });
    expect(result.isFailure).toBe(true);
  });
});
```

**Serialization test** (`PlaceOrder.serialization.spec.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { PlaceOrder } from './PlaceOrder';

describe('PlaceOrder Serialization', () => {
  it('should round-trip through serialization', () => {
    const created = PlaceOrder.create({
      customerId: 'cust-123',
      items: [{ sku: 'SKU-001', quantity: 2 }],
    });
    expect(created.isSuccess).toBe(true);

    const original = created.value!;
    const primitives = original.toPrimitives();
    const restored = PlaceOrder.fromPrimitives(primitives);

    expect(restored.isSuccess).toBe(true);
    expect(restored.value!.customerId).toEqual(original.customerId);
    expect(restored.value!.items).toEqual(original.items);
  });
});
```

### 2. Creating an Entity

See [docs/ddd-implementation/primitives/entity/specification.md](../ddd-implementation/primitives/entity/specification.md) for detailed spec.

**Quick template**:
```typescript
import { BaseEntity } from '@shared/kernel';
import { UserId } from './UserId';

export class User extends BaseEntity<UserId> {
  private constructor(
    readonly id: UserId,
    readonly email: string,
    readonly name: string,
  ) {
    super(id);
  }

  static create(email: string, name: string): Result<User, DomainError> {
    const emailResult = Email.create(email);
    if (emailResult.isFailure) return Result.fail(emailResult.error);

    return Result.ok(new User(
      new UserId(generateId()),
      emailResult.value.value,
      name,
    ));
  }
}
```

### 3. Creating a UseCase

See [docs/ddd-implementation/primitives/use-case/specification.md](../ddd-implementation/primitives/use-case/specification.md).

**Quick template**:
```typescript
import { BaseUseCase, Result } from '@shared/kernel';

export class CreateUserUseCase extends BaseUseCase<CreateUserInput, UserDto> {
  async execute(input: CreateUserInput): Promise<Result<UserDto, ApplicationError>> {
    // 1. Create domain entity
    const userResult = User.create(input.email, input.name);
    if (userResult.isFailure) return Result.fail(userResult.error);

    // 2. Check business rules
    const existing = await this.userRepository.findByEmail(userResult.value.email);
    if (existing.isSuccess && existing.value) {
      return Result.fail(new ApplicationError('USER_EXISTS', 'Email already in use'));
    }

    // 3. Persist
    const saved = await this.userRepository.save(userResult.value);
    if (saved.isFailure) return Result.fail(saved.error);

    // 4. Publish events
    await this.eventBus.publishAll(userResult.value.getDomainEvents());

    // 5. Return DTO
    return Result.ok(UserMapper.toDto(userResult.value));
  }
}
```

## When Generators Are Ready

Once [Phase 3](../../plans/current.md#phase-3-nx-generators-code-scaffolding) is complete, replace all this with:

```bash
# Create a command with validation + serialization tests
nx generate command --context=orders --name=PlaceOrder --result=OrderId

# Create an entity with Brand ID and factory
nx generate entity --context=orders --name=Order --idType=OrderId

# Create a use case with test stubs
nx generate use-case --context=orders --name=PlaceOrder

# Create a handler (HTTP, gRPC, CLI variant)
nx generate handler --context=orders --name=PlaceOrder --protocol=http
```

Each generator will:
- ✅ Create the class with correct base class
- ✅ Create validation schema (Zod for Command/Query)
- ✅ Create test file stubs
- ✅ Enforce immutability (readonly fields)
- ✅ Add to `index.ts` exports
- ✅ Register in workspace.json

## File Structure to Follow

While generators are being built, manually create files in this structure:

```
src/core/{context}/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   └── Order.ts
│   ├── value-objects/
│   │   ├── UserId.ts
│   │   ├── Email.ts
│   │   └── OrderId.ts
│   ├── events/
│   │   ├── UserCreated.ts
│   │   └── OrderPlaced.ts
│   ├── policies/
│   │   └── OrderMustHaveItems.ts
│   └── services/
│       └── PricingDomainService.ts
├── application/
│   ├── commands/
│   │   ├── CreateUser.ts
│   │   ├── CreateUser.validation.spec.ts
│   │   └── CreateUser.serialization.spec.ts
│   ├── queries/
│   │   ├── GetUserById.ts
│   │   ├── GetUserById.validation.spec.ts
│   │   └── GetUserById.serialization.spec.ts
│   ├── use-cases/
│   │   ├── CreateUserUseCase.ts
│   │   ├── CreateUserUseCase.spec.ts (unit)
│   │   └── CreateUserUseCase.integration.spec.ts
│   ├── ports/
│   │   ├── UserRepository.ts
│   │   └── EmailService.ts
│   ├── mappers/
│   │   └── UserMapper.ts
│   └── dtos/
│       └── UserDto.ts
├── infrastructure/
│   ├── adapters/
│   │   ├── InMemoryUserRepository.ts
│   │   └── InMemoryUserRepository.integration.spec.ts
│   └── mappers/
│       └── UserPersistenceMapper.ts
└── interface/
    ├── handlers/
    │   ├── CreateUserHttpHandler.ts
    │   └── CreateUserHttpHandler.spec.ts
    └── controllers/ (if needed)
```

## Next Steps

1. **Now**: Use templates above to create primitives manually
2. **Week 1**: [Phase 1 & 2](../../plans/current.md) — Directory setup + ADR tool
3. **Week 2**: [Phase 3](../../plans/current.md#phase-3-nx-generators-code-scaffolding) — Generators (much faster after this!)
4. **Week 3+**: [Phase 4-8](../../plans/current.md) — Validation + ESLint + polish

---

**Questions?** See [docs/ddd-implementation/primitives/](../ddd-implementation/primitives/README.md) for primitive specs.
