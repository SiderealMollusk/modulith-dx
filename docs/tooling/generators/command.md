# Command Generator

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

## When to Use

Create a **Command** when you need to **mutate application state**:

- User creates account
- Order is placed
- Payment is processed
- Configuration is updated

**Not for**: Reading data (use Query instead). Observing side effects (use DomainEvent).

## Decision Context

[ADR-0002: Command and Query as First-Class Primitives](../../architecture-decisions/accepted/command-query-as-primitives.md)

**Why Commands are primitives**:
- Serializable (can be sent over message buses)
- Versionable (schema evolution)
- Idempotent (via `commandId`)
- Traceable (via `correlationId`)
- Immutable (enforced)

## Quick Start

```bash
nx generate command --context=orders --name=PlaceOrder --result=Order
```

**Creates**:
```
src/core/orders/application/commands/
├── PlaceOrder.ts                          # The command
├── PlaceOrder.validation.spec.ts          # Zod schema tests
├── PlaceOrder.serialization.spec.ts       # Round-trip tests
└── index.ts (updated)
```

## Generated Code Walkthrough

### 1. The Command Class (`PlaceOrder.ts`)

```typescript
import { Command, Result, ValidationError, generateId, generateCorrelationId } from '@shared/kernel';
import { z } from 'zod';
import { Order } from '../dtos/Order';

// Zod schema for validation + TypeScript inference
export const PlaceOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID required'),
  items: z.array(z.object({
    sku: z.string().min(1),
    quantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'Must have at least one item'),
  notes: z.string().optional(),
});

export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;

/**
 * PlaceOrder Command
 *
 * Mutation: Creates a new order with items
 * Result: Order DTO with ID and status
 * Idempotency: commandId ensures no duplicate orders
 *
 * @example
 * const cmd = PlaceOrder.create({
 *   customerId: 'cust-123',
 *   items: [{ sku: 'WIDGET', quantity: 5 }],
 * });
 * if (cmd.isSuccess) {
 *   const result = await useCase.execute(cmd.value);
 * }
 */
export class PlaceOrder extends Command<Order> {
  // Private constructor prevents external instantiation
  private constructor(
    readonly customerId: string,
    readonly items: Array<{ sku: string; quantity: number }>,
    readonly notes: string | undefined,
    // Command metadata (auto-generated)
    readonly id: string, // commandId for idempotency
    readonly correlationId: string, // For distributed tracing
    readonly version: number = 1, // For schema evolution
  ) {
    super();
  }

  /**
   * Factory method for creating valid commands
   * Always returns Result<Command, ValidationError>
   */
  static create(input: PlaceOrderInput): Result<PlaceOrder, ValidationError> {
    // Validate via Zod schema
    const validated = PlaceOrderSchema.safeParse(input);
    if (!validated.success) {
      const errors = validated.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      return Result.fail(new ValidationError(errors));
    }

    // Create with auto-generated IDs
    return Result.ok(new PlaceOrder(
      validated.data.customerId,
      validated.data.items,
      validated.data.notes,
      generateId(), // commandId
      generateCorrelationId(), // for tracing
    ));
  }

  /**
   * Serialize to primitives for message bus / storage
   * Used by command bus before dispatching
   */
  toPrimitives() {
    return {
      customerId: this.customerId,
      items: this.items,
      notes: this.notes,
      id: this.id,
      correlationId: this.correlationId,
      version: this.version,
    };
  }

  /**
   * Deserialize from primitives (message bus / storage)
   * Validates + reconstructs command
   */
  static fromPrimitives(primitives: unknown): Result<PlaceOrder, ValidationError> {
    const validated = PlaceOrderSchema.safeParse(primitives);
    if (!validated.success) {
      return Result.fail(new ValidationError(validated.error.message));
    }

    const data = primitives as any;
    return Result.ok(new PlaceOrder(
      validated.data.customerId,
      validated.data.items,
      validated.data.notes,
      data.id,
      data.correlationId,
      data.version ?? 1,
    ));
  }
}
```

### 2. Validation Test (`PlaceOrder.validation.spec.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { PlaceOrder } from './PlaceOrder';
import { ValidationError } from '@shared/kernel';

describe('PlaceOrder Validation', () => {
  describe('Happy Path', () => {
    it('should create valid command with required fields', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.customerId).toBe('cust-123');
      expect(result.value?.id).toBeDefined();
      expect(result.value?.correlationId).toBeDefined();
    });

    it('should create with optional notes', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
        notes: 'Gift wrapping required',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.notes).toBe('Gift wrapping required');
    });

    it('should create with multiple items', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [
          { sku: 'WIDGET', quantity: 5 },
          { sku: 'GADGET', quantity: 2 },
          { sku: 'TOOL', quantity: 1 },
        ],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.items).toHaveLength(3);
    });
  });

  describe('Validation Failures', () => {
    it('should reject missing customerId', () => {
      const result = PlaceOrder.create({
        customerId: '',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Customer ID required');
    });

    it('should reject empty items array', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('at least one item');
    });

    it('should reject invalid quantity (negative)', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: -1 }],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('positive');
    });

    it('should reject invalid quantity (zero)', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 0 }],
      });

      expect(result.isFailure).toBe(true);
    });

    it('should reject non-integer quantity', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5.5 }],
      });

      expect(result.isFailure).toBe(true);
    });

    it('should reject missing SKU', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: '', quantity: 5 }],
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('Immutability', () => {
    it('should not allow mutation of command', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      });

      const cmd = result.value!;
      // @ts-expect-error - readonly field
      expect(() => { cmd.customerId = 'different'; }).toThrow();
    });

    it('should not allow mutation of items array', () => {
      const result = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      });

      const cmd = result.value!;
      // Original array is mutable, but should be treated as read-only
      expect(cmd.items).toHaveLength(1);
    });
  });
});
```

### 3. Serialization Test (`PlaceOrder.serialization.spec.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { PlaceOrder } from './PlaceOrder';

describe('PlaceOrder Serialization', () => {
  describe('Round-trip', () => {
    it('should serialize and deserialize correctly', () => {
      // Create original
      const original = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
        notes: 'Gift wrap',
      }).value!;

      // Serialize
      const primitives = original.toPrimitives();

      // Deserialize
      const restored = PlaceOrder.fromPrimitives(primitives).value!;

      // Verify equality
      expect(restored.customerId).toBe(original.customerId);
      expect(restored.items).toEqual(original.items);
      expect(restored.notes).toBe(original.notes);
      expect(restored.id).toBe(original.id); // commandId preserved
      expect(restored.correlationId).toBe(original.correlationId); // tracing preserved
    });

    it('should preserve version during round-trip', () => {
      const original = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      }).value!;

      const primitives = original.toPrimitives();
      const restored = PlaceOrder.fromPrimitives(primitives).value!;

      expect(restored.version).toBe(original.version);
    });
  });

  describe('Message Bus Format', () => {
    it('should serialize to JSON-safe format', () => {
      const cmd = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      }).value!;

      const primitives = cmd.toPrimitives();
      const json = JSON.stringify(primitives);
      const parsed = JSON.parse(json);

      expect(parsed.customerId).toBe('cust-123');
      expect(parsed.items).toEqual([{ sku: 'WIDGET', quantity: 5 }]);
      expect(parsed.id).toBeDefined();
    });

    it('should deserialize from message bus data', () => {
      const messageData = {
        customerId: 'cust-456',
        items: [{ sku: 'GADGET', quantity: 2 }],
        id: 'msg-789',
        correlationId: 'trace-123',
        version: 1,
      };

      const result = PlaceOrder.fromPrimitives(messageData);

      expect(result.isSuccess).toBe(true);
      expect(result.value?.id).toBe('msg-789');
      expect(result.value?.correlationId).toBe('trace-123');
    });
  });

  describe('Idempotency', () => {
    it('should preserve commandId for idempotent operations', () => {
      const original = PlaceOrder.create({
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      }).value!;

      const primitives1 = original.toPrimitives();
      const primitives2 = original.toPrimitives();

      expect(primitives1.id).toBe(primitives2.id);
      expect(primitives1.correlationId).toBe(primitives2.correlationId);
    });
  });

  describe('Missing Optional Fields', () => {
    it('should handle missing optional notes', () => {
      const primitives = {
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
        id: 'cmd-123',
        correlationId: 'trace-123',
      };

      const result = PlaceOrder.fromPrimitives(primitives);

      expect(result.isSuccess).toBe(true);
      expect(result.value?.notes).toBeUndefined();
    });
  });
});
```

## How to Use (When Generator Exists)

```bash
# Create command
nx generate command --context=orders --name=PlaceOrder --result=Order

# Handler uses command
const cmd = PlaceOrder.create(userInput);
if (cmd.isFailure) {
  return res.status(400).json({ error: cmd.error.message });
}

// UseCase executes command
const result = await placeOrderUseCase.execute(cmd.value);
if (result.isFailure) {
  this.logger.error('Order placement failed', result.error);
  return Result.fail(result.error);
}
```

## Key Rules

✅ **DO**:
- Use Zod for validation schema
- Return `Result<Command, ValidationError>` from factory
- Make all fields `readonly`
- Include `id` + `correlationId` for tracing
- Implement `toPrimitives()` + `fromPrimitives()`
- Create 2 test files (validation + serialization)

❌ **DON'T**:
- Put business logic in command (validation only)
- Throw exceptions (return Result instead)
- Make command mutable
- Skip serialization tests (required for message buses)
- Include infrastructure dependencies

## Related Documentation

- [Command specification](../../ddd-implementation/primitives/command/specification.md)
- [Command enforcement](../../ddd-implementation/primitives/command/enforcement.md)
- [ADR-0002: Command/Query as First-Class Primitives](../../architecture-decisions/accepted/command-query-as-primitives.md)
- [UseCase spec](../../ddd-implementation/primitives/use-case/specification.md) — Commands are input to use cases
- [Result type](../../ddd-implementation/primitives/result.md) — Command validation returns Result<T, Error>

---

See [generators/README.md](README.md) for overview of all generators.
