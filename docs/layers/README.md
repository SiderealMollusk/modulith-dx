# Modulith-DX: Opinionated Layer Stack

An architecture-first, observability-woven system stack optimized for **modular monoliths with enforced DDD/TDD structure**.

**Status**: This documentation has been reorganized into focused layer guides. Start with the index below or the [Design Philosophy](Design-Philosophy.md) to understand core principles.

---

## 📚 Documentation Index

### Core Concepts
- [Design Philosophy](Design-Philosophy.md) — Seven core principles driving the stack
- [Quick Reference](Quick-Reference.md) — DDD primitive assignment matrix and decision trees
- [DDD Implementation](../ddd-implementation/README.md) — Opinionated base types and scaffolding for DDD primitives

### Layer Guides (Choose Your Layer)

Each layer has two complementary documents:
- **gold_standard.md**: Comprehensive reference (ideal principles, patterns, best practices)
- **implementation.md**: Practical implementation guide (templates, verification, testing)

1. **Layer 1: Application** `01-Application/`
   - [Gold Standard](01-Application/gold_standard.md) — DDD structure, entities, use cases, events
   - [Implementation Guide](01-Application/implementation.md) — Scaffolding, testing, alignment
   
2. **Layer 2: Data Layer** `02-Data-Layer/`
   - [Gold Standard](02-Data-Layer/gold_standard.md) — ORM, queries, repository adapters
   - [Implementation Guide](02-Data-Layer/implementation.md) — Schema management, migrations
   
3. **Layer 3: Networking** `03-Networking/`
   - [Gold Standard](03-Networking/gold_standard.md) — HTTP middleware, API contracts, trace context
   - [Implementation Guide](03-Networking/implementation.md) — Request/response handling, validation
   
4. **Layer 4: Runtime** `04-Runtime/`
   - [Gold Standard](04-Runtime/gold_standard.md) — Node.js environment, OTel SDK, health checks
   - [Implementation Guide](04-Runtime/implementation.md) — Startup verification, dependencies
   
5. **Layer 5: Secrets Management** `05-Secrets-Management/`
   - [Gold Standard](05-Secrets-Management/gold_standard.md) — Credential handling, SOPS, rotation
   - [Implementation Guide](05-Secrets-Management/implementation.md) — Validation, CI/CD injection
   
6. **Layer 6: Platform Services** `06-Platform-Services/`
   - [Gold Standard](06-Platform-Services/gold_standard.md) — CI/CD, ESLint, pre-commit hooks
   - [Implementation Guide](06-Platform-Services/implementation.md) — Build scripts, deployment
   
7. **Layer 7: Observability** `07-Observability/`
   - [Gold Standard](07-Observability/gold_standard.md) — OTel SDK, logging, metrics, dashboards
   - [Implementation Guide](07-Observability/implementation.md) — Span exporters, Prometheus/Loki/Tempo
   
8. **Layer 8: Operations** `08-Operations/`
   - [Gold Standard](08-Operations/gold_standard.md) — Runbooks, deployment, health checks
   - [Implementation Guide](08-Operations/implementation.md) — Incident response, scaling, monitoring
   
9. **Cross-Cutting: Enforced Architecture** `09-Cross-Cutting/`
   - [Gold Standard](09-Cross-Cutting/gold_standard.md) — Observability inventory, verification
   - [Implementation Guide](09-Cross-Cutting/implementation.md) — ESLint rules, workflows, automation

---

## Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ OBSERVABILITY (Cross-cutting)                                   │
│ Traces (Tempo), Metrics (Prometheus), Logs (Loki), Dashboards  │
│ Rule: Instrument every boundary; verify via workflows           │
└─────────────────────────────────────────────────────────────────┘
              ↑                    ↑                    ↑
              │                    │                    │
┌─────────────┴──────┐  ┌─────────┴────────┐  ┌───────┴─────────┐
│ APPLICATION        │  │ DATA LAYER       │  │ PLATFORM SVCS   │
│ (TypeScript/Node)  │  │ (Databases,      │  │ (CI/CD, Secrets)│
│ DDD Bounded        │  │  Caches,         │  │                 │
│ Contexts           │  │  Message Queues) │  │ ESLint, Git     │
│                    │  │                  │  │ Hooks, Verify   │
│ Strict TypeScript  │  │ ORM/Query logs   │  │ Workflows       │
│ Branded IDs        │  │ emitted as spans │  │                 │
│ Result monad       │  │                  │  │ Auto-update     │
│ Logger interface   │  │ Metrics:         │  │ inventory       │
│ Clock abstraction  │  │ - query count    │  │                 │
│ DomainEvents       │  │ - latency        │  │ Scan for drift  │
│ CQRS buses         │  │ - errors         │  │                 │
└────────────────────┘  └──────────────────┘  └─────────────────┘
         ↑                       ↑                      ↑
         └───────────────────────┴──────────────────────┘
                 OPERATIONS (Cross-cutting)
            Runbooks, Incident Response, Logs
            Rule: Observable first; ops second
```

---

## Quick Navigation

- **New to the stack?** Start with [Design Philosophy](Design-Philosophy.md)
- **Need specifics?** Use [Quick Reference](Quick-Reference.md)
- **Building a feature?** Read the relevant layer guide above
- **Debugging?** Check the "Operations" section of your layer guide
