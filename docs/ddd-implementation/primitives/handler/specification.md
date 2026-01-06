# Handler: Definition, Base Types, Enforcement

## 1. What It Is (in this repo)

**Definition**: The interface boundary adapter that translates external protocols (HTTP, gRPC, CLI, message queue) into use case invocations and translates results back to protocol-specific responses.

**When to use**:
- HTTP REST endpoint
- gRPC service method
- CLI command
- Message queue consumer
- GraphQL resolver

**When NOT to use**:
- Business logic (put in use case)
- Direct database access (use repository via use case)
- Domain rules (put in entity/aggregate)

**Required base/interface**: `BaseHandler` (HTTP) or protocol-specific base

**Allowed dependencies**:
- Use Cases (orchestration entry point)
- DTOs (request/response mapping)
- Result, Logger, Tracer
- Validation schemas (Zod)
- Protocol-specific libraries (Express, Fastify, gRPC)

**Forbidden dependencies**:
- Repositories directly (use via use case)
- Domain entities directly (use via use case + DTOs)
- Infrastructure adapters (DB clients, external APIs)

## 2. Required Shape & Files

**Path**: `src/core/{context}/interface/handlers/{HandlerName}.ts`

**Must extend**: `BaseHandler` or protocol-specific base (e.g., `BaseHttpHandler`, `BaseGrpcHandler`)

**Required exports**:
```typescript
export class CreateUserHandler extends BaseHttpHandler {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    logger: Logger,
    tracer: Tracer
  ) {
    super(logger, tracer);
  }

  async handle(req: Request, res: Response): Promise<void> {
    return this.withSpan('CreateUserHandler.handle', async (span) => {
      // 1. Extract + validate input
      // 2. Invoke use case
      // 3. Map Result to HTTP response
    });
  }
}
```

**Observability hook**: **Yes** (interface boundary).
- Span per request (`withSpan()` from BaseHandler)
- Log on entry/success/failure
- Metrics for latency, status codes, errors
- Correlation ID propagation

**Source map for tests**:
- **Unit**: `tests/unit/core/{context}/interface/handlers/{HandlerName}.spec.ts`
  - Core logic: `{HandlerName}.core.spec.ts` (request validation, Result mapping, error codes)
- **Integration**: `tests/integration/core/{context}/interface/handlers/{HandlerName}.spec.ts` (with real use case, trace/log verification)
- **E2E**: `tests/e2e/core/{context}/{HandlerName}.e2e.spec.ts` (real HTTP/gRPC request)

## 3. Invariants & Guards

**Must**:
- Extend `BaseHandler` or protocol-specific base
- Use `withSpan()` for request handling
- Validate request payload (Zod schema)
- Invoke use case (never implement business logic)
- Map `Result` to protocol response (200/201 for success, 400/404/500 for errors)
- Set correlation ID in span context
- Never throw unhandled exceptions (catch and return 500)

**Never**:
- Implement business logic (delegate to use case)
- Access repositories directly (use via use case)
- Leak internal errors to client (sanitize error messages)
- Return naked Promise (always handle errors)

**Validation rules**:
- Zod schema for request body/params
- Return 400 Bad Request for validation errors
- Log validation failures

**Span/log requirements**:
- Span: `withSpan('{HandlerName}.handle', async (span) => { ... })`
- Log entry: `logger.info('Handling {operation}', { correlationId, userId })`
- Log success: `logger.info('{operation} succeeded', { correlationId, statusCode: 200 })`
- Log failure: `logger.error('{operation} failed', { correlationId, error, statusCode: 400 })`

## 4. Collaboration Rules

**Who can call it**:
- HTTP framework (Express, Fastify)
- gRPC server
- CLI runner
- Message queue consumer
- E2E tests

**What it may call**:
- Use Cases (application entry)
- Validation schemas (Zod)
- Logger, Tracer (observability)

**Allowed return types**:
- `Promise<void>` (HTTP response written to res object)
- Protocol-specific response types (gRPC response, CLI exit code)

## 5. Testing Requirements (enforced)

**Unit tests** (`{HandlerName}.core.spec.ts`):
- Request validation (reject invalid payloads)
- Result → Response mapping (200 for success, 400/404 for failures)
- Error code mapping (DomainError → 400, ApplicationError → 500)
- Mock use case (test handler logic, not use case)

**Integration tests** (`{HandlerName}.spec.ts`):
- Real use case invocation
- Span creation (verify trace context)
- Log output (entry/success/failure)
- Correlation ID propagation

**E2E tests** (`{HandlerName}.e2e.spec.ts`):
- Real HTTP/gRPC request
- Full request → response flow
- Database state verification
- End-to-end tracing

**Fixtures/factories location**: `tests/fixtures/handlers/{HandlerName}Factory.ts`

## 6. Observability & Errors

**Logging/Tracing**: **Yes** (interface boundary).
- **Span**: One span per request, includes correlation ID, HTTP method, path
- **Log entry**: `logger.info('Handling POST /users', { correlationId })`
- **Log success**: `logger.info('POST /users succeeded', { correlationId, statusCode: 201 })`
- **Log failure**: `logger.error('POST /users failed', { correlationId, error, statusCode: 400 })`
- **Metrics**: Latency histogram, status code counters, error rate

**Error policy**:
- Catch all exceptions
- Map `Result.fail()` to appropriate HTTP status:
  - DomainError/ValidationError → 400 Bad Request
  - NotFoundError → 404 Not Found
  - ApplicationError → 500 Internal Server Error
- Sanitize error messages (don't leak stack traces)
- Log full error details internally

## 7. Lifecycle & Evolution

**Creation**: Define handler extending BaseHandler, inject use case

**Modification**: Add new endpoints/methods, update request/response schemas

**Deprecation path**:
- Mark handler with `@deprecated`
- Return `410 Gone` for deprecated endpoints
- Create new handler/version (e.g., `/v2/users`)
- Keep old handler for 2 sprints

## 8. Anti-Patterns (repo-specific)

- **Business logic in handler**: Handler contains orchestration (move to use case)
- **Direct repository access**: Handler calls repository directly (use via use case)
- **Unhandled exceptions**: Handler throws without catch (always catch and return 500)
- **Leaking errors**: Returning stack traces to client (sanitize errors)
- **Missing validation**: Not validating request payload (always validate)
- **No observability**: Missing spans, logs, or metrics

## 9. Canonical Example (repo style, ≤40 lines)

```typescript
// src/core/identity/interface/handlers/CreateUserHandler.ts
import { BaseHttpHandler } from '@shared/kernel/interface/BaseHttpHandler';
import { Logger } from '@shared/kernel/logger';
import { Tracer } from '@shared/kernel/tracer';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { Request, Response } from 'express';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export class CreateUserHandler extends BaseHttpHandler {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    logger: Logger,
    tracer: Tracer
  ) {
    super(logger, tracer);
  }

  async handle(req: Request, res: Response): Promise<void> {
    return this.withSpan('CreateUserHandler.handle', async (span) => {
      this.logger.info('Handling POST /users', { correlationId: span.context().traceId });

      // 1. Validate
      const validation = CreateUserSchema.safeParse(req.body);
      if (!validation.success) {
        this.logger.error('Validation failed', { errors: validation.error });
        res.status(400).json({ error: 'VALIDATION_ERROR', details: validation.error });
        return;
      }

      // 2. Invoke use case
      const result = await this.createUserUseCase.execute(validation.data);

      // 3. Map Result → Response
      if (result.isSuccess) {
        this.logger.info('POST /users succeeded', { userId: result.value!.id });
        res.status(201).json(result.value);
      } else {
        this.logger.error('POST /users failed', { error: result.error });
        res.status(400).json({ error: result.error.code, message: result.error.message });
      }
    });
  }
}
```

## 10. Scaffolding Contract

**Generator command**:
```bash
nx generate handler --context=identity --name=CreateUser --protocol=http
```

**Generated files**:
- `src/core/identity/interface/handlers/CreateUserHandler.ts` (extends BaseHttpHandler)
- `tests/unit/core/identity/interface/handlers/CreateUserHandler.core.spec.ts` (unit tests)
- `tests/integration/core/identity/interface/handlers/CreateUserHandler.spec.ts` (integration)
- `tests/e2e/core/identity/CreateUser.e2e.spec.ts` (E2E)

**Generated imports**:
```typescript
import { BaseHttpHandler } from '@shared/kernel/interface/BaseHttpHandler';
import { Logger } from '@shared/kernel/logger';
import { Tracer } from '@shared/kernel/tracer';
import { z } from 'zod';
```

**Required follow-up edits**:
1. Inject use case in constructor
2. Define Zod request schema
3. Implement `handle()` with validation + use case call
4. Map Result to HTTP response
5. Write unit/integration/E2E tests
6. Register handler in HTTP router
7. Update observability inventory

**Inventory update**:
```markdown
### CreateUserHandler (Handler)
- **File**: src/core/identity/interface/handlers/CreateUserHandler.ts
- **Type**: Handler (DDD Primitive)
- **Role**: HTTP endpoint for user creation
- **Status**: ⏳ (scaffolded, needs validation + use case wiring)
- **Tests**: Unit, Integration, E2E required
- **Observability**: ✅ Span, logs, metrics (auto via BaseHandler)
```
