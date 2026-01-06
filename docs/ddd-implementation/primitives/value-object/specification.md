# ValueObject: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: An immutable object defined entirely by its attributes. Two value objects with identical attributes are interchangeable.

**When to use**:
- Attributes matter, identity doesn't
- Immutability is desired
- Conceptual whole (Email, Money, DateRange)
- Validation/formatting rules (Phone, ISBN)

**When NOT to use**:
- Identity matters (use Entity)
- Object has lifecycle (use Entity)
- Mutable state required (use Entity)

**Required base/interface**: `ValueObject<T>` abstract class

**Allowed dependencies**:
- Other ValueObjects (composition)
- Specifications/Policies (validation)
- Result (error handling)
- Pure functions from shared utilities

**Forbidden dependencies**:
- Entities (value objects should be lower-level primitives)
- Infrastructure (repositories, HTTP, database)
- Application layer (use cases, handlers)
- Logger, Tracer, or any observability

## 2. Required Shape & Files

**Path**: `src/core/{context}/domain/value-objects/{Name}.ts`

**Must extend**: `ValueObject<T>` where `T` is the unwrapped primitive type

**Required exports**:
```typescript
export class Email extends ValueObject<string> {
  // Private constructor (force factory)
  private constructor(value: string) {
    super(value);
  }

  // Static factory method
  static create(value: string): Result<Email, DomainError>;

  // Value accessor
  get value(): string;

  // Domain behavior (validation, formatting, comparison)
  isValid(): boolean;
  equals(other: Email): boolean;
}
```

**Observability hook**: None. ValueObjects are pure domain - no logging, tracing, or metrics.

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/domain/value-objects/{Name}.spec.ts`
  - Core logic: `{Name}.core.spec.ts` (validation, equality, immutability)
- **Integration**: Not applicable (value objects don't touch infrastructure)
- **E2E**: Indirectly tested via entity/use case tests

## 3. Invariants & Guards

**Must**:
- Be immutable (all fields readonly)
- Validate in static `create()` method
- Implement structural equality (`equals()`)
- Return `Result<ValueObject, DomainError>` from factory
- Have no identity (no ID field)
- Be serializable to primitives (`toPrimitives()`)

**Never**:
- Mutate after creation (no setters)
- Have mutable fields (arrays/objects must be readonly or copied)
- Throw exceptions for validation (use Result)
- Access infrastructure (DB, HTTP, file system)
- Log or trace (domain is pure)
- Reference entities (dependency inversion violation)

**Validation rules**:
- All validation in static `create()`
- Return `Result.fail(new DomainError(...))` for invalid inputs
- Edge cases: empty strings, null, undefined, out-of-range numbers

**Span/log requirements**: None (forbidden in domain layer)

## 4. Collaboration Rules

**Who can call it**:
- Entities (to compose attributes)
- AggregateRoots (to compose attributes)
- Other ValueObjects (composition)
- Domain Services (orchestrate logic)
- Use Cases (application layer)
- Factories (complex creation)

**What it may call**:
- Other ValueObjects (composition)
- Specifications/Policies (validation)
- Result (error handling)
- Pure utility functions (formatters, parsers)

**Allowed return types**:
- `Result<ValueObject, DomainError>` for factory
- Primitive types for getters
- `boolean` for validation/comparison
- Never: naked `Promise` (no async in domain)

## 5. Testing Requirements (enforced)

**Unit tests** (`{Name}.core.spec.ts`):
- Factory validation (reject invalid inputs)
- Equality (same values = equal objects)
- Immutability (no mutation after creation)
- Edge cases (empty, null, boundary values)
- Serialization (`toPrimitives()`)
- No mocks (value objects are pure)

**Integration tests**: Not applicable (value objects don't integrate with infrastructure)

**E2E tests**: Covered via entity/use case E2E tests that use value objects

**Fixtures/factories location**: `tests/fixtures/value-objects/{Name}Factory.ts`
- Provide `validEmail()`, `invalidEmail()`, etc.

## 6. Observability & Errors

**Logging/Tracing**: Forbidden. ValueObjects are pure domain logic.

**Error policy**:
- Use `Result<T, DomainError>` for expected failures
- DomainError has code + message: `new DomainError('INVALID_EMAIL', 'Email format is invalid')`
- Never throw for validation failures
- Only throw for programmer errors (e.g., null checks in dev)

**Event emission**: Not applicable (value objects don't emit events)

## 7. Lifecycle & Evolution

**Creation**: Static factory method `create()` validates and returns `Result<ValueObject, DomainError>`

**Modification**: Not applicable (value objects are immutable). To "change" a value object, create a new one.

**Deletion**: Value objects are garbage collected when no longer referenced

**Deprecation path**:
- Mark with `@deprecated` comment
- Create new value object with migration guide
- Keep old value object for 2 sprints; remove after migration complete

## 8. Anti-Patterns (repo-specific)

- **Mutable value objects**: Having setters or mutable fields (violates immutability)
- **Identity in value objects**: Adding ID field (use Entity instead)
- **Infrastructure leakage**: Database, HTTP, or file system access
- **Logging in domain**: No console.log, no Logger injection
- **Throwing for validation**: Use `Result` instead of throwing errors
- **Primitive obsession**: Using raw strings/numbers instead of value objects (e.g., `string` for email)

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/identity/domain/value-objects/Email.ts
import { ValueObject } from '@shared/kernel/domain/ValueObject';
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';

export class Email extends ValueObject<string> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(value: string) {
    super(value);
  }

  static create(value: string): Result<Email, DomainError> {
    if (!value || value.trim().length === 0) {
      return Result.fail(new DomainError('EMPTY_EMAIL', 'Email cannot be empty'));
    }

    if (!Email.EMAIL_REGEX.test(value)) {
      return Result.fail(new DomainError('INVALID_EMAIL', 'Email format is invalid'));
    }

    return Result.ok(new Email(value.trim().toLowerCase()));
  }

  get value(): string {
    return this._value;
  }

  isValid(): boolean {
    return Email.EMAIL_REGEX.test(this._value);
  }

  equals(other: Email): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toPrimitives(): string {
    return this._value;
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate value-object --context=identity --name=Email
```

**Generated files**:
- `src/core/identity/domain/value-objects/Email.ts` (extends ValueObject, static create)
- `tests/unit/core/identity/domain/value-objects/Email.core.spec.ts` (unit tests)
- `tests/fixtures/value-objects/EmailFactory.ts` (test fixtures)

**Generated imports**:
```typescript
import { ValueObject } from '@shared/kernel/domain/ValueObject';
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
```

**Required follow-up edits**:
1. Implement validation logic in `create()`
2. Add domain behavior methods (isValid, format, etc.)
3. Implement `equals()` for structural equality
4. Implement `toPrimitives()` for serialization
5. Write core unit tests for validation, equality, immutability
6. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### Email (ValueObject)
- **File**: src/core/identity/domain/value-objects/Email.ts
- **Type**: ValueObject (DDD Primitive)
- **Role**: Represents validated email address
- **Status**: ⏳ (scaffolded, needs validation logic)
- **Tests**: Unit core test required
```
