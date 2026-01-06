# Tooling & Infrastructure

> **Status**: 🟠 Planned infrastructure. [See implementation status](status.md).

This folder contains documentation for the DDD tooling infrastructure built on **Nx**. Nx is our control plane for code generation, task orchestration, caching, and workspace management.

## Quick Navigation

**I want to...**

- 🆕 **Create a new primitive** → [Generators](generators/README.md)
  - `nx generate @local/ddd:command --context=myContext --name=MyCommand`
  - `nx generate @local/ddd:query --context=myContext --name=MyQuery`
  - `nx generate @local/ddd:entity --context=myContext --name=MyEntity`
  
- 📋 **Create an architecture decision** → [ADR Tool](adr-management/specification.md)
  - `nx generate @local/adr:new --slug=my-decision`
  - `nx run tooling:adr-accept --slug=my-decision`

- 🔍 **Fix a lint error** → [ESLint Rules](eslint-rules/README.md)
  - `nx lint` - Run all ESLint rules
  - `nx affected:lint` - Lint only changed code
  - `no-logging-in-domain` - Domain must stay pure
  - `require-command-base` - Commands must extend `Command<TResult>`

- ✅ **What validation happens in CI?** → [CI Scripts](ci-scripts/README.md)
  - `nx affected:test` - Test only affected projects
  - `nx run-many --target=validate` - Validate all contexts
  - `nx run tooling:check-structure` - File structure validation

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

### Tooling Layers (All Nx-based)

**Phase 1: Nx Generators** → Scaffold primitives via `@local/ddd` plugin  
**Phase 2: Nx Executors** → Validate architecture via custom executors  
**Phase 3: Nx Plugins** → ADR management, observability, custom tasks  

**Why Nx?**
- **Computation caching**: Don't re-run unchanged tests/builds
- **Affected commands**: Only test what changed (`nx affected:test`)
- **Task orchestration**: Parallel execution, dependency graphs
- **Extensibility**: Custom generators, executors, plugins for our patterns
- **Monorepo support**: Scale to dozens of bounded contexts  

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
