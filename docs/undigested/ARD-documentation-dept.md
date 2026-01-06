Core Architectural Principles (High Priority)
ADR-001: Domain Layer Pure (No Observability)

Decision: Domain objects (Entity, ValueObject, AggregateRoot, DomainEvent, Specification, DomainService, Factory) contain ZERO observability code
Context: Testability, purity, framework independence
Alternative rejected: Logging/tracing everywhere for "better visibility"
ADR-003: Result Type Over Exceptions for Domain Logic

Decision: All domain/application failures return Result<T, Error>, never throw
Context: Type-safe error handling, explicit error flows
Alternative rejected: Traditional try/catch exception handling
ADR-004: Repository Port-Adapter Split

Decision: Port (interface) in application/ports/, Adapter (implementation) in infrastructure/adapters/
Context: Hexagonal architecture, dependency inversion
Alternative rejected: Repository implementations in domain layer
ADR-005: Observability Only at Architectural Boundaries

Decision: UseCase, Handler, Repository adapters have spans/logs/metrics; domain layer doesn't
Context: Separation of concerns, performance, testability
Alternative rejected: Observability throughout all layers
ADR-006: Automation-First Enforcement (60%+ Coverage)

Decision: Target 60-70% automation via ESLint + TypeScript + Generators + CI
Context: Scale enforcement, reduce manual review burden
Alternative rejected: Manual code review only
Structural Decisions (High Priority)
ADR-007: Context-First Directory Structure

Decision: src/core/{context}/domain|application|infrastructure|interface/
Context: Bounded context isolation, team autonomy
Alternative rejected: Layer-first (src/domain/{context}/, src/application/{context}/)
ADR-008: Single Primitive Per File

Decision: One Entity/ValueObject/Command/etc per .ts file
Context: Generator simplicity, grep-ability, import clarity
Alternative rejected: Multiple related primitives in one file
ADR-009: Brand Types for Entity IDs

Decision: IDs use branded types: UserId extends Brand<string, 'UserId'>
Context: Type safety (can't pass OrderId where UserId expected)
Alternative rejected: Plain strings or UUIDs
Pattern Decisions (Medium Priority)
ADR-010: Static Factories for Domain Object Creation

Decision: All domain objects have static create() factory returning Result<T, ValidationError>
Context: Encapsulate validation, hide constructor complexity
Alternative rejected: Public constructors with validation
ADR-011: Immutability in Domain Layer

Decision: All domain fields are readonly, mutation via new instances
Context: Predictability, event sourcing compatibility, debugging
Alternative rejected: Mutable domain objects with setters
ADR-012: Zod for Validation Schemas

Decision: Use Zod for all validation (commands, queries, value objects)
Context: Type inference, composability, runtime safety
Alternative rejected: Joi, Yup, manual validation functions
ADR-013: Event Collection in Aggregates (Not Dispatch)

Decision: Aggregates collect events in array, don't dispatch directly
Context: Transaction boundary control, testing, event ordering
Alternative rejected: Immediate event dispatch from aggregates
Testing Strategy (Medium Priority)
ADR-014: Three-Tier Testing Strategy

Decision: Unit (domain/application), Integration (infrastructure), E2E (full flows)
Context: Fast feedback, isolation, confidence
Test coverage targets per layer
ADR-015: Separate Validation and Serialization Test Files

Decision: {Name}.validation.spec.ts + {Name}.serialization.spec.ts for commands/queries
Context: Clear test organization, easier to find missing coverage
Alternative rejected: Single test file with mixed concerns
Development Workflow (Medium Priority)
ADR-016: Generator-First Development

Decision: Use nx generate {primitive} for all new code, not manual file creation
Context: Consistency, boilerplate reduction, enforcement
Alternative rejected: Manual scaffolding with copy/paste
ADR-017: Mapper as Cross-Layer Utility (Not Domain)

Decision: Mappers live in application/ (for DTOs) or infrastructure/ (for persistence), never domain/
Context: Domain stays pure, mappers handle boundary concerns
Alternative rejected: Mappers in domain layer
Observability & Operations (Lower Priority but Important)
ADR-018: CommandId for Idempotency

Decision: All commands have unique commandId for deduplication
Context: Distributed systems, at-least-once delivery, prevent duplicate charges
Alternative rejected: No idempotency tracking, rely on DB constraints
ADR-019: CorrelationId for Distributed Tracing

Decision: Commands have correlationId, flows through spans
Context: Multi-service tracing, debugging distributed flows
Alternative rejected: Separate trace context object
ADR-020: No Logger/Tracer Injection in Domain

Decision: Domain objects never receive Logger or Tracer dependencies
Context: Keep domain pure, prevent observability coupling
Alternative rejected: Logger injected everywhere for debugging
ADR-021: Base Classes Provide Observability Hooks

Decision: BaseUseCase, BaseHandler, BaseRepositoryAdapter wrap execution in spans
Context: Consistent observability without manual instrumentation
Alternative rejected: Manual span creation in every use case