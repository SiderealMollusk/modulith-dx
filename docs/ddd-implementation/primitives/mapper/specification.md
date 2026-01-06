# Mapper: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: Pure transformation functions that translate between layers: domain ↔ DTOs, domain ↔ persistence, DTOs ↔ API responses. Mappers keep layers decoupled and reduce coupling between domain and application/persistence.

**When to use**:
- Domain entity → DTO (for use case output, API response)
- DTO → Domain entity (for use case input validation)
- Domain entity → DB record (in repository adapter)
- DB record → Domain entity (in repository adapter, reconstitution)
- API response → DTO (API client integration)
- Multiple representations needed in different contexts

**When NOT to use**:
- Simple pass-through (no transformation needed)
- Business logic (put in entity/use case)
- Validation that affects domain (put in Factory)
- Single layer (no need to decouple)

**Required base/interface**: None (pure static methods or class, no inheritance)

**Allowed dependencies**:
- Domain entities/ValueObjects (source/target of mapping)
- DTOs (source/target of mapping)
- ValueObjects (for constructing attributes)
- Result (error handling for complex mappings)
- Specifications (for reading rules)

**Forbidden dependencies**:
- Infrastructure implementations (DB clients, HTTP)
- Application layer (use cases, handlers)
- Logger, Tracer (mappers are pure logic)
- Repositories

## 2. Required Shape & Files

**Path**:
- DTO mappers: `src/core/{context}/application/mappers/{EntityName}Mapper.ts`
- Persistence mappers: `src/core/{context}/infrastructure/mappers/{EntityName}Mapper.ts`

**Must be**: Class with static methods or pure functions, no state

**Required exports**:
```typescript
// DTO Mapper
export class UserMapper {
  static toDomain(dto: CreateUserDTO): Result<User, DomainError> {
    // DTO → Domain (used by use cases)
  }

  static toDto(user: User): UserDTO {
    // Domain → DTO (for API responses)
  }
}

// Persistence Mapper
export class UserPersistenceMapper {
  static toPersistence(user: User): UserDbRecord {
    // Domain → DB record (for persistence)
  }

  static fromPersistence(record: UserDbRecord): Result<User, DomainError> {
    // DB record → Domain (for reconstitution)
  }
}
```

**Observability hook**: None. Mappers are pure transformations - no logging, tracing, or metrics.

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/{layer}/mappers/{MapperName}.spec.ts`
  - DTO → Domain: `{MapperName}.toDomain.spec.ts` (validation, error cases)
  - Domain → DTO: `{MapperName}.toDto.spec.ts` (round-trip, nullability)
  - DB ↔ Domain: `{MapperName}.persistence.spec.ts` (reconstitution, fields)
- **Integration**: Not applicable (mappers don't integrate with infrastructure)
- **E2E**: Covered via use case E2E tests that trigger mapping

## 3. Invariants & Guards

**Must**:
- Be stateless (no mutable fields)
- Be pure (same input = same output always)
- Be idempotent (applying twice = applying once)
- Have no side effects (don't mutate parameters)
- Handle null/undefined gracefully (return default or Result.fail)
- Be deterministic (no randomness, time dependency)
- Return `Result<T, DomainError>` for operations that can fail

**Never**:
- Hold references between invocations
- Mutate source domain objects or DTOs
- Access infrastructure (DB, HTTP, file system)
- Log or trace (domain/application is pure)
- Throw exceptions for expected failures (use Result)
- Perform business validation (that's for Factory)
- Store intermediate state

**Validation rules**:
- Validate types during mapping (number strings → numbers)
- Return `Result.fail(new DomainError(...))` for type mismatches
- Handle missing optional fields
- Preserve all meaningful data during transformation

**Span/log requirements**: None (forbidden in mappers)

## 4. Collaboration Rules

**Who can call it**:
- Use Cases (DTO → Domain, Domain → DTO)
- Repository Adapters (Domain ↔ DB)
- Event Handlers (Domain → DTO for events)
- API endpoints (Domain → API response)
- Query handlers (Domain → DTO for queries)

**What it may call**:
- ValueObjects (for constructing attributes)
- Specifications (for reading rules)
- Result (error handling)
- Pure utility functions
- Other Mappers (composition for nested objects)

**Allowed return types**:
- `Result<T, DomainError>` for mappings that can fail
- Plain type T for deterministic mappings (no validation needed)
- Never: `Promise`, exceptions, `void`

## 5. Testing Requirements (enforced)

**Unit tests** (separate specs for different mapping directions):

**DTO → Domain** (`{MapperName}.toDomain.spec.ts`):
- Happy path (valid DTO maps to valid domain)
- Missing required fields (returns Result.fail)
- Invalid field types (returns Result.fail)
- Type coercion (string → number, etc.)
- Nullable fields (null input handled)
- Default values applied
- No mutation of source DTO

**Domain → DTO** (`{MapperName}.toDto.spec.ts`):
- Happy path (domain object maps to DTO)
- Round-trip (Domain → DTO → Domain preserves data)
- All entity fields included
- ValueObjects converted to primitives
- Null handling (how are missing values represented)
- No mutation of source domain object

**DB → Domain** (`{MapperName}.persistence.spec.ts`):
- Happy path (DB record reconstitutes to domain)
- All persistence fields map correctly
- ValueObjects reconstructed
- ID fields handled (strings to custom IDs)
- Timestamp fields converted to domain Time
- No mutation of source DB record

**Integration tests**: Not applicable

**E2E tests**: Covered via use case E2E tests

**Fixtures/factories location**: `tests/fixtures/mappers/{MapperName}Fixture.ts`
- Provide valid DTOs for DTO mapping tests
- Provide DB records for persistence mapping tests
- Factory methods for different nullable/edge case scenarios

## 6. Observability & Errors

**Logging/Tracing**: Forbidden. Mappers are pure transformations.

**Error policy**:
- Use `Result<T, DomainError>` for mappings that can fail
- Return `Result.fail(new DomainError('CODE', 'Message'))` for type mismatches
- Never throw for expected failures (invalid input)
- Only throw for programmer errors (null checks in dev)

**Example error handling**:
```typescript
static toDomain(dto: CreateUserDTO): Result<User, DomainError> {
  // Validate required fields
  if (!dto.email) {
    return Result.fail(new DomainError('MISSING_EMAIL', 'Email is required'));
  }

  // Map email to ValueObject (may fail validation)
  const emailResult = Email.create(dto.email);
  if (emailResult.isFailure) return Result.fail(emailResult.error);

  // Construct domain entity
  const user = User.create({
    email: emailResult.value,
    name: dto.name || 'Anonymous',
  });

  return Result.ok(user);
}
```

## 7. Lifecycle & Evolution

**Creation**: Define static methods for each mapping direction

**Multiple mapping paths** (common mapper pattern):
```typescript
export class UserMapper {
  // Path 1: DTO input → Domain (for creates/updates)
  static toDomain(dto: CreateUserDTO): Result<User, DomainError> {}

  // Path 2: Domain → DTO output (for responses)
  static toDto(user: User): UserDTO {}

  // Path 3: DB → Domain (for reads)
  static fromPersistence(record: UserDbRecord): Result<User, DomainError> {}

  // Path 4: Domain → DB (for writes)
  static toPersistence(user: User): UserDbRecord {}
}
```

**Modification**: Add new mapping methods for new layer transformations

**Deprecation path**:
- Mark methods with `@deprecated` comment
- Create new mapper methods for new pattern
- Keep old methods for 2 sprints; remove after migration

## 8. Anti-Patterns (repo-specific)

- **Business logic in mapper**: Validation/calculation (use Factory/Service)
- **Mutating parameters**: Changing source domain objects or DTOs
- **Logging/tracing**: No observability in mappers
- **Infrastructure access**: Calling DB or HTTP during mapping
- **Type casting**: Using `as` instead of proper mapping
- **Incomplete mapping**: Missing fields or nested objects

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/users/application/mappers/UserMapper.ts
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { CreateUserDTO } from '../dtos/CreateUserDTO';
import { UserDTO } from '../dtos/UserDTO';

export class UserMapper {
  static toDomain(dto: CreateUserDTO): Result<User, DomainError> {
    const emailResult = Email.create(dto.email);
    if (emailResult.isFailure) return Result.fail(emailResult.error);

    const user = User.create({
      email: emailResult.value,
      name: dto.name,
    });
    return Result.ok(user);
  }

  static toDto(user: User): UserDTO {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}

// src/core/users/infrastructure/mappers/UserPersistenceMapper.ts
export class UserPersistenceMapper {
  static toPersistence(user: User): UserDbRecord {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      created_at: user.createdAt.toISOString(),
      version: user.version,
    };
  }

  static fromPersistence(record: UserDbRecord): Result<User, DomainError> {
    const emailResult = Email.createExisting(record.email);
    if (emailResult.isFailure) return Result.fail(emailResult.error);

    const user = User.createExisting({
      id: record.id,
      email: emailResult.value,
      name: record.name,
      createdAt: new Date(record.created_at),
      version: record.version,
    });
    return Result.ok(user);
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate mapper --context=users --name=User --type=dto
nx generate mapper --context=users --name=User --type=persistence
```

**Generated files**:
- `src/core/users/application/mappers/UserMapper.ts` (DTO mapper)
- `src/core/users/infrastructure/mappers/UserPersistenceMapper.ts` (persistence mapper)
- `tests/unit/core/users/application/mappers/UserMapper.toDomain.spec.ts` (DTO input tests)
- `tests/unit/core/users/application/mappers/UserMapper.toDto.spec.ts` (DTO output tests)
- `tests/unit/core/users/infrastructure/mappers/UserPersistenceMapper.spec.ts` (DB tests)
- `tests/fixtures/mappers/UserMapperFixture.ts` (test data)

**Generated imports**:
```typescript
import { Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';
```

**Required follow-up edits**:
1. Add method signatures for each mapping direction
2. Implement DTO → Domain mapping with validation
3. Implement Domain → DTO mapping
4. Implement DB → Domain mapping with reconstitution
5. Implement Domain → DB mapping with persistence
6. Write DTO input unit tests (toDomain)
7. Write DTO output unit tests (toDto)
8. Write persistence unit tests (fromPersistence, toPersistence)
9. Create test fixtures with valid and edge case data
10. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### UserMapper (Mapper - DTO)
- **File**: src/core/users/application/mappers/UserMapper.ts
- **Type**: Mapper (DDD Primitive)
- **Role**: Transform between CreateUserDTO/UserDTO and User domain entity
- **Status**: ⏳ (scaffolded, needs mapping logic)
- **Tests**: DTO input and output unit tests required

### UserPersistenceMapper (Mapper - Persistence)
- **File**: src/core/users/infrastructure/mappers/UserPersistenceMapper.ts
- **Type**: Mapper (DDD Primitive)
- **Role**: Transform between UserDbRecord and User domain entity
- **Status**: ⏳ (scaffolded, needs mapping logic)
- **Tests**: Persistence unit tests required
```
