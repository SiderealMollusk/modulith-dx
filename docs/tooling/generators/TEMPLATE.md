# Generator Specification Guide

This guide defines what each generator creates and how to structure the **instance-level** specification and enforcement documentation for generated primitives.

## Generator Outputs

When you run a generator, it creates **5 files**:

```bash
nx generate @local/ddd:command --context=orders --name=PlaceOrder --result=Order
```

Produces:

```
src/core/orders/application/commands/
├── PlaceOrder.ts                          # Implementation
├── PlaceOrder.specification.md            # Instance-level contract
├── PlaceOrder.enforcement.md              # Instance-level index of correctness automation rules, patterned off of parent primitive type
├── PlaceOrder.validation.spec.ts          # Validation tests
├── PlaceOrder.serialization.spec.ts       # Round-trip tests
└── index.ts (updated)
```

### What Each File Means

| File | Purpose | Audience |
|------|---------|----------|
| **PlaceOrder.ts** | The code | Developers implementing features |
| **PlaceOrder.specification.md** | What this command IS | Anyone using this command |
| **PlaceOrder.enforcement.md** | How to use/modify this command | Developers extending/changing it |
| **\*.spec.ts** | Tests | Test suite |

---

## Instance-Level Specification Template

`{Name}.specification.md` defines **what THIS specific primitive is and does**.

### Structure

```markdown
# {Name} Specification

## What It Is

One-sentence description of this primitive's purpose.

Example:
"PlaceOrder command represents a customer's request to create a new order with items."

## Contract

### Input (what creates it)
```typescript
interface PlaceOrderInput {
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
  notes?: string;
}
```

### Output (what it produces)
```typescript
type PlaceOrderResult = Order; // DTO returned by use case
```

### Error Cases
- `ValidationError`: Invalid customerId, empty items, negative quantity
- `DomainError`: Customer not found, customer suspended

## Invariants

List the **business rules enforced by or relevant to THIS command**:
- Must have at least one item
- Quantities must be positive integers
- CustomerId must be non-empty

## Side Effects

What happens when this command executes (via use case):
- **Event**: OrderPlacedEvent published to event bus
- **State**: New Order created in database
- **Integration**: Billing system receives event

## Integration Points

Who/what calls this:
- **Callers**: PlaceOrderHttpHandler, PlaceOrderCliHandler
- **Receives**: PlaceOrderUseCase
- **Dependencies**: OrderRepository (via use case, not command)

## Lifecycle

- **Created**: Via PlaceOrder.create(input)
- **Serialized**: toPrimitives() for message bus
- **Deserialized**: fromPrimitives() for replay/recovery
- **Idempotency**: commandId ensures no duplicate processing

## Related Documentation

- [Command type specification](../../ddd-implementation/primitives/command/specification.md)
- [OrderPlacedEvent specification](./OrderPlacedEvent.specification.md)
- [PlaceOrderUseCase specification](./PlaceOrderUseCase.specification.md)
```

### Key Questions It Answers
- What is this command semantically?
- What inputs does it accept?
- What errors can occur?
- Who calls it?
- What domain events does it trigger?
- How long does it live?

---

## Instance-Level Enforcement Template

`{Name}.enforcement.md` defines **how to correctly use and modify THIS specific primitive**.

### Structure

```markdown
# {Name} Enforcement

## What's Special About This {Primitive}

Describe what makes this implementation unique or important:
- Critical for domain invariants
- Has unusual validation logic
- Integrates with external systems
- Has performance constraints

Example:
"PlaceOrder is critical to revenue generation. Changes must preserve 
customerId field for billing integration and support command replay for idempotency."

## If You Modify This {Primitive}

Describe what breaks if modified incorrectly:

### Add a field?
- Must update: Zod schema, validation tests, serialization tests
- May break: Handlers expecting specific fields, billing integration

### Change result type?
- May break: UseCase signature, handlers expecting Order DTO

### Remove customerId?
- BREAKS: Billing system (reads customerId from serialized command)
- BREAKS: Command replay (historical customerId needed for disputes)

## Testing This Implementation

Specific testing requirements:

### Must always test:
- Serialization preserves customerId (billing depends on it)
- Valid commands with customer-in-good-standing
- Invalid commands with customer-suspended

### When modifying:
- Run integration tests with real EventBus
- Verify command replay via fromPrimitives()
- Check handler tests still pass

## Integration Constraints

What this command depends on and what depends on it:

### Upstream (callers):
- PlaceOrderHttpHandler: Must validate before creating command
- PlaceOrderCliHandler: Must validate before creating command

### Downstream (consumers):
- PlaceOrderUseCase: Expects customerId, items, notes
- EventBus: Must handle OrderPlacedEvent
- Billing system: Listens to OrderPlaced event, reads customerId

## Anti-Patterns

Don't do these:

- ❌ Add business logic to PlaceOrder.create() (belongs in UseCase)
- ❌ Call repositories from command (validation only, no persistence)
- ❌ Skip version field (needed for schema evolution)
- ❌ Remove customerId (breaks billing integration)
- ❌ Throw exceptions (use Result type)

## Observability & Tracing

- Each instance has: commandId (for idempotency), correlationId (for tracing)
- Handler must pass correlationId to event bus
- Logging happens in use case, not command

## Review Checklist

When someone modifies this command:
- [ ] Zod schema updated if input fields change
- [ ] Validation tests updated
- [ ] Serialization round-trip tests pass
- [ ] Integration tests verify event publishing
- [ ] Billing system still receives customerId in event
- [ ] No new repository dependencies added
```

### Key Questions It Answers
- What makes this implementation special?
- What breaks if modified?
- Who depends on this?
- How to test modifications?
- What anti-patterns to avoid?
- How is it traced/logged?

---

## Code Pattern Reference

All primitives follow these conventions:

## Code Pattern Reference

All primitives follow these conventions:

### 1. Base Class
```typescript
// Entity/Aggregate
export class User extends BaseEntity<UserId> { }

// Command/Query
export class CreateUser extends Command<UserDto> { }
export class GetUser extends Query<UserDto> { }

// UseCase
export class CreateUserUseCase extends BaseUseCase<CreateUserInput, UserDto> { }

// Handler
export class CreateUserHttpHandler extends BaseHttpHandler { }

// Repository Adapter
export class InMemoryUserRepository extends BaseRepositoryAdapter<UserRepository> implements UserRepository { }
```

#### 2. **Private Constructor + Static Factory**
```typescript
export class MyPrimitive {
  private constructor(
    readonly field1: string,
    readonly field2: number,
  ) { }

  static create(input: Input): Result<MyPrimitive, Error> {
    // Validate
    return Result.ok(new MyPrimitive(...));
  }
}
```

#### 3. **Immutability**
```typescript
// All fields readonly
export class MyEntity extends BaseEntity<MyId> {
  constructor(
    readonly id: MyId,
    readonly field1: string, // ✅ readonly
    readonly field2: number, // ✅ readonly
  ) {
    super(id);
  }
}
```

#### 4. **Result Pattern (No Throw)**
```typescript
// Always return Result<T, Error> instead of throwing
static create(input: Input): Result<MyClass, DomainError> {
  const validation = validate(input);
  if (validation.isFailure) {
    return Result.fail(validation.error);
  }
  return Result.ok(new MyClass(...));
}
```

#### 5. **Zod Validation (Commands/Queries)**
```typescript
export const MyCommandSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
});

export type MyCommandInput = z.infer<typeof MyCommandSchema>;

static create(input: MyCommandInput): Result<MyCommand, ValidationError> {
  const validated = MyCommandSchema.safeParse(input);
  if (!validated.success) {
    return Result.fail(new ValidationError(validated.error.message));
  }
  return Result.ok(new MyCommand(...validated.data));
}
```

#### 6. **Serialization (Commands/Queries)**
```typescript
toPrimitives() {
  return {
    field1: this.field1,
    field2: this.field2,
    id: this.id,
    correlationId: this.correlationId,
  };
}

static fromPrimitives(primitives: unknown): Result<MyCommand, ValidationError> {
  const validated = MyCommandSchema.safeParse(primitives);
  if (!validated.success) {
    return Result.fail(new ValidationError(validated.error.message));
  }
  const data = primitives as any;
  return Result.ok(new MyCommand(
    validated.data.field1,
    validated.data.field2,
    data.id,
    data.correlationId,
  ));
}
```

#### 7. **Auto-Export**
Generated class is automatically added to index.ts:
```typescript
// src/core/{context}/{layer}/{subfolder}/index.ts
export { MyClass } from './MyClass';
export { MySchema } from './MyClass'; // If applicable
```

#### 8. **TypeScript Strict Mode**
All generated code passes `--strict` mode and works with `readonly` fields.

---

## Generator Implementation Templates

Each generator needs these template files:

### Code Templates
```
tools/ddd/generators/{primitive}/templates/
├── __name__.ts.template              # Main implementation
├── __name__.validation.spec.ts.template (if applicable)
├── __name__.serialization.spec.ts.template (if applicable)
```

### Documentation Templates
```
tools/ddd/generators/{primitive}/templates/
├── __name__.specification.md.template   # NEW
└── __name__.enforcement.md.template     # NEW
```

### What Templates Should Do

**specification.md.template**:
- Scaffold with placeholders for business meaning
- Auto-fill: input/output types from Zod schema
- Auto-fill: integration points (handlers, use cases)
- Leave blank: invariants, side effects (domain-specific)

Example:
```markdown
# {{name}} Specification

## What It Is
[FILL IN: What does this {{primitive}} do?]

## Contract

### Input
```typescript
// Auto-generated from Zod schema
{{zodSchema}}
```

### Output
[FILL IN: What type/DTO is returned?]

## Invariants
[FILL IN: Domain rules for {{name}}]

## Side Effects
[FILL IN: Events/state changes]
```

**enforcement.md.template**:
- Scaffold with common sections
- Auto-fill: file paths, class names
- Leave blank: specific constraints (implementation-specific)

Example:
```markdown
# {{name}} Enforcement

## What's Special

[FILL IN: Why is this {{primitive}} important/unusual?]

## If You Modify

[FILL IN: What breaks if fields change?]

## Testing

[FILL IN: Specific test scenarios for {{name}}]

## Integration Constraints

- Callers: {{getCallers}}
- Dependencies: {{getDependencies}}
- Side effects: {{getSideEffects}}
```

---

## Generator Configuration

Nx plugin structure for each generator:

```
tools/ddd/generators/{primitive}/
├── schema.json
├── schema.d.ts
├── index.ts (generator implementation)
└── templates/
    ├── __name__.ts.template
    ├── __name__.specification.md.template        # NEW
    ├── __name__.enforcement.md.template          # NEW
    ├── __name__.validation.spec.ts.template      (if applicable)
    └── __name__.serialization.spec.ts.template   (if applicable)
```

Generator must:
1. Create all 5 files (code + docs + tests)
2. Update parent `index.ts` to export new class
3. Generate placeholder spec/enforcement docs
4. Include helpful comments in templates for developers to fill in

---

## Generator-Specific Variations

Each primitive type has unique patterns:

| Primitive | Unique Feature | Base Class | Output |
|-----------|---|---|---|
| **Entity** | Aggregate root + brand ID | `BaseEntity<TId>` | `Result<Entity, DomainError>` |
| **ValueObject** | Structural equality | `ValueObject<T>` | `Result<ValueObject, DomainError>` |
| **Command** | Idempotency key + serialization | `Command<TResult>` | `Result<Command, ValidationError>` |
| **Query** | Cache key support | `Query<TResult>` | `Result<Query, ValidationError>` |
| **UseCase** | Orchestration + event publishing | `BaseUseCase<TInput, TOutput>` | `Result<TOutput, ApplicationError>` |
| **Handler** | Protocol variants (HTTP/gRPC/CLI) | `BaseHttpHandler` | `Promise<void>` or `Promise<Response>` |
| **Repository** | Port + Adapter pattern | `BaseRepositoryAdapter` | `Promise<Result<T, RepositoryError>>` |

See individual generator docs for primitive-specific details.
