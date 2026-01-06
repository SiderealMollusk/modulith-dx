# Specification (Policy): Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: An encapsulated business rule that can be evaluated to determine if an object satisfies criteria. Specifications separate complex validation/selection logic from entities and enable rule composition.

**When to use**:
- Complex validation rules (password strength, eligibility criteria)
- Business rule evaluation (can user perform action?)
- Query criteria (find all users matching specification)
- Domain rule composition (combine multiple rules with AND/OR/NOT)
- Reusable business rules across multiple contexts

**When NOT to use**:
- Simple validation (use ValueObject validator or Entity method)
- Infrastructure queries (use repository query methods)
- Application logic (use use case)
- Single-use validation (define inline in entity method)

**Required base/interface**: `Specification<T>` interface

**Allowed dependencies**:
- Domain entities/ValueObjects (what you're evaluating)
- Other Specifications (composition via AND/OR/NOT)
- Pure utility functions (formatters, comparators)

**Forbidden dependencies**:
- Infrastructure (repositories, HTTP, database)
- Application layer (use cases, handlers)
- Logger, Tracer (specifications are pure domain logic)

## 2. Required Shape & Files

**Path**: `src/core/{context}/domain/policies/{SpecificationName}.ts`

**Must implement**: `Specification<T>` interface

**Required exports**:
```typescript
export class PasswordStrengthPolicy implements Specification<string> {
  // Evaluation logic
  isSatisfiedBy(password: string): boolean {
    // Pure boolean evaluation
  }

  // Composition operators (from base interface)
  and(other: Specification<string>): Specification<string> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<string>): Specification<string> {
    return new OrSpecification(this, other);
  }

  not(): Specification<string> {
    return new NotSpecification(this);
  }
}
```

**Observability hook**: None. Specifications are pure domain logic - no logging, tracing, or metrics.

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/domain/policies/{SpecificationName}.spec.ts`
  - Core logic: `{SpecificationName}.core.spec.ts` (rule evaluation, edge cases, composition)
- **Integration**: Not applicable (specifications don't integrate with infrastructure)
- **E2E**: Indirectly tested via entity/use case E2E tests that exercise the rule

## 3. Invariants & Guards

**Must**:
- Implement `Specification<T>` interface
- Have pure `isSatisfiedBy()` method (no side effects, no mutations)
- Support composition (and/or/not via methods or base class)
- Be deterministic (same input = same output, always)
- Be stateless (no mutable fields, immutable state)
- Return `boolean` (never throw or return Result)
- Have no dependencies on external state

**Never**:
- Mutate state (neither own state nor passed-in object)
- Access infrastructure (DB, HTTP, file system)
- Log or trace (domain is pure)
- Throw exceptions for evaluation failures (return false)
- Call entities/aggregates with side effects
- Store transient state between evaluations

**Validation rules**:
- All evaluation logic in `isSatisfiedBy()`
- No exception paths (evaluate to boolean)
- Edge cases handled gracefully (null/undefined → false)

**Span/log requirements**: None (forbidden in domain layer)

## 4. Collaboration Rules

**Who can call it**:
- Entities (validate before state change: `if (passwordPolicy.isSatisfiedBy(newPassword)) { ... }`)
- Aggregates (enforce cluster-wide rules)
- Domain Services (query/compose specifications)
- Use Cases (validate before persistence)
- Repositories (as query criteria in adapters)

**What it may call**:
- Other Specifications (composition)
- ValueObjects (for complex evaluation)
- Pure utility functions (comparators, formatters)
- Result (never - specifications return boolean)

**Allowed return types**:
- `boolean` from `isSatisfiedBy()`
- `Specification<T>` from composition methods (and/or/not)
- Never: `Promise`, `Result`, exceptions

## 5. Testing Requirements (enforced)

**Unit tests** (`{SpecificationName}.core.spec.ts`):
- Rule evaluation (happy path: satisfies → true)
- Rule rejection (sad path: doesn't satisfy → false)
- Edge cases (empty string, null, undefined, boundary values)
- Composition logic (and, or, not operators work correctly)
- Idempotence (multiple evaluations = same result)
- No side effects (object unchanged after evaluation)
- No mocks (specifications are pure)

**Integration tests**: Not applicable (specifications don't integrate with infrastructure)

**E2E tests**: Covered via entity/use case E2E tests that exercise the specification

**Fixtures/factories location**: `tests/fixtures/specifications/{SpecificationName}Factory.ts`
- Provide test values that satisfy/don't satisfy rule
- Example: `validPasswordFactory()`, `tooShortPasswordFactory()`

## 6. Observability & Errors

**Logging/Tracing**: Forbidden. Specifications are pure domain logic.

**Error policy**:
- Specifications never throw
- Never raise exceptions for evaluation failures
- Return `false` for unsatisfied conditions
- Optionally throw only for programmer errors (null checks in dev)

**Composition**:
- `spec1.and(spec2).isSatisfiedBy(obj)` → both must be true
- `spec1.or(spec2).isSatisfiedBy(obj)` → at least one must be true
- `spec1.not().isSatisfiedBy(obj)` → must be false

## 7. Lifecycle & Evolution

**Creation**: Implement `Specification<T>` with pure evaluation logic

**Modification**: Add new evaluation criteria to `isSatisfiedBy()` or create composed specifications

**Composition**: Use and/or/not to combine specifications
```typescript
const strongPassword = new MinLengthPolicy(8)
  .and(new ContainsUppercasePolicy())
  .and(new ContainsNumberPolicy());

if (strongPassword.isSatisfiedBy(password)) { ... }
```

**Deprecation path**:
- Mark with `@deprecated` comment
- Create new specification with migration guide
- Keep old specification for 2 sprints; remove after migration

## 8. Anti-Patterns (repo-specific)

- **Stateful specifications**: Mutable fields or side effects during evaluation
- **Infrastructure access**: Calling repositories or external services
- **Throwing exceptions**: Using throw instead of returning false
- **Complex object mutation**: Specification changes the evaluated object
- **Logging/tracing**: No observability in domain specifications
- **Async evaluation**: Using async/Promise in isSatisfiedBy()

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/identity/domain/policies/PasswordStrengthPolicy.ts
import { Specification } from '@shared/kernel/domain/Specification';
import { AndSpecification, OrSpecification, NotSpecification } from '@shared/kernel/domain/specifications';

export class MinLengthPolicy implements Specification<string> {
  constructor(private minLength: number) {}

  isSatisfiedBy(password: string): boolean {
    return password.length >= this.minLength;
  }

  and(other: Specification<string>): Specification<string> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<string>): Specification<string> {
    return new OrSpecification(this, other);
  }

  not(): Specification<string> {
    return new NotSpecification(this);
  }
}

export class ContainsNumberPolicy implements Specification<string> {
  private readonly regex = /\\d/;

  isSatisfiedBy(password: string): boolean {
    return this.regex.test(password);
  }

  and(other: Specification<string>): Specification<string> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<string>): Specification<string> {
    return new OrSpecification(this, other);
  }

  not(): Specification<string> {
    return new NotSpecification(this);
  }
}

// Usage in entity
export class User extends BaseEntity<UserId> {
  setPassword(newPassword: string): Result<void, DomainError> {
    const passwordPolicy = new MinLengthPolicy(8)
      .and(new ContainsNumberPolicy());

    if (!passwordPolicy.isSatisfiedBy(newPassword)) {
      return Result.fail(new DomainError('WEAK_PASSWORD', 'Password must be 8+ chars with a number'));
    }

    this._password = newPassword;
    return Result.ok(undefined);
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate specification --context=identity --name=PasswordStrength
```

**Generated files**:
- `src/core/identity/domain/policies/PasswordStrengthPolicy.ts` (implements Specification<T>)
- `tests/unit/core/identity/domain/policies/PasswordStrengthPolicy.core.spec.ts` (unit tests)
- `tests/fixtures/specifications/PasswordStrengthPolicyFactory.ts` (test fixtures)

**Generated imports**:
```typescript
import { Specification } from '@shared/kernel/domain/Specification';
import { AndSpecification, OrSpecification, NotSpecification } from '@shared/kernel/domain/specifications';
```

**Required follow-up edits**:
1. Implement `isSatisfiedBy()` evaluation logic
2. Add composition helper methods (and/or/not)
3. Define edge case handling (null/undefined handling)
4. Write core unit tests for evaluation logic
5. Write composition tests (and/or/not work correctly)
6. Create test fixtures with satisfying/failing values
7. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### PasswordStrengthPolicy (Specification)
- **File**: src/core/identity/domain/policies/PasswordStrengthPolicy.ts
- **Type**: Specification (DDD Primitive)
- **Role**: Validates password meets security requirements
- **Status**: ⏳ (scaffolded, needs evaluation logic)
- **Tests**: Unit core test required (evaluation + composition)
```
