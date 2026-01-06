# Quick Reference: Decision Trees & DDD Primitive Assignment

Use this guide to quickly find the right layer for your work, locate DDD primitives, or navigate decisions.

---

## 🔍 DDD Primitive Assignment Matrix

| DDD Primitive | Layer | Gold Standard | Implementation |
|-----------|-------|---------------|-----------------|
| **UseCase** (orchestrator) | Application | Create New, patterns | Testing, scaffolding |
| **Entity** (aggregate root) | Application | DDD rules, invariants | Identifiers, equality |
| **ValueObject** (immutable data) | Application | Boundaries, logic | Equality tests, serialization |
| **DomainEvent** (side effects) | Application | Event sourcing | Publishing, handlers |
| **Repository** (port) | Application | Contract definition | Mock implementations |
| **TypeScript interface** | Application | Type safety, strict mode | Generics, utility types |
| **ORM Entity/Model** | Data Layer | Schema design, migrations | Query instrumentation, mappers |
| **Database Query** | Data Layer | Query optimization, indexes | Slow query logging, tracing |
| **Adapter** (implements port) | Data Layer | Dependency injection | Container setup |
| **HTTP Middleware** | Networking | Trace context, error handling | Request/response hooks |
| **Handler** (endpoint) | Networking | REST contracts, validation | Error serialization, status codes |
| **Validator** (input schema) | Networking | Contract enforcement | Zod schemas, custom rules |
| **Presenter** (output format) | Networking | DTO serialization | Pagination, filtering |
| **OTel SDK** | Runtime | Initialization, resource | Auto-instrumentation config |
| **Logger** | Runtime | Interface definition | Contextual injection |
| **Clock** | Runtime | Time abstraction | Mock for testing |
| **Environment Schema** | Secrets | Zod validation | Startup checks |
| **ESLint Config** | Platform Services | Rules, presets | Custom rule enforcement |
| **Pre-commit Hook** | Platform Services | Git automation | Husky integration |
| **Meter** (metrics) | Observability | Counter/Histogram/Gauge | Tag cardinality, exemplars |
| **Tracer** (spans) | Observability | Span attributes, sampling | Manual vs auto-instrumentation |
| **Grafana Dashboard** | Observability | RED metrics, alerts | Panel setup, queries |
| **Prometheus Alert** | Operations | Severity, runbook URL | Evaluation, thresholds |
| **Runbook** (incident) | Operations | Investigation steps | Loki/Prometheus queries |
| **Health Check** | Operations | Dependency status | Readiness probes |

---

## 🎯 Decision Trees

### "I'm adding a new feature, where does the code go?"

```
Do you have business logic?
├─ YES: Is it about an Entity/Aggregate?
│  ├─ YES: Layer 1 - Application (domain/entities/)
│  └─ NO: Is it coordinating use cases?
│     ├─ YES: Layer 1 - Application (use-cases/)
│     └─ NO: Is it transforming data?
│        └─ YES: Layer 2 - Data Layer (mappers/)
│
└─ NO: Are you handling an HTTP request?
   ├─ YES: Layer 3 - Networking (handlers/ or presenters/)
   └─ NO: Are you configuring infrastructure?
      └─ YES: Layer 4, 5, or 6 (Runtime, Secrets, Platform)
```

### "My tests are failing, where do I look?"

```
Is it a TypeScript error?
├─ YES: Check Layer 1 (types) or Layer 4 (strict mode)
│
Is it a failing unit test?
├─ YES: Check implementation.md → "How to Test" section
│
Is it a database error?
├─ YES: Check Layer 2 (Data Layer)
│
Is it an HTTP error?
├─ YES: Check Layer 3 (Networking)
│
Is it a deployment error?
├─ YES: Check Layer 6 (Platform Services)
│
Is it a secret/config error?
├─ YES: Check Layer 5 (Secrets)
│
Is it crashing in production?
└─ YES: Check Layer 8 (Operations) runbooks
```

### "I need to add observability, what's the checklist?"

```
Add Logger?
├─ Inject in constructor
├─ Call logger.info()/error()/warn()
├─ Include context { userId, orderId, ... }
└─ Never log secrets
→ Layer 7, Observability - Implementation

Add Metrics?
├─ Define Counter/Histogram/Gauge
├─ Use bounded tags (< 20 unique values)
├─ Record in use case/adapter
└─ Update Grafana dashboard
→ Layer 7, Observability - Implementation

Add Span?
├─ Create manual span for expensive operation
├─ Set attributes (user_id, operation, status)
├─ Record exception on error
└─ Verify in Tempo
→ Layer 7, Observability - Implementation

Create Alert?
├─ Write Prometheus rule (ops/prometheus/rules.yml)
├─ Document runbook
├─ Test in Prometheus UI
└─ Update Grafana alerts
→ Layer 8, Operations - Implementation
```

### "I'm deploying to production, what's the checklist?"

```
Code:
├─ [ ] All tests passing (unit + integration + e2e)
├─ [ ] Code review approved
├─ [ ] npm audit clean (no critical vulns)
└─ [ ] ESLint passing

Documentation:
├─ [ ] Observability inventory updated
├─ [ ] Runbooks exist for new alerts
└─ [ ] Release notes documenting changes

Infrastructure:
├─ [ ] Database backed up (if schema changes)
├─ [ ] Secrets injected in target environment
└─ [ ] Health checks responding (/healthz, /readyz)

→ Layer 8, Operations - Implementation → "Pre-Deployment Checklist"
```

---

## 📖 Finding the Right Document

**I want to...**

| Goal | Read This |
|------|-----------|
| Understand core principles | [Design Philosophy](Design-Philosophy.md) |
| Set up a new service | Layer 1-9 "Create New" sections |
| Add daily patterns (logging, metrics) | Layer "Development Practices" sections |
| Debug in production | Layer 8 - Operations (runbooks) |
| Understand observability | Layer 7 - Observability (gold_standard.md) |
| Configure CI/CD | Layer 6 - Platform Services |
| Handle secrets | Layer 5 - Secrets Management |
| Know what's implemented | [Observability Inventory](../enforced-architecture/OBSERVABILITY_INVENTORY.md) |
| Add a new component | Layer "Implementation Guide" → Templating Strategies |
| Verify architecture | Layer 9 - Cross-Cutting (gold_standard.md) |

---

## 🚀 Common Patterns

### Creating a new bounded context

1. Create domain/entities, domain/valueObjects, domain/events
2. Create application/use-cases, application/dtos, application/ports
3. Create infrastructure/adapters (repository implementations)
4. Create interface/handlers, interface/presenters
5. Add Logger and Meter injection throughout
6. Update OBSERVABILITY_INVENTORY.md

→ See: Layer 1 (Application) - [Create New](01-Application/gold_standard.md#create-new)

### Adding a database query

1. Write ORM entity in Layer 2
2. Create migration (if schema change)
3. Instrument query with Logger span context
4. Add Meter for query count/duration
5. Create adapter/repository implementing port
6. Test with integration tests

→ See: Layer 2 (Data Layer) - [Create New](02-Data-Layer/gold_standard.md#create-new)

### Setting up a new alert

1. Write Prometheus rule in ops/prometheus/rules.yml
2. Create runbook documenting investigation
3. Add runbook URL to alert annotations
4. Test alert evaluation in Prometheus UI
5. Create Grafana panel showing the metric
6. Document in runbook what to do when alert fires

→ See: Layer 8 (Operations) - [Create New](08-Operations/gold_standard.md#create-new)

---

## 📚 File Organization

```
docs/Layers/
├── Design-Philosophy.md      ← Start here
├── Quick-Reference.md         ← You are here
├── README.md                  ← Index of all layers
│
├── 01-Application/
│   ├── gold_standard.md       ← Comprehensive DDD guidance
│   └── implementation.md       ← Practical scaffolding & testing
├── 02-Data-Layer/
│   ├── gold_standard.md       ← ORM, migrations, queries
│   └── implementation.md       ← Testing, instrumentation
├── 03-Networking/
│   ├── gold_standard.md       ← HTTP, validation, contracts
│   └── implementation.md       ← Error handling, serialization
├── 04-Runtime/
│   ├── gold_standard.md       ← Node.js, OTel, initialization
│   └── implementation.md       ← Verification, dependencies
├── 05-Secrets-Management/
│   ├── gold_standard.md       ← SOPS, rotation, audit
│   └── implementation.md       ← CI/CD injection, validation
├── 06-Platform-Services/
│   ├── gold_standard.md       ← CI/CD, ESLint, hooks
│   └── implementation.md       ← Configuration, enforcement
├── 07-Observability/
│   ├── gold_standard.md       ← OTel, logging, metrics, dashboards
│   └── implementation.md       ← Verification, testing
├── 08-Operations/
│   ├── gold_standard.md       ← Runbooks, deployment, health
│   └── implementation.md       ← Testing, SLOs, incidents
└── 09-Cross-Cutting/
    ├── gold_standard.md       ← Inventory, enforcement
    └── implementation.md       ← Automation, CI validation
```