# Primitives Manifest

This document maps every DDD primitive to its specification, enforcement contract, generator, and instance templates. Use this to navigate between conceptual definition, scaffolding, and concrete implementation.

**Key:** All primitives live in **Layer 1 (Application)** architecture. Specs define *what*; enforcement defines *guardrails*; generators scaffold *how*; instance templates guide *customization per instance*.

---

## Application Layer Primitives

### 1. Command

**Purpose:** Immutable, serializable request to mutate state. First-class primitive with versioning, idempotency, and distributed tracing support.

| Resource | Link | Notes |
|----------|------|-------|
| **Specification** | [docs/ddd-implementation/primitives/command/specification.md](ddd-implementation/primitives/command/specification.md) | What, shape, invariants, serialization |
| **Enforcement** | [docs/ddd-implementation/primitives/command/enforcement.md](ddd-implementation/primitives/command/enforcement.md) | Automation, ESLint rules, generator contract, testing requirements |
| **Generator Doc** | [docs/tooling/generators/command.md](tooling/generators/command.md) | How to use `nx generate @local/ddd:command` |
| **Instance Spec Template** | Embedded in [generator doc](tooling/generators/command.md#template-namespecificationmd-generate-alongside-the-command) | Fill in for each command: business intent, inputs, invariants, side effects |
| **Instance Enforcement Template** | Embedded in [generator doc](tooling/generators/command.md#template-nameenforcementmd-generate-alongside-the-command) | Fill in for each command: sensitivity, schema, impact map, tests |
| **Layer Location** | `src/core/{context}/application/commands/` | Next to use cases; receives commands from handlers |

---

### 2. Query

**Purpose:** Immutable, serializable request to read data. First-class primitive with cache key support and no side effects.

| Resource | Link | Notes |
|----------|------|-------|
| **Specification** | [docs/ddd-implementation/primitives/query/specification.md](ddd-implementation/primitives/query/specification.md) | What, shape, caching strategy, serialization |
| **Enforcement** | [docs/ddd-implementation/primitives/query/enforcement.md](ddd-implementation/primitives/query/enforcement.md) | Automation, ESLint rules, generator contract, testing requirements |
| **Generator Doc** | [docs/tooling/generators/query.md](tooling/generators/query.md) | How to use `nx generate @local/ddd:query` |
| **Instance Spec Template** | Embedded in [generator doc](tooling/generators/query.md#template-namespecificationmd-generate-alongside-the-query) | Fill in for each query: business question, inputs, cache strategy, consistency |
| **Instance Enforcement Template** | Embedded in [generator doc](tooling/generators/query.md#template-nameenforcementmd-generate-alongside-the-query) | Fill in for each query: sensitivity, caching rules, impact map, tests |
| **Layer Location** | `src/core/{context}/application/queries/` | Next to use cases; receives queries from handlers |

---

### 3. Entity (Aggregate Root)

**Purpose:** Mutable domain object with identity, invariants, and domain events. Boundary for transactional consistency.

| Resource | Link | Notes |
|----------|------|-------|
| **Specification** | [docs/ddd-implementation/primitives/entity/specification.md](ddd-implementation/primitives/entity/specification.md) | What, identity, invariants, lifecycle, events |
| **Enforcement** | [docs/ddd-implementation/primitives/entity/enforcement.md](ddd-implementation/primitives/entity/enforcement.md) | Automation, ESLint rules, generator contract, testing requirements |
| **Generator Doc** | [docs/tooling/generators/entity.md](tooling/generators/entity.md) | How to use `nx generate @local/ddd:entity` |
| **Instance Spec Template** | Embedded in [generator doc](tooling/generators/entity.md#template-namespecificationmd-generate-alongside-the-entity) | Fill in for each entity: business meaning, state shape, invariants, events |
| **Instance Enforcement Template** | Embedded in [generator doc](tooling/generators/entity.md#template-nameenforcementmd-generate-alongside-the-entity) | Fill in for each entity: sensitivity, aggregate rules, impact map, tests |
| **Layer Location** | `src/core/{context}/domain/entities/` | Pure domain logic; no logging/tracing; emits domain events |
| **Related** | [Aggregate Root spec](ddd-implementation/primitives/aggregate-root/specification.md) | Deeper dive into aggregate boundaries and consistency rules |

---

### 4. Value Object

**Purpose:** Immutable, structurally equal object representing a concept. No identity; validates on construction.

| Resource | Link | Notes |
|----------|------|-------|
| **Specification** | [docs/ddd-implementation/primitives/value-object/specification.md](ddd-implementation/primitives/value-object/specification.md) | What, validation, equality, immutability |
| **Enforcement** | [docs/ddd-implementation/primitives/value-object/enforcement.md](ddd-implementation/primitives/value-object/enforcement.md) | Automation, ESLint rules, generator contract, testing requirements |
| **Generator Doc** | [docs/tooling/generators/value-object.md](tooling/generators/value-object.md) | How to use `nx generate @local/ddd:value-object` |
| **Instance Spec Template** | Embedded in [generator doc](tooling/generators/value-object.md#template-namespecificationmd-generate-alongside-the-value-object) | Fill in for each VO: meaning, shape, validation rules, equality |
| **Instance Enforcement Template** | Embedded in [generator doc](tooling/generators/value-object.md#template-nameenforcementmd-generate-alongside-the-value-object) | Fill in for each VO: sensitivity, format constraints, impact map, tests |
| **Layer Location** | `src/core/{context}/domain/value-objects/` | Pure domain logic; used by entities and commands/queries |
| **Related** | [Brand IDs](ddd-implementation/primitives/entity/specification.md#identity) | Specialized value objects for typed IDs (UserId, OrderId) |

---

### 5. Use Case

**Purpose:** Orchestrator of business logic. Loads aggregates, invokes domain rules, saves changes, publishes events, returns DTOs.

| Resource | Link | Notes |
|----------|------|-------|
| **Specification** | [docs/ddd-implementation/primitives/use-case/specification.md](ddd-implementation/primitives/use-case/specification.md) | What, flow, invariants, error handling, events |
| **Enforcement** | [docs/ddd-implementation/primitives/use-case/enforcement.md](ddd-implementation/primitives/use-case/enforcement.md) | Automation, ESLint rules, generator contract, testing requirements |
| **Generator Doc** | [docs/tooling/generators/use-case.md](tooling/generators/use-case.md) | How to use `nx generate @local/ddd:use-case` |
| **Instance Spec Template** | Embedded in [generator doc](tooling/generators/use-case.md#template-namespecificationmd-generate-alongside-the-use-case) | Fill in for each UC: business goal, flow steps, rules, error handling |
| **Instance Enforcement Template** | Embedded in [generator doc](tooling/generators/use-case.md#template-nameenforcementmd-generate-alongside-the-use-case) | Fill in for each UC: sensitivity, contract deltas, impact map, tests |
| **Layer Location** | `src/core/{context}/application/use-cases/` | Application layer; depends on ports + services; called by handlers |
| **Related** | [DTO spec](ddd-implementation/primitives/query/specification.md#output-dtos) | Use cases return DTOs, not domain entities |

---

### 6. Handler (HTTP/gRPC/CLI)

**Purpose:** Transport adapter. Validates requests, invokes use cases/queries, maps results to protocol responses, manages observability.

| Resource | Link | Notes |
|----------|------|-------|
| **Specification** | [docs/ddd-implementation/primitives/handler/specification.md](ddd-implementation/primitives/handler/specification.md) | What, protocols, validation, error mapping, observability |
| **Enforcement** | [docs/ddd-implementation/primitives/handler/enforcement.md](ddd-implementation/primitives/handler/enforcement.md) | Automation, ESLint rules, generator contract, testing requirements |
| **Generator Doc** | [docs/tooling/generators/handler.md](tooling/generators/handler.md) | How to use `nx generate @local/ddd:handler --protocol={http\|grpc\|cli}` |
| **Instance Spec Template** | Embedded in [generator doc](tooling/generators/handler.md#template-namespecificationmd-generate-alongside-the-handler) | Fill in for each handler: purpose, inputs, behavior, mappings, observability |
| **Instance Enforcement Template** | Embedded in [generator doc](tooling/generators/handler.md#template-nameenforcementmd-generate-alongside-the-handler) | Fill in for each handler: sensitivity, required shapes, impact map, tests |
| **Layer Location** | `src/core/{context}/interface/handlers/` | Interface layer; entry point for requests; extracts tracing context |

---

### 7. Repository (Port + Adapter)

**Purpose:** Data access abstraction. Port (interface) in application; adapters (implementations) in infrastructure.

| Resource | Link | Notes |
|----------|------|-------|
| **Specification** | [docs/ddd-implementation/primitives/repository/specification.md](ddd-implementation/primitives/repository/specification.md) | What, ports, adapters, consistency, transactions, events |
| **Enforcement** | [docs/ddd-implementation/primitives/repository/enforcement.md](ddd-implementation/primitives/repository/enforcement.md) | Automation, ESLint rules, generator contract, testing requirements |
| **Generator Doc** | [docs/tooling/generators/repository.md](tooling/generators/repository.md) | How to use `nx generate @local/ddd:repository --aggregate={name}` |
| **Instance Spec Template** | Embedded in [generator doc](tooling/generators/repository.md#template-namespecificationmd-generate-alongside-the-repository) | Fill in for each repo: aggregate scope, port shape, adapters, consistency |
| **Instance Enforcement Template** | Embedded in [generator doc](tooling/generators/repository.md#template-nameenforcementmd-generate-alongside-the-repository) | Fill in for each repo: sensitivity, contract, adapters, impact map, tests |
| **Port Location** | `src/core/{context}/application/ports/` | Application layer; interface only; no implementation |
| **Adapter Location** | `src/core/{context}/infrastructure/adapters/` | Infrastructure layer; concrete implementations (in-memory, Postgres, etc.) |

---

### 8. Domain Event

**Purpose:** Immutable, versionable record of something that happened. Emitted by entities; consumed by policies and listeners.

| Resource | Link | Notes |
|----------|------|-------|
| **Specification** | [docs/ddd-implementation/primitives/domain-event/specification.md](ddd-implementation/primitives/domain-event/specification.md) | What, shape, versioning, serialization, publishing |
| **Enforcement** | [docs/ddd-implementation/primitives/domain-event/enforcement.md](ddd-implementation/primitives/domain-event/enforcement.md) | Automation, ESLint rules, generator contract, testing requirements |
| **Generator Doc** | [docs/tooling/generators/domain-event.md](tooling/generators/domain-event.md) (planned) | How to use `nx generate @local/ddd:domain-event` |
| **Instance Spec Template** | Planned in generator doc | Fill in for each event: business meaning, payload, consumers |
| **Instance Enforcement Template** | Planned in generator doc | Fill in for each event: sensitivity, versioning, impact map, tests |
| **Layer Location** | `src/core/{context}/domain/events/` | Domain layer; emitted only by entities; immutable |
| **Related** | [Policy spec](ddd-implementation/primitives/domain-service/specification.md) | Policies and domain services consume events |

---

### 9. Policy & Domain Service (Planned)

**Purpose:** Encapsulate business rules that don't belong to a single entity. Consumed by use cases; may emit events.

| Resource | Link | Notes |
|----------|------|-------|
| **Specification** | [docs/ddd-implementation/primitives/domain-service/specification.md](ddd-implementation/primitives/domain-service/specification.md) | What, scope, statelessness, rules |
| **Enforcement** | [docs/ddd-implementation/primitives/domain-service/enforcement.md](ddd-implementation/primitives/domain-service/enforcement.md) (planned) | Automation, ESLint rules, generator contract |
| **Generator Doc** | [docs/tooling/generators/domain-service.md](tooling/generators/domain-service.md) (planned) | How to use `nx generate @local/ddd:domain-service` |

---

## Navigating Between Layers and Primitives

### From Layer 1 (Application) Gold Standard
See [docs/layers/01-Application/gold_standard.md](layers/01-Application/gold_standard.md) for:
- Architectural structure (bounded contexts, directory layout)
- Observability practices (spans, logging, Result pattern)
- Development practices (immutability, DI, testing)

**Bridge to primitives:** Each artifact type in the layer structure maps to one or more primitives above. Use this manifest to drill into specs and generators.

### From Generator Docs
Each generator doc (e.g., [docs/tooling/generators/command.md](tooling/generators/command.md)) contains:
- Overview of the primitive
- Quick start command
- Generated structure and examples
- Key rules and patterns
- **Embedded instance spec template** (to scaffold alongside the artifact)
- **Embedded instance enforcement template** (to scaffold alongside the artifact)

### From Primitive Specs
Specification docs (e.g., [docs/ddd-implementation/primitives/command/specification.md](ddd-implementation/primitives/command/specification.md)) describe:
- What the primitive is and why it exists
- Its shape and contract
- Serialization and versioning rules
- Lifecycle and side effects
- Related primitives and integrations

### From Primitive Enforcement
Enforcement docs (e.g., [docs/ddd-implementation/primitives/command/enforcement.md](ddd-implementation/primitives/command/enforcement.md)) map:
- Each requirement to its automation mechanism (ESLint, generator, CI, manual review)
- Coverage levels (fully automated, partially, manual)
- Required tests and test locations
- Anti-patterns and guardrails

---

## Quick Reference Table

| Primitive | Layer | Port/Impl | Generator | Spec | Enforcement |
|-----------|-------|-----------|-----------|------|------------|
| **Command** | Application | N/A | ✅ | [spec](ddd-implementation/primitives/command/specification.md) | [enf](ddd-implementation/primitives/command/enforcement.md) |
| **Query** | Application | N/A | ✅ | [spec](ddd-implementation/primitives/query/specification.md) | [enf](ddd-implementation/primitives/query/enforcement.md) |
| **Entity** | Domain | N/A | ✅ | [spec](ddd-implementation/primitives/entity/specification.md) | [enf](ddd-implementation/primitives/entity/enforcement.md) |
| **ValueObject** | Domain | N/A | ✅ | [spec](ddd-implementation/primitives/value-object/specification.md) | [enf](ddd-implementation/primitives/value-object/enforcement.md) |
| **UseCase** | Application | N/A | ✅ | [spec](ddd-implementation/primitives/use-case/specification.md) | [enf](ddd-implementation/primitives/use-case/enforcement.md) |
| **Handler** | Interface | N/A | ✅ | [spec](ddd-implementation/primitives/handler/specification.md) | [enf](ddd-implementation/primitives/handler/enforcement.md) |
| **Repository** | App + Infra | ✅ Port/Adapter | ✅ | [spec](ddd-implementation/primitives/repository/specification.md) | [enf](ddd-implementation/primitives/repository/enforcement.md) |
| **DomainEvent** | Domain | N/A | ⏳ | [spec](ddd-implementation/primitives/domain-event/specification.md) | [enf](ddd-implementation/primitives/domain-event/enforcement.md) |
| **Policy** | Domain | N/A | ⏳ | [spec](ddd-implementation/primitives/domain-service/specification.md) | ⏳ |

---

## How to Use This Document

1. **Starting a new feature?** Pick the primitives you need from the table above. Read each primitive's spec + enforcement. Use the generator to scaffold.

2. **Customizing a generated primitive?** Open the instance spec and enforcement templates (embedded in the generator doc). Fill in the blanks; commit alongside the code.

3. **Confused about where something lives?** Check the "Layer Location" row in each primitive's section.

4. **Wondering what tests are required?** Each primitive's enforcement doc has a detailed testing section; instance templates guide instance-specific tests.

5. **Need to change a primitive's shape or behavior?** The instance enforcement template has an "impact map" showing what else must be updated.

---

## Future Layers

As Layers 2–9 are detailed to the same level, new primitive manifests may emerge (e.g., "Data Layer Primitives: Migrations, Queries, Adapters"). This manifest will remain focused on Application-layer (DDD) primitives.

