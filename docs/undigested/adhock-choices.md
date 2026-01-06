# Architectural Choices (Informal)

*To be formalized as ADRs later*

## First-Order (Explicit) Choices

### Nx as Control Plane
- **Choice**: Nx workspace for all tooling, generators, executors, task orchestration
- **Rationale**: Team is developer + LLMs; Nx generators create consistent boilerplate; affected commands + caching for enterprise scale
- **Implications**: All commands via `nx generate @local/{plugin}:{generator}` or `nx run {project}:{executor}`

### DDD Primitives as Foundation
- **Choice**: Domain-Driven Design primitives (Command, Query, Entity, ValueObject, AggregateRoot, UseCase, Handler, Repository)
- **Rationale**: Clear bounded contexts, pure domain logic, explicit dependencies, testable architecture
- **Implications**: Strict layer separation (domain → application → infrastructure → interface)

### Commands/Queries as Pure Data
- **Choice**: Commands and Queries are plain TypeScript classes with Zod validation, no business logic
- **Rationale**: Serializable across boundaries (HTTP/gRPC/CLI), validatable at edges, type-safe contracts
- **Implications**: All business logic in UseCases/DomainServices, dual tests (validation + serialization)

### TypeScript Monorepo
- **Choice**: Single TypeScript monorepo with module boundaries enforced by tooling
- **Rationale**: Shared types, atomic refactoring, consistent tooling
- **Implications**: Import boundary validation, context isolation via ESLint

### Result Pattern (No Exceptions for Domain Logic)
- **Choice**: All domain operations return `Result<T, Error>` instead of throwing
- **Rationale**: Explicit error handling, composable operations, type-safe error paths
- **Implications**: No try/catch in domain layer, errors as values

## Second-Order (Implicit) Choices

### Generator-First Development
- **Implication**: Manual primitive creation is documented but discouraged
- **Because**: If we chose Nx + DDD primitives, we need consistent structure → generators become the interface
- **Impact**: 80% reduction in boilerplate, consistent patterns, onboarding via tooling

### ADR Management as Code
- **Implication**: ADRs managed via Nx generators/executors, not manual markdown
- **Because**: If we chose Nx as control plane, ADRs should follow same pattern
- **Impact**: Validated metadata, automated status transitions, discoverable via CLI

### Validation as Executor
- **Implication**: All CI/CD checks are Nx executors, not bash scripts
- **Because**: If we chose Nx workspace, validation should use Nx task orchestration + affected commands
- **Impact**: Incremental validation, computation caching, parallel execution

### ESLint as Architecture Enforcement
- **Implication**: 30+ custom ESLint rules for layer boundaries, primitive contracts, import patterns
- **Because**: If we chose DDD primitives + monorepo, need automated enforcement at write-time
- **Impact**: IDE feedback loops, pre-commit guards, architecture as code

### Dual Test Strategy for Primitives
- **Implication**: Commands/Queries get both validation.spec.ts and serialization.spec.ts
- **Because**: If we chose pure data primitives, need to validate both shape and cross-boundary behavior
- **Impact**: Higher test coverage, explicit contract testing

### Observability by Convention
- **Implication**: All primitives get structured logging, tracing, metrics via shared kernel
- **Because**: If we chose enterprise-scale modulith, need visibility into all operations
- **Impact**: Zero-instrumentation observability, mandatory telemetry inventory

### Repository Pattern with Port/Adapter
- **Implication**: All repositories are domain ports (interfaces) with infrastructure adapters (implementations)
- **Because**: If we chose DDD + layer separation, persistence must be abstracted
- **Impact**: Technology-agnostic domain, swappable backends, testable via mocks

### Factory Pattern for Complex Construction
- **Implication**: Entities/Aggregates with invariants require factories
- **Because**: If we chose pure domain logic, construction rules belong in domain
- **Impact**: Consistent instantiation, validated state, no invalid objects

### Event-Driven State Changes
- **Implication**: All state mutations emit DomainEvents
- **Because**: If we chose observability + modulith, need cross-context communication
- **Impact**: Audit trails, eventual consistency, decoupled modules

### Secrets as Injectable Configuration
- **Implication**: All secrets via environment variables + Zod schemas, injected at application layer
- **Because**: If we chose TypeScript + validation patterns, config should be type-safe + validated
- **Impact**: Fail-fast on misconfiguration, no secrets in code, 12-factor compliance

## Meta Choices

### Documentation-First Tooling
- **Choice**: Build comprehensive docs before implementing tools
- **Rationale**: LLMs work better with specs, human review easier in markdown
- **Impact**: 4000+ lines of tooling docs before single generator written

### Nx Plugins Over Standalone Scripts
- **Choice**: Three Nx plugins (@local/ddd, @local/adr, @local/eslint) instead of independent tools
- **Rationale**: Single control plane, shared context, consistent UX
- **Impact**: More upfront complexity, better long-term coherence

### Manual Workflow Documented
- **Choice**: quick-start.md shows manual primitive creation as fallback
- **Rationale**: Generators may have bugs, learning requires understanding internals
- **Impact**: Team can work during tool development, docs teach "why" not just "how"
