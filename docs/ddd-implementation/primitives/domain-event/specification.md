# DomainEvent: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: An immutable record of something significant that happened in the domain. Events represent facts about state changes and are the primary mechanism for decoupling aggregates and bounded contexts.

**When to use**:
- Aggregate state change that other parts of system care about
- Trigger side effects in other aggregates/contexts
- Audit trail requirement (who/what/when)
- Event sourcing or CQRS patterns

**When NOT to use**:
- Internal aggregate state changes (use private methods)
- Infrastructure concerns (use application events instead)
- Simple CRUD operations with no side effects

**Required base/interface**: `DomainEvent` abstract class

**Allowed dependencies**:
- ValueObjects (event payload)
- Branded IDs (entity references)
- Pure primitives (string, number, Date)

**Forbidden dependencies**:
- Entities or AggregateRoots (use IDs only)
- Infrastructure (repositories, HTTP, database)
- Application layer (use cases, handlers)
- Logger, Tracer, or any observability

## 2. Required Shape & Files

**Path**: `src/core/{context}/domain/events/{EventName}.ts`

**Must extend**: `DomainEvent` abstract class

**Required exports**:
```typescript
export class UserEmailChanged extends DomainEvent {
  // Static factory method
  static create(userId: UserId, newEmail: Email): UserEmailChanged;

  // Event-specific getters
  get userId(): UserId;
  get newEmail(): Email;

  // Serialization (from base class)
  toPrimitives(): Record<string, any>;
}
```

**Observability hook**: None. Events are pure domain - no logging, tracing, or metrics. Observability happens when events are published (in application layer).

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/domain/events/{EventName}.spec.ts`
  - Core logic: `{EventName}.core.spec.ts` (serialization, equality, immutability)
- **Integration**: Tested when published via EventBus
- **E2E**: Indirectly tested via use case E2E tests

## 3. Invariants & Guards

**Must**:
- Be immutable (all fields readonly)
- Have unique event ID (UUID, from base class)
- Have `occurredOn` timestamp (from base class)
- Include aggregate/entity ID (who triggered event)
- Implement `toPrimitives()` for serialization
- Be serializable to JSON (no circular refs, no functions)
- Have versioning for schema evolution (optional but recommended)

**Never**:
- Mutate after creation (no setters)
- Reference entities/aggregates by object (use IDs)
- Contain business logic (events are data)
- Throw exceptions (events are simple data holders)
- Access infrastructure
- Log or trace

**Validation rules**:
- All fields validated in constructor or static factory
- Fail fast if required fields missing (throw, since events are critical)

**Span/log requirements**: None (forbidden in domain layer)

## 4. Collaboration Rules

**Who can call it**:
- Entities (to record state changes)
- AggregateRoots (to record state changes)
- Factories (for creation events)

**What it may call**:
- ValueObjects (for event payload)
- Primitive constructors (Date, String, Number)
- Utility functions (UUID generation)

**Allowed return types**:
- Event instance from static factory
- `Record<string, any>` from `toPrimitives()`
- Primitive types for getters

## 5. Testing Requirements (enforced)

**Unit tests** (`{EventName}.core.spec.ts`):
- Immutability (fields cannot be changed)
- Serialization (`toPrimitives()` produces correct JSON)
- Event ID is unique (UUID format)
- `occurredOn` is set correctly
- Edge cases (null/undefined fields, boundary values)
- No mocks (events are simple data)

**Integration tests**: Tested when published via EventBus (application layer)

**E2E tests**: Covered via use case E2E tests that emit and handle events

**Fixtures/factories location**: `tests/fixtures/events/{EventName}Factory.ts`
- Provide `userEmailChangedEvent()`, etc.

## 6. Observability & Errors

**Logging/Tracing**: Forbidden in event definition. Observability happens when events are published (EventBus logs/traces).

**Error policy**:
- Events are simple data holders - no error handling needed
- Throw for programmer errors (missing required fields)
- Never throw in getters (events should be valid after construction)

**Event publishing**:
- Events collected by AggregateRoot (`getDomainEvents()`)
- Published via EventBus after transaction commit (application layer)

## 7. Lifecycle & Evolution

**Creation**: Static factory method `create()` or constructor validates and returns event instance

**Modification**: Not applicable (events are immutable)

**Deletion**: Events are never deleted (append-only log)

**Versioning**: Add version field for schema evolution
```typescript
export class UserEmailChanged extends DomainEvent {
  readonly version = 2; // Increment on breaking changes
  
  // v2 adds 'reason' field
  constructor(
    public readonly userId: UserId,
    public readonly newEmail: Email,
    public readonly reason: string // New in v2
  ) {
    super();
  }
}
```

**Deprecation path**:
- Mark with `@deprecated` comment
- Create new event version (e.g., `UserEmailChangedV2`)
- Keep old event for 6 sprints (events are historical records)

## 8. Anti-Patterns (repo-specific)

- **Mutable events**: Having setters or mutable fields (violates immutability)
- **Business logic in events**: Events are data, not behavior
- **Entity references**: Holding object references instead of IDs
- **Infrastructure leakage**: Database, HTTP, or file system access
- **Logging in events**: No console.log, no Logger injection
- **Missing IDs**: Event doesn't identify which aggregate/entity triggered it

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/identity/domain/events/UserEmailChanged.ts
import { DomainEvent } from '@shared/kernel/events/DomainEvent';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';

export class UserEmailChanged extends DomainEvent {
  readonly version = 1;

  constructor(
    public readonly userId: UserId,
    public readonly newEmail: Email,
    public readonly previousEmail: Email
  ) {
    super(); // Sets id and occurredOn
  }

  static create(userId: UserId, newEmail: Email, previousEmail: Email): UserEmailChanged {
    return new UserEmailChanged(userId, newEmail, previousEmail);
  }

  toPrimitives(): Record<string, any> {
    return {
      eventId: this.id,
      eventName: 'UserEmailChanged',
      version: this.version,
      occurredOn: this.occurredOn.toISOString(),
      userId: this.userId.value,
      newEmail: this.newEmail.value,
      previousEmail: this.previousEmail.value,
    };
  }

  static fromPrimitives(data: Record<string, any>): UserEmailChanged {
    return new UserEmailChanged(
      UserId.create(data.userId).value!,
      Email.create(data.newEmail).value!,
      Email.create(data.previousEmail).value!
    );
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate domain-event --context=identity --name=UserEmailChanged
```

**Generated files**:
- `src/core/identity/domain/events/UserEmailChanged.ts` (extends DomainEvent)
- `tests/unit/core/identity/domain/events/UserEmailChanged.core.spec.ts` (unit tests)
- `tests/fixtures/events/UserEmailChangedFactory.ts` (test fixtures)

**Generated imports**:
```typescript
import { DomainEvent } from '@shared/kernel/events/DomainEvent';
```

**Required follow-up edits**:
1. Add event-specific fields (userId, newEmail, etc.)
2. Implement `toPrimitives()` for serialization
3. Implement `fromPrimitives()` for deserialization (optional)
4. Add version field if schema evolution needed
5. Write core unit tests for serialization, immutability
6. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### UserEmailChanged (DomainEvent)
- **File**: src/core/identity/domain/events/UserEmailChanged.ts
- **Type**: DomainEvent (DDD Primitive)
- **Role**: Records user email change
- **Status**: ⏳ (scaffolded, needs fields + serialization)
- **Tests**: Unit core test required (serialization, immutability)
```
