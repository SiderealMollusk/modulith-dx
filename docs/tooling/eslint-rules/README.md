# ESLint Rules

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

## Purpose

ESLint rules enforce architectural constraints at **lint time** — catch violations during development, not in code review.

## Rule Categories

### Domain Layer Rules

Enforce that domain stays **pure business logic**:

| Rule | Prevents | When |
|------|----------|------|
| `no-logging-in-domain` | Logger, console.* in domain | Linting |
| `no-infra-in-domain` | Infrastructure imports in domain | Linting |
| `require-entity-base` | Entity not extending BaseEntity | Linting |
| `require-value-object-base` | ValueObject not extending ValueObject | Linting |
| `require-readonly-fields` | Mutable fields in domain/application | Linting |

### Application Layer Rules

Enforce **CQRS + Result pattern**:

| Rule | Prevents | When |
|------|----------|------|
| `require-command-base` | Command not extending Command<T> | Linting |
| `require-query-base` | Query not extending Query<T> | Linting |
| `require-command-id` | Command missing `id` field | Linting |
| `require-query-id` | Query missing `id` field | Linting |
| `require-command-validation` | Command missing Zod schema | Linting |
| `require-command-serialization` | Command missing toPrimitives/fromPrimitives | Linting |
| `no-throw-in-application` | Uncaught throw in application layer | Linting |
| `use-result-for-validation` | Factory not returning Result<T, Error> | Linting |

### Infrastructure Rules

Ensure adapters stay **decoupled** from domain:

| Rule | Prevents | When |
|------|----------|------|
| `no-domain-in-adapters` | Adapter logic bleeding into domain | Linting |
| `require-adapter-base` | Repository adapter not extending BaseRepositoryAdapter | Linting |

### General Rules

Maintain **code organization**:

| Rule | Prevents | When |
|------|----------|------|
| `one-entity-per-file` | Multiple primitives in single file | Linting |
| `naming-convention` | Class name ≠ file name | Linting |
| `colocated-validation-schema` | Zod schema in different file | Linting |

## Rule Details

### `no-logging-in-domain`

**Problem**: Domain logic couples to Logger implementation.

**Violation**:
```typescript
// ❌ BAD: src/core/orders/domain/entities/Order.ts
import { Logger } from '@shared/kernel';

class Order extends BaseEntity<OrderId> {
  constructor(id, items, private logger: Logger) {
    this.logger.info('Order created'); // ❌ Logging in domain!
  }
}
```

**Fix**: Move logging to application boundary.

```typescript
// ✅ OK: src/core/orders/application/use-cases/PlaceOrderUseCase.ts
class PlaceOrderUseCase extends BaseUseCase {
  async execute(input): Promise<Result<OrderDto, Error>> {
    const orderResult = Order.create(input);
    if (orderResult.isFailure) {
      this.logger.warn('Order creation failed', orderResult.error); // ✅ OK
      return Result.fail(orderResult.error);
    }
    // ...
  }
}
```

**Config**:
```typescript
// tools/eslint-plugin/rules/no-logging-in-domain.ts
export default {
  meta: { docs: { description: 'No logging in domain layer' } },
  create(context) {
    return {
      CallExpression(node) {
        if (!context.filename.includes('/domain/')) return;
        
        if (node.callee.type === 'MemberExpression') {
          const obj = node.callee.object.name;
          if (obj === 'logger' || obj === 'console') {
            context.report({
              node,
              message: 'Logging not allowed in domain. Move to application/handler.',
            });
          }
        }
      }
    };
  }
};
```

---

### `require-command-base`

**Problem**: Command classes don't extend the proper base, missing ID/serialization.

**Violation**:
```typescript
// ❌ BAD
class CreateUser {
  constructor(email, name) {
    this.email = email;
    this.name = name;
  }
}
```

**Fix**:
```typescript
// ✅ OK
class CreateUser extends Command<UserDto> {
  private constructor(
    readonly email: string,
    readonly name: string,
    readonly id: string,
    readonly correlationId: string,
  ) {
    super();
  }
  
  static create(input): Result<CreateUser, ValidationError> { }
  toPrimitives() { }
  static fromPrimitives(data): Result<CreateUser, ValidationError> { }
}
```

**Config**:
```typescript
// tools/eslint-plugin/rules/require-command-base.ts
export default {
  meta: { docs: { description: 'Commands must extend Command<TResult>' } },
  create(context) {
    return {
      ClassDeclaration(node) {
        if (!context.filename.includes('/application/commands/')) return;
        if (!isCommandClass(node.id.name)) return; // Skip non-command classes
        
        if (!node.superClass || node.superClass.name !== 'Command') {
          context.report({
            node,
            message: `${node.id.name} must extend Command<TResult>. See docs/ddd-implementation/primitives/command/specification.md`,
          });
        }
      }
    };
  }
};
```

---

### `require-readonly-fields`

**Problem**: Domain/application classes should be immutable.

**Violation**:
```typescript
// ❌ BAD: Mutable field in entity
class User extends BaseEntity<UserId> {
  email: string; // ❌ Not readonly
  
  changeEmail(newEmail: string) {
    this.email = newEmail;
  }
}
```

**Fix**:
```typescript
// ✅ OK: Readonly field, factory for changes
class User extends BaseEntity<UserId> {
  readonly email: string;
  
  private constructor(id, email) {
    super(id);
    this.email = email;
  }
  
  static create(email): Result<User, Error> { }
  
  // If email can change, return new instance
  changeEmail(newEmail: string): Result<User, Error> {
    const emailResult = Email.create(newEmail);
    if (emailResult.isFailure) return Result.fail(emailResult.error);
    return Result.ok(new User(this.id, emailResult.value));
  }
}
```

---

### `use-result-for-validation`

**Problem**: Factories throw exceptions instead of returning Result<T, Error>.

**Violation**:
```typescript
// ❌ BAD: Throws instead of Result
class User extends BaseEntity<UserId> {
  static create(email: string) {
    if (!email.includes('@')) {
      throw new Error('Invalid email'); // ❌ Throws
    }
    return new User(new UserId(generateId()), email);
  }
}
```

**Fix**:
```typescript
// ✅ OK: Returns Result
class User extends BaseEntity<UserId> {
  static create(email: string): Result<User, DomainError> {
    const emailResult = Email.create(email);
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error); // ✅ Returns Result
    }
    return Result.ok(new User(new UserId(generateId()), emailResult.value));
  }
}
```

---

## Enforcement Matrix

| Primitive | Rules | Automation | Manual Review |
|-----------|-------|-----------|---------------|
| Entity | `require-entity-base`, `require-readonly-fields` | ESLint | Entity invariants |
| ValueObject | `require-value-object-base`, `require-readonly-fields` | ESLint | Equality logic |
| Command | `require-command-base`, `require-command-id`, `require-command-validation`, `colocated-validation-schema` | ESLint + Generator | Validation completeness |
| Query | `require-query-base`, `require-query-id` | ESLint + Generator | Cache key strategy |
| UseCase | `use-result-for-validation`, `require-readonly-fields` | ESLint | Dependency injection |
| Handler | `no-throw-in-application` | ESLint | Error handling |
| Domain | `no-logging-in-domain`, `no-infra-in-domain` | ESLint | Observability strategy |

## Configuration

### `.eslintrc.json`

```json
{
  "plugins": ["@local/eslint-plugin"],
  "rules": {
    "@local/no-logging-in-domain": "error",
    "@local/no-infra-in-domain": "error",
    "@local/require-entity-base": "error",
    "@local/require-command-base": "error",
    "@local/require-command-id": "error",
    "@local/require-command-validation": "error",
    "@local/require-command-serialization": "error",
    "@local/require-readonly-fields": "warn",
    "@local/use-result-for-validation": "error",
    "@local/one-entity-per-file": "warn",
    "@local/naming-convention": "warn",
    "@local/colocated-validation-schema": "warn"
  }
}
```

## CI/CD Integration

```yaml
# .github/workflows/lint.yml
- name: ESLint
  run: npm run lint
  # Fails if any "error" rules violated
```

## Development Experience

**In VS Code**:
```typescript
class CreateUser {  // ❌ Red squiggle
  // 'CreateUser' must extend Command<TResult>
}
```

**Terminal**:
```bash
npm run lint
```

Output:
```
src/core/identity/application/commands/CreateUser.ts
  2:1  error  CreateUser must extend Command<TResult>  @local/require-command-base

1 error
```

**Auto-fix** (where possible):
```bash
npm run lint -- --fix
```

---

See [enforcement-patterns.md](enforcement-patterns.md) for common violations and fixes.
