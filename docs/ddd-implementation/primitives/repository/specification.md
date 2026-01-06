# Repository: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: A collection-like interface for accessing aggregates. Repository consists of two parts:
1. **Port** (Application Layer): Interface defining aggregate collection operations
2. **Adapter** (Infrastructure Layer): Implementation using database, in-memory store, or API

**When to use**:
- Need to persist and retrieve aggregates
- Need to abstract persistence mechanism from domain
- Need to query aggregates by ID or business criteria

**When NOT to use**:
- Simple value objects (just pass them around)
- Read-only queries across aggregates (use Read Models/Query Services instead)
- Direct entity persistence (only aggregates should be persisted)

**Required base/interface**: 
- **Port**: Interface with generic operations
- **Adapter**: `BaseRepositoryAdapter<TPort>` with observability

**Allowed dependencies**:
- **Port**: AggregateRoot (generic parameter), ValueObjects (query criteria), Result
- **Adapter**: Port interface, infrastructure (DB clients, ORM), Mappers, Logger, Tracer

**Forbidden dependencies**:
- **Port**: Infrastructure (DB, HTTP, file system)
- **Adapter**: Direct use cases or handlers (adapters serve ports, not call application)

## 2. Required Shape & Files

**Port path**: `src/core/{context}/application/ports/{AggregateRoot}Repository.ts`

**Adapter path**: `src/core/{context}/infrastructure/adapters/{AggregateRoot}RepositoryAdapter.ts`

**Port interface**:
```typescript
export interface UserRepository {
  findById(id: UserId): Promise<Result<User | null, ApplicationError>>;
  save(user: User): Promise<Result<void, ApplicationError>>;
  delete(id: UserId): Promise<Result<void, ApplicationError>>;
}
```

**Adapter class**:
```typescript
export class InMemoryUserRepository extends BaseRepositoryAdapter<UserRepository> implements UserRepository {
  constructor(private logger: Logger, private tracer: Tracer) {
    super(logger, tracer);
  }

  async findById(id: UserId): Promise<Result<User | null, ApplicationError>> {
    return this.withSpan('UserRepository.findById', async (span) => {
      // Implementation with logging, tracing, metrics
    });
  }

  async save(user: User): Promise<Result<void, ApplicationError>> {
    return this.withSpan('UserRepository.save', async (span) => {
      // Implementation
    });
  }
}
```

**Observability hook**: **Adapter only** (infrastructure boundary). Port has no observability.
- Span per operation (`withSpan()` from BaseRepositoryAdapter)
- Log on entry/success/failure
- Metrics for latency, errors

**Source map for tests**:
- **Port**: No tests (interface only)
- **Adapter**:
  - **Integration**: `tests/integration/core/{context}/infrastructure/{Adapter}.spec.ts` (with real/test DB, trace/log verification)
  - **E2E**: Indirectly tested via use case E2E tests

## 3. Invariants & Guards

**Port Must**:
- Be an interface (no implementation)
- Use async methods (repositories are I/O bound)
- Return `Promise<Result<T, ApplicationError>>`
- Use branded IDs and ValueObjects for parameters
- Name operations after collection semantics (findById, save, delete, findByEmail)

**Port Never**:
- Have implementation (pure interface)
- Return naked `Promise<T>` (always wrap in Result)
- Throw for expected failures (use Result)
- Reference infrastructure (DB, HTTP, file system)

**Adapter Must**:
- Extend `BaseRepositoryAdapter<TPort>` and implement `TPort`
- Use `withSpan()` for every operation
- Log at entry, success, and failure
- Return `Result<T, ApplicationError>` for all operations
- Use Mappers to translate between domain and persistence models
- Inject Logger and Tracer

**Adapter Never**:
- Leak infrastructure exceptions (catch and wrap in ApplicationError)
- Call use cases or handlers (layering violation)
- Expose persistence details to callers

**Span/log requirements** (Adapter only):
- Span: `withSpan('{AggregateRoot}Repository.{operation}', async (span) => { ... })`
- Log entry: `logger.info('Finding user by ID', { userId })`
- Log success: `logger.debug('User found', { userId })`
- Log failure: `logger.error('User not found', { userId, error })`

## 4. Collaboration Rules

**Port - Who can call it**:
- Use Cases (application layer orchestration)
- Domain Services (query aggregates)

**Port - What it may call**:
- Nothing (it's an interface)

**Adapter - Who can call it**:
- Use Cases (via port injection)
- Domain Services (via port injection)
- Integration tests

**Adapter - What it may call**:
- Database clients (Prisma, TypeORM, etc.)
- Mappers (domain ↔ persistence)
- Logger, Tracer (observability)
- Result (error handling)

**Allowed return types**:
- `Promise<Result<Aggregate | null, ApplicationError>>` for queries
- `Promise<Result<void, ApplicationError>>` for commands
- `Promise<Result<Aggregate[], ApplicationError>>` for list queries

## 5. Testing Requirements (enforced)

**Port**: No tests (interface only)

**Adapter integration tests** (`{Adapter}.spec.ts`):
- CRUD operations with real/test database
- Error handling (DB connection failure, constraint violations)
- Mapper integration (domain ↔ persistence)
- Span creation (verify trace context)
- Log output (verify entry/success/failure logs)
- Metrics emission (latency, errors)
- No mocks for DB (use test containers or in-memory DB)

**E2E tests**: Covered via use case E2E tests that exercise repository through application layer

**Fixtures/factories location**: `tests/fixtures/adapters/{Adapter}Factory.ts`
- Provide test database setup, seeding

## 6. Observability & Errors

**Port**: No observability (interface only)

**Adapter observability**:
- **Span**: One span per operation, includes aggregate ID, operation name
- **Log entry**: `logger.info('{operation}', { aggregateId, criteria })`
- **Log success**: `logger.debug('{operation} succeeded', { aggregateId })`
- **Log failure**: `logger.error('{operation} failed', { aggregateId, error })`
- **Metrics**: Latency histogram, error counter

**Error policy**:
- Catch all infrastructure exceptions
- Wrap in `ApplicationError` with code + message
- Return `Result.fail(new ApplicationError('USER_NOT_FOUND', 'User with ID {id} not found'))`
- Never throw (unless unrecoverable, like DB connection pool exhausted)

## 7. Lifecycle & Evolution

**Port creation**: Define interface with collection operations

**Adapter creation**: Implement port with infrastructure details (DB, API, in-memory)

**Modification**: Add new methods to port, implement in all adapters

**Deprecation path**:
- Mark port method with `@deprecated`
- Create new port interface (e.g., `UserRepositoryV2`)
- Keep old port for 2 sprints; migrate use cases to new port

## 8. Anti-Patterns (repo-specific)

- **Leaky abstractions**: Port exposes SQL/NoSQL details (e.g., `findByQuery(sql: string)`)
- **Missing observability**: Adapter doesn't log/trace operations
- **Throwing exceptions**: Adapter throws instead of returning Result
- **No mapper**: Adapter returns raw DB records instead of domain objects
- **Synchronous adapter**: Using sync methods for I/O operations
- **Use case calls**: Adapter calls use cases (layering violation)

## 9. Canonical Example (repo style, ≤40 lines)

**Port**:
```typescript
// src/core/identity/application/ports/UserRepository.ts
import { Result } from '@shared/kernel/result';
import { ApplicationError } from '@shared/kernel/errors';
import { User } from '../../domain/entities/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';

export interface UserRepository {
  findById(id: UserId): Promise<Result<User | null, ApplicationError>>;
  findByEmail(email: Email): Promise<Result<User | null, ApplicationError>>;
  save(user: User): Promise<Result<void, ApplicationError>>;
  delete(id: UserId): Promise<Result<void, ApplicationError>>;
}
```

**Adapter**:
```typescript
// src/core/identity/infrastructure/adapters/InMemoryUserRepository.ts
import { BaseRepositoryAdapter } from '@shared/kernel/infrastructure/BaseRepositoryAdapter';
import { Result } from '@shared/kernel/result';
import { ApplicationError } from '@shared/kernel/errors';
import { Logger } from '@shared/kernel/logger';
import { Tracer } from '@shared/kernel/tracer';
import { UserRepository } from '../../application/ports/UserRepository';
import { User } from '../../domain/entities/User';
import { UserId } from '../../domain/value-objects/UserId';

export class InMemoryUserRepository extends BaseRepositoryAdapter<UserRepository> implements UserRepository {
  private users = new Map<string, User>();

  constructor(logger: Logger, tracer: Tracer) {
    super(logger, tracer);
  }

  async findById(id: UserId): Promise<Result<User | null, ApplicationError>> {
    return this.withSpan('UserRepository.findById', async (span) => {
      this.logger.info('Finding user by ID', { userId: id.value });
      
      const user = this.users.get(id.value) || null;
      
      if (user) {
        this.logger.debug('User found', { userId: id.value });
      } else {
        this.logger.debug('User not found', { userId: id.value });
      }
      
      return Result.ok(user);
    });
  }

  async save(user: User): Promise<Result<void, ApplicationError>> {
    return this.withSpan('UserRepository.save', async (span) => {
      this.logger.info('Saving user', { userId: user.id.value });
      this.users.set(user.id.value, user);
      this.logger.debug('User saved', { userId: user.id.value });
      return Result.ok(undefined);
    });
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate repository --context=identity --aggregate=User
```

**Generated files**:
- `src/core/identity/application/ports/UserRepository.ts` (interface)
- `src/core/identity/infrastructure/adapters/InMemoryUserRepository.ts` (adapter with BaseRepositoryAdapter)
- `tests/integration/core/identity/infrastructure/InMemoryUserRepository.spec.ts` (integration tests)
- `tests/fixtures/adapters/UserRepositoryFactory.ts` (test setup)

**Generated imports (Port)**:
```typescript
import { Result } from '@shared/kernel/result';
import { ApplicationError } from '@shared/kernel/errors';
```

**Generated imports (Adapter)**:
```typescript
import { BaseRepositoryAdapter } from '@shared/kernel/infrastructure/BaseRepositoryAdapter';
import { Logger } from '@shared/kernel/logger';
import { Tracer } from '@shared/kernel/tracer';
```

**Required follow-up edits**:
1. Add port methods (findById, save, etc.)
2. Implement adapter with infrastructure (DB client, API)
3. Add Mapper for domain ↔ persistence translation
4. Write integration tests with real/test DB
5. Verify span/log/metric emission
6. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### UserRepository (Repository - Port & Adapter)
- **Port**: src/core/identity/application/ports/UserRepository.ts
- **Adapter**: src/core/identity/infrastructure/adapters/InMemoryUserRepository.ts
- **Type**: Repository (DDD Primitive)
- **Role**: Persist and retrieve User aggregates
- **Status**: ⏳ (scaffolded, needs DB implementation)
- **Tests**: Integration test required (with trace/log verification)
- **Observability**: ✅ Adapter spans, logs, metrics
```
