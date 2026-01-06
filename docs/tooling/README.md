# Tooling & Infrastructure

> **Status**: 🟠 Planned infrastructure. [See implementation status](status.md).

This folder contains documentation for the DDD tooling infrastructure: generators, validation scripts, ESLint rules, and ADR management.

## Quick Navigation

**I want to...**

- 🆕 **Create a new primitive** → [Generators](generators/README.md)
  - `nx generate command --context=myContext --name=MyCommand`
  - `nx generate query --context=myContext --name=MyQuery`
  - `nx generate entity --context=myContext --name=MyEntity`
  
- 📋 **Create an architecture decision** → [ADR Tool](adr-management/specification.md)
  - `npm run adr:new -- my-decision`
  - `npm run adr:accept -- my-decision`

- 🔍 **Fix a lint error** → [ESLint Rules](eslint-rules/README.md)
  - `no-logging-in-domain` - Domain must stay pure
  - `require-command-base` - Commands must extend `Command<TResult>`
  - `require-entity-base` - Entities must extend `BaseEntity<TId>`

- ✅ **What validation happens in CI?** → [CI Scripts](ci-scripts/README.md)
  - File structure validation
  - Import dependency validation
  - Test coverage requirements

- 🔧 **Set up development environment** → [Quick Start](quick-start.md)

- 📊 **Understand the full plan** → [Implementation Plan](../../plans/current.md)

## Folder Structure

```
docs/tooling/
├── status.md                     ← Current implementation state
├── quick-start.md                ← "I just cloned this" guide
├── adr-management/
│   ├── specification.md          ← How the ADR tool works
│   └── examples.md               ← Real examples of ADR workflow
├── generators/
│   ├── README.md                 ← When to use generators + overview
│   ├── entity.md                 ← Entity generator walkthrough
│   ├── command.md                ← Command generator (most important)
│   ├── query.md
│   ├── use-case.md
│   ├── handler.md
│   ├── repository.md
│   └── value-object.md
├── eslint-rules/
│   ├── README.md                 ← Rule categories + compliance matrix
│   ├── domain-rules.md           ← Domain purity enforcement
│   ├── application-rules.md      ← CQRS + primitive enforcement
│   └── enforcement-patterns.md   ← Common violations + fixes
└── ci-scripts/
    ├── README.md                 ← What each script does
    └── validation-checklist.md   ← Full checklist of validations
```

## Core Concepts

### The 13 DDD Primitives
This tooling helps you create and enforce all 13 primitives:

| Domain | Application | Interface | Shared |
|--------|-------------|-----------|--------|
| Entity | Command | Handler | Mapper |
| ValueObject | Query | | |
| AggregateRoot | UseCase | | |
| DomainEvent | Repository | | |
| Specification | | | |
| DomainService | | | |
| Factory | | | |

See [docs/ddd-implementation/primitives/](../ddd-implementation/primitives/README.md) for detailed specs.

### Tooling Layers

**Phase 1: Generators** → Scaffold primitives (boilerplate + structure)  
**Phase 2: Validation** → Ensure correct layer placement (ESLint + scripts)  
**Phase 3: Management** → Track decisions + update ADR index (ADR tool)  

## Architecture Decision Links

The following ADRs define what this tooling enforces:

- [Command and Query as First-Class Primitives](../architecture-decisions/accepted/command-query-as-primitives.md)
  - Why: Serialization, idempotency, distributed tracing
  - Generators enforce: Zod schema, correlationId, toPrimitives/fromPrimitives
  - ESLint rules: `require-command-base`, `require-command-validation`

- [Domain Layer Pure](../architecture-decisions/accepted/domain-layer-pure.md) *(when written)*
  - Why: Domain stays business logic, no infrastructure coupling
  - ESLint rules: `no-logging-in-domain`, `no-infra-in-domain`
  - CI script: `validate-imports.sh`

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for how to use generators and follow conventions.

---

**Not implemented yet?** [See status.md](status.md) and [implementation plan](../../plans/current.md).
