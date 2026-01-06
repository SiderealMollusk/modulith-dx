# UseCase: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: A single application-level operation that orchestrates domain logic to achieve a user goal. Use cases are the entry point to the application layer and enforce transaction boundaries.

**When to use**:
- User or system initiates an action (create user, place order, cancel subscription)
- Need to orchestrate multiple domain objects
- Transaction boundary required (all-or-nothing)
- Cross-cutting concerns needed (validation, observability, error handling)

**When NOT to use**:
- Simple domain behavior (put in entity/aggregate)
- Read-only queries (use Query or Read Model)
- Infrastructure operations (use adapters/services)

**Required base/interface**: `BaseUseCase<TInput, TOutput>`

**Allowed dependencies**:
- Repositories (via ports)
- Domain Services
- Event Bus
- AggregateRoots, Entities, ValueObjects
- Mappers (DTO ↔ domain)
- Result, Logger, Tracer (from shared kernel)

**Forbidden dependencies**:
- Infrastructure implementations directly (use ports)
- Handlers (use cases serve handlers, not call them)
- Other use cases directly (use orchestration pattern or domain service)

## 2. Required Shape & Files

**Path**: `src/core/{context}/application/use-cases/{UseCaseName}.ts`

**Must extend**: `BaseUseCase<TInput, TOutput>`

**Required exports**:
```typescript
export class CreateUserUseCase extends BaseUseCase<CreateUserDto, UserDto> {
  constructor(
    private userRepository: UserRepository,
    private eventBus: EventBus,
    logger: Logger,
    tracer: Tracer
  ) {
    super(logger, tracer);
  }

  protected async executeImpl(input: CreateUserDto): Promise<Result<UserDto, ApplicationError>> {
    // Orchestration logic with span, validation, error handling
  }
}
```

**Observability hook**: **Yes** (application boundary).
- Span wrapping entire execution (`execute()` in BaseUseCase)
- Log on entry/success/failure
- Metrics for latency, errors
- DTO validation before execution

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/application/use-cases/{UseCaseName}.spec.ts`
  - Core logic: `{UseCaseName}.core.spec.ts` (business logic, domain calls, error handling)
- **Integration**: `tests/integration/core/{context}/application/use-cases/{UseCaseName}.spec.ts` (with repos, event bus, trace/log verification)
- **E2E**: `tests/e2e/core/{context}/{UseCaseName}.e2e.spec.ts` (full flow with correlation ID)

## 3. Invariants & Guards

**Must**:
- Extend `BaseUseCase<TInput, TOutput>`
- Define Zod schema for `TInput` (DTO validation)
- Implement `executeImpl()` (not `execute()`, which is in base class)
- Return `Result<TOutput, ApplicationError>` from `executeImpl()`
- Inject repositories via ports (not concrete adapters)
- Inject Logger and Tracer (passed to base class)
- Publish domain events after successful commit

**Never**:
- Bypass validation (base class auto-validates with Zod)
- Throw exceptions for business failures (use Result)
- Call infrastructure directly (use ports)
- Call other use cases directly (use orchestration or domain service)
- Mutate input DTO (treat as immutable)

**Validation rules**:
- Zod schema defined in DTO file
- Base class validates before calling `executeImpl()`
- Return `Result.fail(new ApplicationError('VALIDATION_ERROR', ...))` if Zod fails

**Span/log requirements**:
- Span: Auto-created by `execute()` in BaseUseCase: `{UseCaseName}.execute`
- Log entry: Auto-logged by base class: `logger.info('{UseCaseName} started', { input })`
- Log success: Auto-logged: `logger.info('{UseCaseName} succeeded', { output })`
- Log failure: Auto-logged: `logger.error('{UseCaseName} failed', { error })`

## 4. Collaboration Rules

**Who can call it**:
- Handlers (HTTP, gRPC, CLI)
- Event handlers (async message consumers)
- Schedulers (cron jobs)
- Integration tests, E2E tests

**What it may call**:
- Repositories (via ports)
- Domain Services
- Event Bus (publish events)
- Aggregates/Entities/ValueObjects (domain logic)
- Mappers (DTO ↔ domain)

**Allowed return types**:
- `Promise<Result<TOutput, ApplicationError>>` (always wrapped in Result)

## 5. Testing Requirements (enforced)

**Unit tests** (`{UseCaseName}.core.spec.ts`):
- Core business logic (happy path, edge cases)
- Error handling (repository failures, domain errors)
- DTO validation (invalid inputs rejected)
- Event publishing (verify events published)
- Mock repositories (test use case logic, not infrastructure)

**Integration tests** (`{UseCaseName}.spec.ts`):
- Use real repositories (test containers or in-memory)
- Verify span creation (trace context exists)
- Verify log output (entry/success/failure logs)
- Verify event publishing (events in bus)
- Transaction rollback on errors

**E2E tests** (`{UseCaseName}.e2e.spec.ts`):
- Full flow via handler (HTTP request → use case → DB)
- Correlation ID propagation
- End-to-end tracing (span chain complete)
- Database state verification

**Fixtures/factories location**: `tests/fixtures/use-cases/{UseCaseName}Factory.ts`
- Provide mock repositories, test DTOs

## 6. Observability & Errors

**Logging/Tracing**: **Yes** (application boundary).
- **Span**: One span per execution, includes use case name, input/output
- **Log entry**: `logger.info('{UseCaseName} started', { input })`
- **Log success**: `logger.info('{UseCaseName} succeeded', { output })`
- **Log failure**: `logger.error('{UseCaseName} failed', { error })`
- **Metrics**: Latency histogram, error counter

**Error policy**:
- Use `Result<T, ApplicationError>` for expected failures
- ApplicationError has code + message: `new ApplicationError('USER_ALREADY_EXISTS', 'User with email {email} exists')`
- Never throw for business failures
- Catch and wrap infrastructure exceptions: `Result.fail(new ApplicationError('DB_ERROR', ...))`

**Event publishing**:
- Collect events from aggregate: `aggregate.getDomainEvents()`
- Publish via EventBus after successful transaction
- Clear events after publishing: `aggregate.clearDomainEvents()`

## 7. Lifecycle & Evolution

**Creation**: Define class extending BaseUseCase with typed input/output

**Modification**: Add new dependencies (repos, services) to constructor

**Deprecation path**:
- Mark with `@deprecated` comment
- Create new use case with migration guide
- Keep old use case for 2 sprints; remove after handlers migrated

## 8. Anti-Patterns (repo-specific)

- **Anemic use cases**: No orchestration, just pass-through to repository
- **God use cases**: Doing too much (split into multiple use cases)
- **Missing validation**: Not defining Zod schema for input DTO
- **Throwing exceptions**: Throwing instead of returning Result
- **Direct infrastructure**: Calling DB directly instead of via repository port
- **Use case chains**: Calling other use cases directly (use domain service or orchestration)

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/identity/application/use-cases/CreateUserUseCase.ts
import { BaseUseCase } from '@shared/kernel/application/BaseUseCase';
import { Result } from '@shared/kernel/result';
import { ApplicationError } from '@shared/kernel/errors';
import { Logger } from '@shared/kernel/logger';
import { Tracer } from '@shared/kernel/tracer';
import { UserRepository } from '../ports/UserRepository';
import { EventBus } from '@shared/kernel/events';
import { CreateUserDto, UserDto } from '../dtos';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';

export class CreateUserUseCase extends BaseUseCase<CreateUserDto, UserDto> {
  constructor(
    private userRepository: UserRepository,
    private eventBus: EventBus,
    logger: Logger,
    tracer: Tracer
  ) {
    super(logger, tracer);
  }

  protected async executeImpl(input: CreateUserDto): Promise<Result<UserDto, ApplicationError>> {
    // 1. Create value objects
    const emailResult = Email.create(input.email);
    if (emailResult.isFailure) {
      return Result.fail(new ApplicationError('INVALID_EMAIL', emailResult.error.message));
    }

    // 2. Check uniqueness
    const existingUser = await this.userRepository.findByEmail(emailResult.value!);
    if (existingUser.isFailure) {
      return Result.fail(existingUser.error);
    }
    if (existingUser.value) {
      return Result.fail(new ApplicationError('USER_EXISTS', 'User with this email exists'));
    }

    // 3. Create aggregate
    const userResult = User.create({ id: UserId.create(), email: emailResult.value! });
    if (userResult.isFailure) {
      return Result.fail(new ApplicationError('USER_CREATION_FAILED', userResult.error.message));
    }

    // 4. Persist
    const saveResult = await this.userRepository.save(userResult.value!);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.error);
    }

    // 5. Publish events
    const events = userResult.value!.getDomainEvents();
    await this.eventBus.publishAll(events);
    userResult.value!.clearDomainEvents();

    // 6. Return DTO
    return Result.ok({ id: userResult.value!.id.value, email: input.email });
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate use-case --context=identity --name=CreateUser
```

**Generated files**:
- `src/core/identity/application/use-cases/CreateUserUseCase.ts` (extends BaseUseCase)
- `src/core/identity/application/dtos/CreateUserDto.ts` (with Zod schema)
- `src/core/identity/application/dtos/UserDto.ts` (output DTO)
- `tests/unit/core/identity/application/use-cases/CreateUserUseCase.core.spec.ts` (unit tests with mocks)
- `tests/integration/core/identity/application/use-cases/CreateUserUseCase.spec.ts` (integration with real repos)
- `tests/e2e/core/identity/CreateUser.e2e.spec.ts` (E2E via handler)

**Generated imports**:
```typescript
import { BaseUseCase } from '@shared/kernel/application/BaseUseCase';
import { Result } from '@shared/kernel/result';
import { ApplicationError } from '@shared/kernel/errors';
import { Logger } from '@shared/kernel/logger';
import { Tracer } from '@shared/kernel/tracer';
```

**Required follow-up edits**:
1. Add dependencies to constructor (repositories, event bus)
2. Implement `executeImpl()` orchestration logic
3. Define Zod schema in input DTO
4. Write unit tests for core logic
5. Write integration tests with real repos
6. Write E2E tests via handler
7. Update observability inventory with ⏳ entry

**Inventory update**: Adds entry to `OBSERVABILITY_INVENTORY.md`:
```markdown
### CreateUserUseCase (UseCase)
- **File**: src/core/identity/application/use-cases/CreateUserUseCase.ts
- **Type**: UseCase (DDD Primitive)
- **Role**: Orchestrates user creation
- **Status**: ⏳ (scaffolded, needs orchestration logic)
- **Tests**: Unit (core), Integration, E2E required
- **Observability**: ✅ Span, logs, metrics (auto via BaseUseCase)
```
