# Layers Development Order

Recommended sequence for specifying and implementing each layer. Dependencies and business value drive the order.

## Development Sequence

### Phase 1: Foundation (Core)

**1. Layer 1: Application**
- **Why first:** Defines DDD primitives (Commands, Queries, Entities, Use Cases, Handlers, Repositories) that are foundational to everything else.
- **Status:** ✅ Mostly complete (gold_standard.md, ddd-implementation specs, generators)
- **Deliverable:** DDD framework, generators, instance templates
- **Dependencies:** None

**2. Layer 2: Data Layer**
- **Why second:** Application layer depends on repository ports; data adapters implement those ports. Needed to persist domain changes.
- **Status:** 🟠 Outline exists; needs detail (connection pools, query patterns, migrations, sharding)
- **Deliverable:** Data access patterns, ORM/driver selection, migration strategy, testing approach
- **Dependencies:** Layer 1 (repositories)

**3. Layer 7: Observability**
- **Why third (early):** Critical to instrument from the start. Spans, metrics, logging are woven through use cases, handlers, adapters.
- **Status:** 🟠 Outline exists; needs detail (OpenTelemetry setup, sampling, exporters, correlation)
- **Deliverable:** Tracing/logging/metrics standards, instrumentation points, schema validation
- **Dependencies:** Layer 1 (use cases, handlers), Layer 2 (adapters)

---

### Phase 2: Execution & Communication

**4. Layer 4: Runtime**
- **Why here:** Concurrency, async execution, event loop management needed once you have observability in place.
- **Status:** 🟠 Outline exists; needs detail (async patterns, task scheduling, thread pools, backpressure)
- **Deliverable:** Concurrency model, execution patterns, testing strategies
- **Dependencies:** Layer 1, Layer 7 (instrument concurrent work)

**5. Layer 3: Networking**
- **Why here:** HTTP/gRPC/Protocol handling; handlers generate HTTP responses; depends on routing/middleware patterns.
- **Status:** 🟠 Outline exists; needs detail (routing, middleware, request/response patterns, error mapping)
- **Deliverable:** Protocol support, transport adapters, middleware framework
- **Dependencies:** Layer 1 (handlers), Layer 7 (tracing of network calls)

---

### Phase 3: Configuration & Integration

**6. Layer 5: Secrets Management**
- **Why here:** Once networking and data layers are clear, define how credentials/secrets are loaded and used.
- **Status:** 🟠 Outline exists; needs detail (vault integration, rotation, encryption, access patterns)
- **Deliverable:** Secret loading patterns, encryption strategy, rotation procedures
- **Dependencies:** Layer 2 (DB secrets), Layer 3 (API keys), Layer 7 (audit logging)

**7. Layer 6: Platform Services**
- **Why here:** After you have networking and secrets, define external service integration patterns (payments, notifications, analytics).
- **Status:** 🟠 Outline exists; needs detail (service discovery, client patterns, fallback strategies, rate limiting)
- **Deliverable:** Service client framework, integration patterns, resilience strategies
- **Dependencies:** Layer 3 (network), Layer 5 (credentials), Layer 7 (trace propagation)

---

### Phase 4: Refinement & Deployment

**8. Layer 9: Cross-Cutting**
- **Why here:** Refined after other layers define their concerns (caching, validation, authorization, dto transformation).
- **Status:** 🟠 Outline exists; needs detail (shared concerns, reusable patterns, middleware hooks)
- **Deliverable:** Shared kernel patterns, cross-cutting middleware, utility libraries
- **Dependencies:** Layers 1–7

**9. Layer 8: Operations**
- **Why last:** Deployment, scaling, health checks, monitoring dashboards depend on everything else being defined.
- **Status:** 🟠 Outline exists; needs detail (deployment pipeline, scaling strategy, health checks, SLOs)
- **Deliverable:** Deployment automation, infrastructure-as-code, operational runbooks
- **Dependencies:** All other layers

---

## Rationale Summary

| Layer | Dev Order | Why |
|-------|-----------|-----|
| **Application** | 1 | Foundational; all others depend on DDD primitives |
| **Data** | 2 | Implements repository ports from Layer 1 |
| **Observability** | 3 | Instrument early and often; thread through all subsequent layers |
| **Runtime** | 4 | Concurrency patterns needed once basic IO is instrumented |
| **Networking** | 5 | Transport layer for handlers; depends on routing/middleware |
| **Secrets** | 6 | Needed once you have DB + network integrations |
| **Platform** | 7 | External service patterns; depends on secrets + networking |
| **Cross-Cutting** | 8 | Refined as other concerns emerge; captures shared patterns |
| **Operations** | 9 | Deployment/scaling; depends on all others being stable |

---

## Concurrent Work Opportunities

- **Layers 2 & 7** can be worked in parallel once Layer 1 is stable
- **Layers 4, 5, 6** can be parallelized once Layer 3 is drafted
- **Layer 9 (Cross-Cutting)** can be refined throughout as other layers highlight shared patterns

---

## Status & Next Steps

- ✅ Layer 1: Mostly done (primitives, generators, specs/enforcement)
- 🟠 Layers 2–9: Outlines exist; need detailed spec/enforcement per primitive type per layer
- ⏳ When Layer 2 is detailed, consider whether it has its own "data primitives" (migrations, query patterns, adapters) warranting a separate primitives table
