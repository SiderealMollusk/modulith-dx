# Entity: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: An object with a stable identity that persists across state changes. Two entities with the same ID are the same entity, regardless of attribute differences.

**When to use**:
- Object has lifecycle (created, modified, deleted)
- Identity matters more than attributes
- Needs to be tracked across time

**When NOT to use**:
- Immutable data (use ValueObject)
- No identity required (use ValueObject or simple objects)
- Just data transfer (use DTO)

**Required base/interface**: `BaseEntity<TId extends Brand<string, any>>`

**Allowed dependencies**:
- ValueObjects (for attributes)
- DomainEvents (emit on state changes)
- Specifications/Policies (for validation)
- Result (for error handling)

**Forbidden dependencies**:
- Infrastructure (repositories, HTTP, database)
- Application layer (use cases, handlers)
- Logger, Tracer, or any observability (domain stays pure)

## 2. Required Shape & Files

**Path**: `src/core/{context}/domain/entities/{Name}.ts`

**Must extend**: `BaseEntity<TId>` where `TId` is a branded ID type

**Required exports**:
```typescript
export class User extends BaseEntity<UserId> {
  // Static factory method (preferred over constructor)
  static create(props: CreateUserProps): Result<User, DomainError>;
  
  // Identity accessor
  get id(): UserId;
  
  // Domain behavior methods (not just getters/setters)
  changeEmail(newEmail: Email): Result<void, DomainError>;
}
```

**Observability hook**: None. Entities are pure domain - no logging, tracing, or metrics.

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/domain/entities/{Name}.spec.ts`
  - Core logic: `{Name}.core.spec.ts` (invariants, validation, state transitions)
- **Integration**: Not applicable (entities don't touch infrastructure)
- **E2E**: Indirectly tested via use case E2E tests

## 3. Invariants & Guards

**Must**:
- Have stable identity (ID never changes after creation)
- Use branded ID type (UserId, OrderId, etc.)
- Validate state in factory method or behavior methods
- Return `Result<T, DomainError>` for operations that can fail
- Emit DomainEvents for significant state changes
- Be immutable where possible (return new instance on change, or use private setters)

**Never**:
- Change ID after creation
- Allow invalid state (guard all mutations)
- Throw exceptions for domain failures (use Result)
- Access infrastructure (DB, HTTP, file system)
- Log or trace (domain is pure)
- Use primitive IDs (use branded types)

**Validation rules**:
- All validation in static `create()` or behavior methods
- Return `Result.fail(new DomainError(...))` for validation failures
- Use ValueObjects for complex validation (Email, PhoneNumber, etc.)

**Span/log requirements**: None (forbidden in domain layer)

## 4. Collaboration Rules

**Who can call it**:
- AggregateRoots (to compose entities)
- Domain Services (orchestrate cross-entity logic)
- Factories (for complex creation)
- Use Cases (application layer orchestration)

**What it may call**:
- ValueObjects (for attributes)
- Specifications/Policies (for validation)
- Other Entities (composition)
- DomainEvents (emit state changes)
- Result (error handling)

**Allowed return types**:
- `Result<T, DomainError>` for operations
- Primitive types or ValueObjects for getters
- `void` for operations with no return
- Never: naked `Promise` (no async in domain)

## 5. Testing Requirements (enforced)

**Unit tests** (`{Name}.core.spec.ts`):
- Identity stability (ID never changes)
- Factory method validation (invalid inputs rejected)
- State transition invariants (e.g., can't delete already-deleted entity)
- Edge cases (boundary values, null/undefined handling)
- DomainEvent emission on state changes
- No mocks (entities are pure)

**Integration tests**: Not applicable (entities don't integrate with infrastructure)

**E2E tests**: Covered via use case E2E tests that exercise entity behavior through application layer

**Fixtures/factories location**: `tests/fixtures/entities/{Name}Factory.ts`
- Provide `validUser()`, `userWithInvalidEmail()`, etc.
- Use for arranging test data

## 6. Observability & Errors

**Logging/Tracing**: Forbidden. Entities are pure domain logic.

**Error policy**:
- Use `Result<T, DomainError>` for expected failures
- DomainError has code + message: `new DomainError('INVALID_EMAIL', 'Email must be valid format')`
- Never throw for domain validation failures
- Only throw for programmer errors (e.g., null checks in dev)

**Event emission**:
- Emit DomainEvents for state changes: `UserEmailChanged`, `UserDeleted`
- Events captured by AggregateRoot and published via EventBus

## 7. Lifecycle & Evolution

**Creation**: Static factory method `create()` validates and returns `Result<Entity, DomainError>`

**Modification**: Behavior methods return new instance or mutate with guards
```typescript
changeEmail(email: Email): Result<void, DomainError> {
  if (!this.canChangeEmail()) {
    return Result.fail(new DomainError('EMAIL_LOCKED', 'Cannot change email'));
  }
  this._email = email;
  this.addDomainEvent(new UserEmailChanged(this.id, email));
  return Result.ok(undefined);
}
```

**Deletion**: Soft delete with status or hard delete via repository (not entity responsibility)

**Deprecation path**:
- Mark entity with `@deprecated` comment
- Create new entity with migration guide
- Keep old entity for 2 sprints; remove after migration complete

## 8. Anti-Patterns (repo-specific)

- **Anemic entities**: No behavior, just getters/setters (put logic in entity methods)
- **Infrastructure leakage**: Database, HTTP, or file system access in entity
- **Logging in domain**: No console.log, no Logger injection
- **Primitive obsession**: Using `string` for ID instead of branded `UserId`
- **Throwing for validation**: Use `Result` instead of throwing errors
- **Mutable IDs**: ID changes after creation (ID must be stable)

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/identity/domain/entities/User.ts
import { BaseEntity } from '@shared/kernel/domain/BaseEntity';
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { UserEmailChanged } from '../events/UserEmailChanged';

export class User extends BaseEntity<UserId> {
  private constructor(
    id: UserId,
    private _email: Email,
    private _status: 'active' | 'suspended'
  ) {
    super(id);
  }

  static create(props: { id: UserId; email: Email }): Result<User, DomainError> {
    if (!props.email.isValid()) {
      return Result.fail(new DomainError('INVALID_EMAIL', 'Email must be valid'));
    }
    return Result.ok(new User(props.id, props.email, 'active'));
  }

  get email(): Email {
    return this._email;
  }

  get status(): 'active' | 'suspended' {
    return this._status;
  }

  changeEmail(newEmail: Email): Result<void, DomainError> {
    if (this._status === 'suspended') {
      return Result.fail(new DomainError('USER_SUSPENDED', 'Cannot change email while suspended'));
    }
    
    this._email = newEmail;
    this.addDomainEvent(new UserEmailChanged(this.id, newEmail));
    return Result.ok(undefined);
  }

  suspend(): void {
    this._status = 'suspended';
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate entity --context=identity --name=User
```

**Generated files**:
- `src/core/identity/domain/entities/User.ts` (extends BaseEntity, static create, id getter)
- `src/core/identity/domain/value-objects/UserId.ts` (branded ID type)
- `tests/unit/core/identity/domain/entities/User.core.spec.ts` (unit tests for invariants)
- `tests/fixtures/entities/UserFactory.ts` (test fixtures)

**Generated imports**:
```typescript
import { BaseEntity } from '@shared/kernel/domain/BaseEntity';
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
```

**Required follow-up edits**:
1. Add private fields and constructor parameters
2. Implement static `create()` validation logic
3. Add behavior methods (changeEmail, suspend, etc.)
4. Define DomainEvents for state changes
5. Write core unit tests for invariants
6. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### User (Entity)
- **File**: src/core/identity/domain/entities/User.ts
- **Type**: Entity (DDD Primitive)
- **Role**: Represents identity aggregate member
- **Status**: ⏳ (scaffolded, needs implementation)
- **Tests**: Unit core test required
```
