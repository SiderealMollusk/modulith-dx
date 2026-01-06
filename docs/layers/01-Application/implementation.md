# Layer 1: Application - Implementation

Practical implementation guidance for applying Layer 1 (Application) patterns in your codebase.

## What Must Be True

**Mandatory invariants for Application layer:**
- [ ] All use cases return `Result<T, E>` (never throw)
- [ ] Logger interface injected (never `console.log`)
- [ ] Clock abstraction injected (never `Date.now()` or `new Date()`)
- [ ] DomainEvents emitted for bounded context boundaries
- [ ] No cross-context imports (except `shared/kernel`)
- [ ] TypeScript strict mode enabled
- [ ] ESLint boundaries rule configured and passing
- [ ] 80%+ code coverage for domain + application layers
- [ ] Entities are immutable (readonly properties)
- [ ] Value objects use branded types

## Templating Strategies

**Scaffolding tools and generators:**
- Nx generator: `nx generate @modulith/docs:layer`
- Templates for: Entity, UseCase, Repository, DTO, Event
- Example: `npm run scaffold:entity UserEntity --context=users`

## Author-Time Verification

**What to check before committing:**
- TypeScript compilation (`npm run typecheck`)
- ESLint boundaries rule (`npm run lint`)
- Unit tests for domain/application (`npm run test:unit`)
- Result pattern compliance (no throw statements)

## Runtime Monitoring

**Metrics and observability:**
- Trace duration per use case (histogram)
- Error count by error type (counter)
- Domain event emission count (counter)
- Latency p99 by operation (histogram)

## How to Edit

**Refactoring patterns:**
- Moving logic to domain policies (extract method)
- Changing repository interfaces (backward-compatible additions)
- Deprecating use cases (version in handler path)

## How to Document

**Keeping code and docs in sync:**
- JSDoc for public ports and use cases
- Update OBSERVABILITY_INVENTORY.md when adding contexts
- Link domain policies to business requirements

## How to Test

**Testing strategies:**
- Unit: domain entities, value objects, policies
- Integration: use cases with in-memory ports
- Property-based: bounded type invariants

## Keep Aligned with Standards

**Linting and validation:**
- ESLint rule: no cross-context imports
- TypeScript rule: no implicit any
- Pre-commit hook: verify Result<T, E> pattern
