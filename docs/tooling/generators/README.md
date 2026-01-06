# Generators

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

## Purpose

Generators scaffold DDD primitives with correct structure, base classes, validation, and tests. This eliminates boilerplate and enforces architectural patterns.

**Built as**: Nx plugin (`@local/ddd`) with multiple generators

## Quick Reference

| Primitive | Generator | Creates | Test Files |
|-----------|-----------|---------|------------|
| **Entity** | `nx generate @local/ddd:entity` | Class + Brand ID | `spec.ts` (unit) |
| **ValueObject** | `nx generate @local/ddd:value-object` | Class + validation | `spec.ts` (unit) |
| **Command** | `nx generate @local/ddd:command` | Class + Zod schema | `validation.spec.ts`, `serialization.spec.ts` |
| **Query** | `nx generate @local/ddd:query` | Class + Zod schema | `validation.spec.ts`, `serialization.spec.ts` |
| **UseCase** | `nx generate @local/ddd:use-case` | Class extending BaseUseCase | `spec.ts`, `integration.spec.ts` |
| **Handler** | `nx generate @local/ddd:handler` | HTTP/gRPC/CLI variant | `spec.ts`, `integration.spec.ts` |
| **Repository** | `nx generate @local/ddd:repository` | Port + Adapter | `integration.spec.ts` |
| **DomainEvent** | `nx generate @local/ddd:domain-event` | Event class | `spec.ts` |
| **Factory** | `nx generate @local/ddd:factory` | Factory with validation | `spec.ts` |
| **DomainService** | `nx generate @local/ddd:domain-service` | Stateless service | `spec.ts` |
| **Specification** | `nx generate @local/ddd:specification` | Policy/rule | `spec.ts` |

## Usage Pattern

All generators follow this pattern:

```bash
nx generate @local/ddd:{primitive} \
  --context=myContext \
  --name=MyName \
  [additional options]
```

## Generator Descriptions

See individual docs for each:
- [Entity](entity.md)
- [ValueObject](value-object.md)
- [Command](command.md) — **Most important**
- [Query](query.md)
- [UseCase](use-case.md)
- [Handler](handler.md)
- [Repository](repository.md)
- [DomainEvent](domain-event.md)
- [Factory](factory.md)
- [DomainService](domain-service.md)
- [Specification](specification.md)

## Implementation Phases

**Phase 3A** (Week 1):
- Nx workspace configuration
- `@local/ddd` plugin scaffolding
- Command generator (most critical, used by all use cases)
- Query generator
- Both with validation + serialization tests

**Phase 3B** (Week 2):
- Entity generator
- ValueObject generator
- UseCase generator

**Phase 3C** (Week 2-3):
- Handler generator
- Repository generator (port + adapter)

**Phase 3D** (Week 3+):
- DomainEvent, Factory, DomainService, Specification generators

### Nx Plugin Structure

```
tools/ddd/
├── package.json                    # @local/ddd plugin
├── generators/
│   ├── command/
│   │   ├── schema.json             # Nx schema (context, name, result type)
│   │   ├── schema.d.ts
│   │   ├── index.ts                # Generator implementation
│   │   └── templates/              # Command template files
│   │       ├── __name__.ts.template
│   │       ├── __name__.validation.spec.ts.template
│   │       └── __name__.serialization.spec.ts.template
│   ├── query/
│   │   └── ... (same structure)
│   ├── entity/
│   ├── value-object/
│   ├── use-case/
│   ├── handler/
│   └── repository/
└── src/
    └── lib/
        ├── shared-templates.ts     # Reusable template logic
        └── naming-utils.ts         # slugToTitle, getNextNumber, etc.
```

## Key Features

All generators produce:

### 1. **Correct Base Class**
```typescript
// Entity generator
export class User extends BaseEntity<UserId> { }

// Command generator
export class CreateUser extends Command<UserDto> { }

// UseCase generator
export class CreateUserUseCase extends BaseUseCase<CreateUserInput, UserDto> { }
```

### 2. **Immutability**
```typescript
// All fields readonly
export class User extends BaseEntity<UserId> {
  constructor(
    readonly id: UserId,
    readonly email: string,
    readonly name: string,
  ) {
    super(id);
  }
}
```

### 3. **Result Type (No Throw)**
```typescript
// Factory/UseCase returns Result<T, Error>
static create(email: string): Result<User, DomainError> {
  const emailResult = Email.create(email);
  if (emailResult.isFailure) return Result.fail(emailResult.error);
  return Result.ok(new User(...));
}
```

### 4. **Zod Validation (Command/Query)**
```typescript
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

static create(dto: CreateUserInput): Result<CreateUser, ValidationError> {
  const validated = CreateUserSchema.safeParse(dto);
  if (!validated.success) return Result.fail(new ValidationError(...));
  return Result.ok(new CreateUser(...));
}
```

### 5. **Serialization (Command/Query)**
```typescript
toPrimitives() {
  return { email: this.email, name: this.name, id: this.id, ... };
}

static fromPrimitives(primitives: any): Result<CreateUser, ValidationError> {
  const validated = CreateUserSchema.safeParse(primitives);
  if (!validated.success) return Result.fail(new ValidationError(...));
  return Result.ok(new CreateUser(...));
}
```

### 6. **Auto-Export**
Generated class added to `index.ts`:
```typescript
// src/core/identity/application/commands/index.ts
export { CreateUser } from './CreateUser';
export { CreateUserSchema } from './CreateUser';
```

### 7. **Test Stubs**
- Unit tests with placeholders for happy path, edge cases
- Integration test stubs (for repositories, external services)
- E2E test stubs (for handlers, full workflows)

### 8. **TypeScript Strict Mode**
All generated code passes `--strict` mode.

## File Structure Generated

### Entity Example
```
src/core/identity/
├── domain/
│   ├── entities/
│   │   └── User.ts (generated)
│   │       - Class User extends BaseEntity<UserId>
│   │       - Constructor + static create factory
│   │       - Invariant enforcement
│   └── value-objects/
│       ├── UserId.ts (hand-written Brand type)
│       └── Email.ts (hand-written ValueObject)
└── tests/
    └── unit/
        └── domain/
            └── entities/
                └── User.spec.ts (generated stub)
                    - Happy path test
                    - Edge case placeholders
                    - Invariant violation tests
```

### Command Example
```
src/core/identity/
├── application/
│   ├── commands/
│   │   ├── CreateUser.ts (generated)
│   │   │   - Class CreateUser extends Command<UserDto>
│   │   │   - CreateUserSchema (Zod)
│   │   │   - Static create factory
│   │   │   - toPrimitives/fromPrimitives
│   │   ├── CreateUser.validation.spec.ts (generated)
│   │   │   - Schema validation tests
│   │   │   - Happy path
│   │   │   - Invalid input cases
│   │   └── CreateUser.serialization.spec.ts (generated)
│   │       - Round-trip tests
│   │       - Primitives → Command → primitives
│   └── index.ts (auto-updated)
└── tests/
    ├── unit/
    │   └── application/
    │       └── commands/
    │           └── CreateUser.spec.ts (validation/serialization auto-imported)
    └── integration/
        └── use-cases/
            └── CreateUserUseCase.spec.ts (stub)
```

### UseCase Example
```
src/core/identity/
├── application/
│   ├── use-cases/
│   │   └── CreateUserUseCase.ts (generated)
│   │       - Class extends BaseUseCase<CreateUserInput, UserDto>
│   │       - Constructor with dependencies (injected)
│   │       - execute method stub
│   └── index.ts (auto-updated)
└── tests/
    ├── unit/
    │   └── use-cases/
    │       └── CreateUserUseCase.spec.ts (generated)
    │           - Mock repositories
    │           - Happy path placeholder
    │           - Error handling placeholders
    └── integration/
        └── use-cases/
            └── CreateUserUseCase.spec.ts (generated)
                - In-memory repositories
                - Full workflow stubs
```

## Customization Options

Each generator accepts options (defined in `schema.json`):

```bash
# Entity with custom ID type
nx generate @local/ddd:entity --context=orders --name=Order --idType=OrderId

# Command with custom result type
nx generate @local/ddd:command --context=orders --name=PlaceOrder --result=Order

# Handler with specific protocol
nx generate @local/ddd:handler --context=orders --name=PlaceOrder --protocol=http
nx generate @local/ddd:handler --context=orders --name=PlaceOrder --protocol=grpc
nx generate @local/ddd:handler --context=orders --name=PlaceOrder --protocol=cli

# UseCase with dependencies
nx generate @local/ddd:use-case --context=orders --name=PlaceOrder \
  --deps="OrderRepository,PricingService,EventBus"
```

## Prompts vs Flags

Generators support both interactive and CLI-only modes (standard Nx behavior):

```bash
# Quiet mode (all flags provided)
nx generate @local/ddd:command --context=orders --name=PlaceOrder --result=Order

# Interactive mode (missing flags prompt)
nx generate @local/ddd:command --context=orders
# Nx prompts: "Name?" "Result type?"
```

## Integration with Code Review

Generated code is simple and passes review easily:

- ✅ Correct base classes (enforced by generator)
- ✅ Immutability (readonly fields)
- ✅ Result<T, Error> pattern
- ✅ Zod validation
- ✅ Test stubs (human fills in logic)
- ✅ Passes `--strict` TypeScript

Reviewer checklist:
- [ ] Correct context folder
- [ ] Correct name and type
- [ ] Base class extends correct parent
- [ ] All fields readonly (domain/application layer)
- [ ] Factory returns Result<T, Error>
- [ ] Tests have stubs for edge cases

## Dry Run

See what would be generated without creating files (standard Nx feature):

```bash
nx generate @local/ddd:command --context=orders --name=PlaceOrder --dry-run
```

Output:
```
NX Dry-run: @local/ddd:command

Would create:
  CREATE src/core/orders/application/commands/PlaceOrder.ts
  CREATE src/core/orders/application/commands/PlaceOrder.validation.spec.ts
  CREATE src/core/orders/application/commands/PlaceOrder.serialization.spec.ts
  UPDATE src/core/orders/application/commands/index.ts

File contents preview:
  [shows class skeleton]
```

---

Next: See [Implementation Plan](../../plans/current.md#phase-3-nx-generators-code-scaffolding) for Phase 3 scope and timeline.
