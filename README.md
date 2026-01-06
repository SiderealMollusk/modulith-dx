# Modulith DX - TypeScript Modular Monolith

Observability-ready TypeScript modular monolith with DDD/TDD structure, strict linting, and full telemetry stack.

## Architecture

This is a **modular monolith** structured around Domain-Driven Design principles with separate bounded contexts that can eventually be extracted into microservices if needed.

### Project Structure

```
modulith-dx/
├── src/
│   ├── core/                     # Bounded contexts (business domains)
│   │   └── example/              # Example bounded context
│   │       ├── domain/           # Core business logic (entities, value objects, policies)
│   │       │   ├── entities/     # Domain entities (User, etc.)
│   │       │   ├── valueObjects/ # Value objects (Email, UserId, etc.)
│   │       │   ├── policies/     # Domain policies (PasswordPolicy, etc.)
│   │       │   └── events/       # Domain events (UserCreated, etc.)
│   │       ├── application/      # Use cases and application services
│   │       │   ├── ports/        # Interfaces for infrastructure (repositories, etc.)
│   │       │   ├── use-cases/    # Business use cases (CreateUser, etc.)
│   │       │   └── dtos/         # Data transfer objects
│   │       ├── infrastructure/   # Technical implementations
│   │       │   ├── adapters/     # External service adapters
│   │       │   ├── repositories/ # Data persistence implementations
│   │       │   └── mappers/      # Domain ↔ DTO mappers
│   │       └── interface/        # Entry points (HTTP, CLI, etc.)
│   │           ├── handlers/     # Request handlers
│   │           ├── validators/   # Input validation
│   │           └── presenters/   # Response formatting
│   └── shared/                   # Cross-cutting concerns
│       ├── kernel/               # Core abstractions used across all contexts
│       │   ├── errors/           # Base error classes
│       │   ├── id/               # ID generation and branded types
│       │   ├── result/           # Result/Either monad for error handling
│       │   ├── time/             # Clock abstraction
│       │   ├── logger/           # Logger interface
│       │   ├── events/           # Event bus abstraction
│       │   └── bus/              # Command/Query bus
│       └── utils/                # Utility functions
│           ├── string/
│           └── collections/
├── tests/
│   ├── unit/                     # Fast unit tests (domain, application)
│   ├── integration/              # Integration tests (infrastructure)
│   ├── e2e/                      # End-to-end tests
│   └── contracts/                # Contract tests for external services
├── config/                       # Configuration schemas and defaults
├── scripts/                      # Utility scripts
└── ops/                          # Infrastructure (docker-compose, etc.)
```

## Key Design Principles

### 1. Domain-Driven Design (DDD)

- **Bounded Contexts**: Each business domain lives in `src/core/<context>/`
- **Layered Architecture**:
  - **Domain**: Pure business logic, no dependencies on infrastructure
  - **Application**: Use cases orchestrating domain logic
  - **Infrastructure**: Technical implementations (DB, HTTP clients, etc.)
  - **Interface**: Controllers, handlers, validators

### 2. Type-Driven Development (TDD)

- **Branded Types**: Use phantom types for IDs (`UserId`, `OrderId`) to prevent mixing
- **Result Type**: No thrown exceptions in business logic; use `Result<T, E>` for explicit error handling
- **Strict TypeScript**: All strict flags enabled, exhaustive type checking

### 3. Dependency Inversion

- **Ports & Adapters**: Infrastructure depends on application interfaces (ports)
- Domain and application layers are **dependency-free** (no imports from infrastructure)
- Testable without mocks via in-memory adapters

### 4. Observability-First

- OpenTelemetry SDK integrated for traces, metrics, logs
- Structured logging with trace context injection
- Prometheus metrics, Loki logs, Tempo traces → Grafana dashboards

### 5. Testing Pyramid

- **Unit tests**: Fast, isolated domain/application logic
- **Integration tests**: Adapters with real implementations
- **E2E tests**: Full system with telemetry assertions

## Layer Boundaries

```
┌─────────────────────────────────────────┐
│          Interface Layer                │
│   (HTTP handlers, CLI, validators)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Application Layer                 │
│   (Use cases, ports, DTOs)              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Domain Layer                   │
│   (Entities, value objects, policies)   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│   (Adapters, repositories, mappers)     │
└─────────────────────────────────────────┘
         implements ▲
                    │
         ┌──────────┴──────────┐
         │  Application Ports  │
         └─────────────────────┘
```

**Rules**:
- Domain can only import from `@shared/kernel`
- Application can import domain + `@shared/kernel`
- Infrastructure can import application + domain + `@shared`
- Interface can import all layers

## Shared Kernel

The shared kernel (`src/shared/kernel/`) provides common abstractions:

- **Errors**: `DomainError`, `ApplicationError`, `ValidationError`
- **Result**: Monadic error handling (`Success<T>`, `Failure<E>`)
- **ID**: Branded type IDs with UUID generation (`UserId`, `OrderId`, etc.)
- **Clock**: Time abstraction for testability (`SystemClock`, `FixedClock`)
- **Logger**: Structured logging interface
- **Events**: `DomainEvent`, `EventBus` for event-driven architecture
- **Bus**: `CommandBus`, `QueryBus` for CQRS patterns

## Example: User Bounded Context

See `src/core/example/` for a complete bounded context implementation:

1. **Domain**: `User` entity with `Email` value object, `PasswordPolicy`
2. **Application**: `CreateUserUseCase` with `UserRepository` port
3. **Infrastructure**: `InMemoryUserRepository` adapter
4. **Interface**: `CreateUserHandler`
5. **Tests**: Unit tests for domain/application, integration tests for infrastructure

## Adding a New Bounded Context

```bash
# Create structure
mkdir -p src/core/{context-name}/{domain,application,infrastructure,interface}

# Add domain entities
touch src/core/{context-name}/domain/entities/MyEntity.ts

# Add use case
touch src/core/{context-name}/application/use-cases/MyUseCase.ts

# Add repository port
touch src/core/{context-name}/application/ports/MyRepository.ts

# Add adapter
touch src/core/{context-name}/infrastructure/adapters/InMemoryMyRepository.ts
```

## Testing

```bash
# Unit tests (domain + application)
pnpm test:unit

# Integration tests (infrastructure)
pnpm test:integration

# All tests with coverage
pnpm test
```

## Type Safety Examples

### Branded IDs
```typescript
import { createId, type UserId, type OrderId } from '@shared/kernel/id';

const userId: UserId = createId('UserId');
const orderId: OrderId = createId('OrderId');

// ✅ Type safe - won't compile
// const wrong: UserId = orderId;
```

### Result Type
```typescript
import { success, failure, type Result } from '@shared/kernel/result';

const result: Result<User, InvalidEmailError> = createEmail(input);

if (result.isSuccess) {
  const user = result.value; // Type: User
} else {
  const error = result.error; // Type: InvalidEmailError
}
```

## Next Steps

1. ✅ DDD structure with shared kernel
2. ✅ Example bounded context (User)
3. ✅ Test files (unit, integration)
4. ⏳ TypeScript config with path aliases
5. ⏳ ESLint + Biome with strict rules
6. ⏳ OpenTelemetry SDK integration
7. ⏳ Docker Compose observability stack

See [planning/phase_0/punchlist.md](planning/phase_0/punchlist.md) for detailed implementation checklist.
