# Layer 1: Application

Your TypeScript/Node.js domain logic, organized by bounded contexts using DDD principles.

> **Note:** This layer uses DDD primitives (Commands, Queries, Entities, Use Cases, Handlers, Repositories, Value Objects, Domain Events). For specs, enforcement rules, and generators, see the [Primitives Quick Reference](../../ddd-implementation/README.md#primitives-quick-reference) in the DDD framework docs.

## Overview

**What you build:**
- TypeScript/Node.js domain logic
- Modular monolith with bounded contexts
- DDD: entities, value objects, policies, domain events
- Application: use cases, ports, DTOs
- Interface: HTTP handlers, validators, presenters

**Observability rules:**
- ✅ **Must:** Use Logger interface (not console.log)
- ✅ **Must:** Use Clock abstraction (testable timestamps)
- ✅ **Must:** Return Result<T, E> (no uncaught throws)
- ✅ **Must:** Emit DomainEvents for observable boundaries
- ✅ **Must:** Add span attributes in handlers (userId, email, etc.)
- ❌ **Never:** Magic strings in business logic (use enums, branded types)
- ❌ **Never:** Undocumented context imports (bounded contexts isolated)

**Enforced by:**
- TypeScript strict mode (type safety)
- ESLint boundaries rule (no cross-layer imports)
- Tests (unit + integration; 80%+ coverage)
- Inventory verification workflows

### Artifact Structure

The Application layer uses standard DDD primitives to organize code:

| Primitive | Location | Purpose | Spec |
|-----------|----------|---------|------|
| **Command** | `application/commands/` | Immutable request to mutate state | [spec](../../PRIMITIVES_MANIFEST.md#1-command) |
| **Query** | `application/queries/` | Immutable request to read data | [spec](../../PRIMITIVES_MANIFEST.md#2-query) |
| **Entity** | `domain/entities/` | Mutable aggregate root with invariants | [spec](../../PRIMITIVES_MANIFEST.md#3-entity-aggregate-root) |
| **ValueObject** | `domain/value-objects/` | Immutable concept with validation | [spec](../../PRIMITIVES_MANIFEST.md#4-value-object) |
| **UseCase** | `application/use-cases/` | Orchestrator of business logic | [spec](../../PRIMITIVES_MANIFEST.md#5-use-case) |
| **Handler** | `interface/handlers/` | Transport adapter (HTTP/gRPC/CLI) | [spec](../../PRIMITIVES_MANIFEST.md#6-handler-httpgrpccli) |
| **Repository** | `application/ports/` + `infrastructure/adapters/` | Data access abstraction | [spec](../../PRIMITIVES_MANIFEST.md#7-repository-port--adapter) |
| **DomainEvent** | `domain/events/` | Immutable record of what happened | [spec](../../PRIMITIVES_MANIFEST.md#8-domain-event) |

For each primitive, [ddd-implementation/README.md](../../ddd-implementation/README.md#primitives-quick-reference) provides:
- Full specification and enforcement rules
- Generator commands to scaffold
- Instance-level spec/enforcement templates to customize per artifact

---


### Example Trace Flow
```
POST /users (traceid: abc123)
  └─ HTTP handler span: "create_user_handler"
      └─ Use case span: "create_user_use_case"
          ├─ Email validation span: "validate_email"
          ├─ Repository query span: "find_user_by_email"
          │   ├─ attribute: email=test@example.com
          │   └─ metric: db_query_duration_ms
          └─ DomainEvent: UserCreated emitted
              └─ event logged with traceId
```

## Create New

When scaffolding a new bounded context, use generators for each primitive:

```bash
# Generate a command
nx generate @local/ddd:command --context=orders --name=PlaceOrder --result=Order

# Generate a query
nx generate @local/ddd:query --context=orders --name=GetOrdersByCustomer --result="Order[]"

# Generate an entity (aggregate root)
nx generate @local/ddd:entity --context=orders --name=Order --idType=OrderId

# Generate a use case
nx generate @local/ddd:use-case --context=orders --name=PlaceOrder

# Generate a handler (HTTP)
nx generate @local/ddd:handler --context=orders --name=PlaceOrder --protocol=http

# Generate a repository
nx generate @local/ddd:repository --context=orders --aggregate=Order
```

Each generator creates:
- The main artifact (Command, Entity, UseCase, etc.)
- Required test stubs (validation, serialization, integration)
- **Instance spec file** ({Name}.specification.md) — customize what makes this artifact unique
- **Instance enforcement file** ({Name}.enforcement.md) — document what must not change

See [ddd-implementation/README.md](../../ddd-implementation/README.md#primitives-quick-reference) for generator details and specs per primitive.

---

## Manual Scaffolding Reference

If not using generators, here's the directory structure:
```bash
src/core/orders/
├── domain/
│   ├── entities/
│   │   ├── Order.ts
│   │   └── index.ts
│   ├── valueObjects/
│   │   ├── OrderId.ts
│   │   ├── OrderStatus.ts
│   │   └── index.ts
│   ├── events/
│   │   ├── OrderCreated.ts
│   │   └── index.ts
│   └── policies/
│       ├── OrderValidationPolicy.ts
│       └── index.ts
├── application/
│   ├── use-cases/
│   │   ├── CreateOrderUseCase.ts
│   │   └── index.ts
│   ├── ports/
│   │   ├── OrderRepository.ts
│   │   └── index.ts
│   ├── dtos/
│   │   ├── CreateOrderDto.ts
│   │   └── index.ts
│   └── index.ts
├── infrastructure/
│   ├── adapters/
│   │   ├── PostgresOrderRepository.ts
│   │   └── index.ts
│   ├── mappers/
│   │   ├── OrderMapper.ts
│   │   └── index.ts
│   └── index.ts
└── interface/
    ├── handlers/
    │   ├── CreateOrderHandler.ts
    │   └── index.ts
    ├── validators/
    │   ├── CreateOrderValidator.ts
    │   └── index.ts
    └── index.ts
```

## Development Practices

1. **Type Safety First**: Always use TypeScript strict mode; enable strict property initialization and no implicit any.

2. **Domain-Driven Design**:
   - Keep domain entities immutable; use value objects for identity and concepts
   - Business rules live in domain policies, not use cases
   - Use branded types (UserId, Email) to prevent invalid state

3. **Ports & Adapters**:
   - Define port interfaces in application layer before implementing adapters
   - Keep repositories focused on single bounded context (no cross-context queries)
   - Use mappers to translate between domain and infrastructure

4. **Logger & Clock Injection**:
   - Never use `console.log()` directly; inject Logger interface
   - Never use `new Date()` or `Date.now()` directly; inject Clock abstraction
   - This enables deterministic testing and centralized trace context

5. **Result Monad Pattern**:
   - Return `Result<T, E>` from use cases, never throw
   - Handle errors explicitly in handlers; log context (userId, email, etc.)
   - Let handlers decide HTTP status codes based on error type

6. **DomainEvent Emissions**:
   - Emit events only from domain entities (command completion)
   - Events trigger observable boundaries (traced separately)
   - Use event timestamps from Clock (not current time)

7. **Testing Strategy**:
   - Unit tests for domain entities, value objects, policies (pure, fast, no I/O)
   - Integration tests for use cases with in-memory ports
   - Verify trace attributes via Logger.info() calls

## Code Maintenance Practices

1. **ESLint Boundaries Enforcement**:
   - Configure rule to prevent imports across bounded contexts
   - Allow: `core/users → core/users/*` (same context)
   - Deny: `core/users → core/orders/*` (cross-context)
   - Exception: `core/* → shared/kernel/*` (shared utilities only)

2. **Dependency Inversion**:
   - Classes accept dependencies via constructor (never use static singletons)
   - Mock ports for testing (in-memory adapters)
   - Swap implementations for different environments

3. **Documentation**:
   - Add JSDoc to public APIs (ports, use cases, DTOs)
   - Link domain policies to business requirements
   - Update OBSERVABILITY_INVENTORY.md when adding new observable components

4. **Import Organization**:
   - Sort imports: external → workspace → relative
   - Group: types, values, then defaults
   - Use index.ts for clean re-exports

5. **Error Handling**:
   - Extend ApplicationError or DomainError (not Error)
   - Include error code, message, and recoverable flag
   - Do not log sensitive data (PII, passwords)

6. **Refactoring**:
   - Extract complex business logic to policies (testable, reusable)
   - Move cross-context concerns to shared/kernel
   - Run full test suite and verification before commit

## Operations

1. **Deployment Readiness**:
   - All use cases return Result types (no uncaught exceptions)
   - Handlers extract request context (userId, traceId) for span attributes
   - Health check verifies bounded context health

2. **Monitoring**:
   - Traces track use case duration and success/failure
   - Logs include operation name, user context, error details
   - Metrics count by success/error status

3. **Incident Response**:
   - Query logs by context name and operation (e.g., `service=modulith-dx, context=orders, operation=CreateOrder`)
   - Correlate with database query spans to find slow operations
   - Check domain event emissions for business logic issues

4. **Scaling**:
   - No state stored in memory (stateless use cases)
   - Use outbox pattern if publishing events to queues
   - Cache repositories can be swapped for distributed cache
