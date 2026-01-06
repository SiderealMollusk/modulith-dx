# Repo Framework: Opinionated DDD Scaffold

This doc describes how we enforce conventions across every feature slice and DDD primitive. It leans on inheritance/mixins, generators, and required tests to make observability, validation, and structure non-optional.

## Goals
- Repeatable feature slices: each feature contains domain + application + interface + infrastructure with the same shape.
- Opinionated base types: every DDD primitive extends or composes shared kernel types so spans, metrics, validation, and Result are baked in.
- Test triad required: unit (core logic), integration (ports/adapters), e2e (boundary flow with span/log assertions).
- No infra leakage into domain: domains stay pure; boundaries handle IO with enforced telemetry and DTO validation.

## Feature Layout
```
src/core/{context}/{feature}/
	domain/         ← Entities, ValueObjects, DomainEvents, policies/specs
	application/    ← Use cases (BaseUseCase), DTOs (Zod), ports
	interface/      ← Handlers (BaseHandler), presenters, validators
	infrastructure/ ← Adapters (BaseRepositoryAdapter), mappers, clients
```
- Ports live in application; adapters implement them.
- Handlers call use cases; use cases depend only on ports + services.
- Domain has no logging/tracing; boundaries do.

## Base Types (enforcement surface)
- `BaseEntity<TId>` / `ValueObject<T>`: identity/immutability; no logging/tracing.
- `DomainEvent`: id, occurredOn, versioned payload; toPrimitives(); emitted only from domain/application.
- `BaseUseCase<TIn, TOut>`: 
	- `execute(input): Promise<Result<TOut, E>>`
	- wraps execution in span: start → set attributes → record exception → set status → end
	- validates input with Zod schema before execute
	- metrics: counter + duration histogram with exemplar traceId
	- dependencies injected: logger, tracer, meter, clock
- `BaseHandler` (HTTP/RPC):
	- validates request DTO (Zod)
	- starts span, injects trace/log context
	- maps Result to HTTP response (problem details, redaction)
- `BaseRepositoryAdapter<TPort>`:
	- implements port interface
	- wraps IO in span; logs structured outcomes
	- records latency histogram; enforces bounded metric tags
- `BaseMapper` (optional): pure mapping; no side effects; optional shape validation.
- Mixins (optional): `SpanLifecycle`, `MetricRecorder`, `ValidatedDto`, `InventoryTracked` when inheritance is too rigid.

## Required Tests per Artifact
- **Unit**: invariants/pure logic; no mocks for domain/VO; path `tests/unit/...` (DDD primitives should include a "core" test focusing on pure logic)
- **Integration**: port/adapter contracts; include trace/log assertions at boundary; path `tests/integration/...`
- **E2E**: happy-path through boundary; assert functional outcome + span/log correlation (traceId present); path `tests/e2e/...`
- Generators must emit all three skeletons with the right assertions scaffolded for each DDD primitive and boundary.
- Standardized core unit tests: whenever reasonable, scaffold a "core" test for pure logic to enforce invariants early.

## Observability & Error Policy
- Domain: no logging/tracing; no infra; return `Result`/domain errors, not thrown control flow.
- Boundaries (use case, handler, adapter): start span; set attributes; record exception on error; set status; close span in finally.
- Logging: structured; includes traceId/spanId; no secrets/PII.
- Metrics: bounded tags; counters for outcomes; histograms for latency; exemplars link to traceId.
- Errors: map infra errors to typed failures; never throw for expected domain failures; handler maps Result → HTTP problem details.

## Generators (Nx/Plop) Expectations
- Create DDD primitive with correct base type and constructor dependencies (logger, tracer, meter, clock where applicable).
- Emit DTO schema (Zod) for handlers/use cases; enforce validation before execution.
- Emit ports + adapters with span/log/metric wrappers.
- Emit unit/integration/e2e test skeletons with span/log assertions for boundaries.
- Update observability inventory (if present) with ⏳ entry.

## Anti-Patterns (fail fast)
- console.log anywhere (use Logger)
- Unbounded metric tags (userId/requestId as tag)
- Infra/HTTP/DB access in domain layer
- Throwing for expected domain failures (use Result)
- Missing span lifecycle at boundaries
- Skipping test triad for new artifacts

## How to Evolve Safely
- Deprecate with ⚠️ and grace period; document migration.
- Version events; keep toPrimitives stable across versions.
- Keep adapters behind ports; swap implementations without touching use cases.

## Next Steps
- Add concrete base class stubs in `src/shared/kernel` (BaseUseCase, BaseHandler, BaseRepositoryAdapter, etc.).
- Add generators to scaffold feature slices and individual DDD primitives with tests and observability baked in.
