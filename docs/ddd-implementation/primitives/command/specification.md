# Command: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: A serializable, versioned request object that encapsulates an intent to mutate the domain state. Commands are the primary way to trigger use cases, with built-in idempotency support, correlation tracking, and validation. Each command maps to exactly one use case or command handler.

**When to use**:
- Mutating domain state (create, update, delete, execute business operation)
- Triggering use cases from handlers, buses, or sagas
- Building command queues or event sourcing audit trails
- Cross-context communication (via anti-corruption layers)
- Idempotent operations (replaying same command produces same result)
- Async command dispatch (via CommandBus)

**When NOT to use**:
- Querying data (use Query instead)
- Read-only operations (use Query)
- Side effects without domain mutation (use Event for that)
- Simple function calls (only use if crossing boundaries)

**Required base/interface**: Extend `Command<TResult>` abstract class or implement `ICommand<TResult>`

**Allowed dependencies**:
- ValueObjects (for parameters)
- Zod (for validation schema)
- DomainError (for validation failures)
- Other Commands (composition)

**Forbidden dependencies**:
- Repositories (commands don't query)
- Infrastructure implementations (use cases handle that)
- Use cases (handlers call use cases, not commands)
- Entities/Aggregates (commands are DTOs, not domain objects)

## 2. Required Shape & Files

**Path**: `src/core/{context}/application/commands/{CommandName}.ts`

**Must be**: Class extending `Command<TResult>` with static factory

**Required exports**:
```typescript
export class CreateOrderCommand extends Command<Order> {
  constructor(
    readonly customerId: string,
    readonly items: OrderItem[],
    readonly shippingAddress: Address,
    // ICommand required fields:
    readonly id: string, // commandId for idempotency
    readonly correlationId: string, // trace correlation
    readonly version: number = 1,
    readonly occurredAt: Date = new Date()
  ) {
    super();
  }

  static create(dto: {
    customerId: string;
    items: OrderItem[];
    shippingAddress: Address;
  }): Result<CreateOrderCommand, ValidationError> {
    // Validation with Zod
    const validated = CreateOrderCommandSchema.safeParse(dto);
    if (!validated.success) {
      return Result.fail(new ValidationError('INVALID_COMMAND', validated.error.message));
    }
    return Result.ok(
      new CreateOrderCommand(
        dto.customerId,
        dto.items,
        dto.shippingAddress,
        generateId(),
        generateCorrelationId()
      )
    );
  }

  toPrimitives(): {
    commandId: string;
    type: string;
    version: number;
    correlationId: string;
    occurredAt: string;
    customerId: string;
    items: object[];
    shippingAddress: object;
  } {
    return {
      commandId: this.id,
      type: 'CreateOrderCommand',
      version: this.version,
      correlationId: this.correlationId,
      occurredAt: this.occurredAt.toISOString(),
      customerId: this.customerId,
      items: this.items.map(i => i.toPrimitives()),
      shippingAddress: this.shippingAddress.toPrimitives(),
    };
  }

  static fromPrimitives(data: object): Result<CreateOrderCommand, ValidationError> {
    // Reconstruct from serialized form
    try {
      const cmd = new CreateOrderCommand(
        data.customerId,
        data.items,
        data.shippingAddress,
        data.commandId,
        data.correlationId,
        data.version
      );
      return Result.ok(cmd);
    } catch (e) {
      return Result.fail(new ValidationError('DESERIALIZE_FAILED', e.message));
    }
  }
}

// Validation schema (Zod)
export const CreateOrderCommandSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  items: z.array(OrderItemSchema).min(1, 'At least one item required'),
  shippingAddress: AddressSchema,
});
```

**Observability hook**: 
- `commandId` for deduplication and replay detection
- `correlationId` for distributed tracing
- `occurredAt` for event sourcing

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/application/commands/{CommandName}.spec.ts`
  - Validation: `{CommandName}.validation.spec.ts` (valid/invalid inputs)
  - Serialization: `{CommandName}.serialization.spec.ts` (to/from primitives)
- **Integration**: `tests/integration/...` (command handler integration)
- **E2E**: Covered via use case E2E tests that dispatch the command

## 3. Invariants & Guards

**Must**:
- Have `id` (commandId) for idempotency
- Have `correlationId` for tracing
- Have `version` for migration
- Have `occurredAt` timestamp
- Be immutable (readonly fields)
- Be serializable (toPrimitives/fromPrimitives)
- Have Zod validation schema
- Return `Result<Command, ValidationError>` from create factory
- Never throw (use Result)

**Never**:
- Mutate parameters
- Hold mutable state
- Access infrastructure or repositories
- Call use cases directly
- Throw exceptions (use Result)
- Have business logic (commands are DTOs)

**Validation rules**:
- All required fields validated in create() factory
- Return `Result.fail(ValidationError)` for invalid input
- Type coercion handled (string → number, etc.)
- Zod schema is source of truth for validation

**Span/log requirements**: 
- No logging/tracing in command itself
- Handlers/buses log command arrival/completion
- commandId used for deduplication

## 4. Collaboration Rules

**Who can call it**:
- CommandHandlers (dispatch to use case)
- CommandBus (queuing, routing, deduplication)
- Sagas/Process Managers (orchestrating commands)
- API endpoints (convert request to command)
- Event handlers (replay scenarios)

**What it may call**:
- Zod for validation
- ValueObjects (for parameters)
- Static factory methods of other Commands
- Result (error handling)

**Allowed return types**:
- `Result<Command, ValidationError>` from factory
- `Command` once constructed
- `object` from toPrimitives()
- Never: `Promise`, `void`, exceptions

## 5. Testing Requirements (enforced)

**Unit tests** (separate specs for validation and serialization):

**Validation** (`{CommandName}.validation.spec.ts`):
- Happy path (all fields valid, command created)
- Missing required fields (returns Result.fail)
- Invalid field types (returns Result.fail)
- Type coercion (string → number)
- Business rule violations (e.g., negative amount)
- No side effects (input DTO unchanged)

**Serialization** (`{CommandName}.serialization.spec.ts`):
- toPrimitives() produces correct object
- fromPrimitives() reconstructs command
- Round-trip preserves all data
- commandId survives serialization (idempotency)
- correlationId preserved

**Integration tests**: Not applicable (commands are DTOs)

**E2E tests**: Covered via use case E2E tests that dispatch command

**Fixtures/factories location**: `tests/fixtures/commands/{CommandName}Factory.ts`
- Factory methods for valid commands
- Factory methods for edge cases (null, boundary values)
- Invalid command data for negative tests

## 6. Observability & Errors

**Logging/Tracing**: Forbidden in command itself. Handlers log command dispatch.

**Error policy**:
- Use `Result<Command, ValidationError>` for creation failures
- Return `Result.fail(ValidationError)` for invalid input
- Never throw for expected failures
- Only throw for programmer errors (null checks in dev)

**Example error handling**:
```typescript
static create(dto: CreateOrderDTO): Result<CreateOrderCommand, ValidationError> {
  // Validate schema
  const validated = CreateOrderCommandSchema.safeParse(dto);
  if (!validated.success) {
    return Result.fail(
      new ValidationError('INVALID_CREATE_ORDER_COMMAND', validated.error.message)
    );
  }

  // Additional domain validation
  if (dto.items.length === 0) {
    return Result.fail(
      new ValidationError('EMPTY_ORDER', 'Order must have at least one item')
    );
  }

  return Result.ok(
    new CreateOrderCommand(
      dto.customerId,
      dto.items,
      dto.shippingAddress,
      generateId(),
      generateCorrelationId()
    )
  );
}
```

## 7. Lifecycle & Evolution

**Creation**: Static factory with validation, generates commandId and correlationId

**Idempotency**: Same commandId = same command, same result
- Handlers use commandId to detect replays
- Command replayed produces same aggregate state

**Versioning**: Commands evolve with version field
```typescript
// Version 1 (original)
new CreateOrderCommand(customerId, items, shippingAddress, id, correlationId)

// Version 2 (added discount)
new CreateOrderCommand(
  customerId, 
  items, 
  shippingAddress, 
  id, 
  correlationId, 
  2,  // ← version
  occurredAt,
  discountCode  // ← new field
)

// Handler checks version and applies migration
if (command.version === 1) {
  command = migrateV1ToV2(command);
}
```

**Deprecation path**:
- Mark with `@deprecated` comment
- Create new command version
- Keep old handler for 2 sprints
- Provide migration guide in command docs

## 8. Anti-Patterns (repo-specific)

- **Business logic in command**: Commands are DTOs, not domain objects
- **Calling repositories**: Commands don't query
- **Async in constructor**: Commands are synchronous
- **Shared mutable state**: Each command instance independent
- **Missing commandId**: Breaks idempotency
- **Throwing exceptions**: Use Result
- **Incomplete validation**: All fields validated in create()
- **No version support**: Commands must support evolution

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/orders/application/commands/CreateOrderCommand.ts
import { Command } from '@shared/kernel/command';
import { Result } from '@shared/kernel/result';
import { ValidationError } from '@shared/kernel/errors';
import { z } from 'zod';

export class CreateOrderCommand extends Command<string> {
  constructor(
    readonly customerId: string,
    readonly totalAmount: number,
    readonly id: string,
    readonly correlationId: string,
    readonly version: number = 1,
    readonly occurredAt: Date = new Date()
  ) {
    super();
  }

  static create(dto: {
    customerId: string;
    totalAmount: number;
  }): Result<CreateOrderCommand, ValidationError> {
    const schema = z.object({
      customerId: z.string().uuid(),
      totalAmount: z.number().positive('Amount must be positive'),
    });

    const validated = schema.safeParse(dto);
    if (!validated.success) {
      return Result.fail(new ValidationError('INVALID_COMMAND', validated.error.message));
    }

    return Result.ok(
      new CreateOrderCommand(
        dto.customerId,
        dto.totalAmount,
        generateId(),
        generateCorrelationId()
      )
    );
  }

  toPrimitives() {
    return {
      commandId: this.id,
      type: 'CreateOrderCommand',
      version: this.version,
      correlationId: this.correlationId,
      customerId: this.customerId,
      totalAmount: this.totalAmount,
    };
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate command --context=orders --name=CreateOrder --result=Order
```

**Generated files**:
- `src/core/orders/application/commands/CreateOrderCommand.ts` (command class with validation schema)
- `tests/unit/core/orders/application/commands/CreateOrderCommand.validation.spec.ts` (validation tests)
- `tests/unit/core/orders/application/commands/CreateOrderCommand.serialization.spec.ts` (serialization tests)
- `tests/fixtures/commands/CreateOrderCommandFactory.ts` (test data)

**Generated imports**:
```typescript
import { Command } from '@shared/kernel/command';
import { Result } from '@shared/kernel/result';
import { ValidationError } from '@shared/kernel/errors';
import { z } from 'zod';
```

**Required follow-up edits**:
1. Define Zod validation schema for command parameters
2. Implement create() factory with full validation
3. Implement toPrimitives() for serialization
4. Implement fromPrimitives() for deserialization
5. Add version field if planning evolution
6. Write validation unit tests (happy path, error cases)
7. Write serialization round-trip tests
8. Create command factory with test data
9. Create CommandHandler to dispatch the command
10. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### CreateOrderCommand (Command)
- **File**: src/core/orders/application/commands/CreateOrderCommand.ts
- **Type**: Command (DDD Primitive)
- **Role**: Encapsulate create order intent with validation
- **TResult**: Order
- **Idempotency**: commandId {command.id}
- **Status**: ⏳ (scaffolded, needs validation + handler)
- **Tests**: Validation and serialization unit tests required
```