# Validation Checklist

Complete checklist of what the CI scripts validate.

## File Structure (`check-file-structure.sh`)

- [ ] All entities in `src/core/{context}/domain/entities/`
- [ ] All value objects in `src/core/{context}/domain/value-objects/`
- [ ] All domain events in `src/core/{context}/domain/events/`
- [ ] All domain services in `src/core/{context}/domain/services/`
- [ ] All factories in `src/core/{context}/domain/factories/`
- [ ] All specifications/policies in `src/core/{context}/domain/policies/`
- [ ] All commands in `src/core/{context}/application/commands/`
- [ ] All queries in `src/core/{context}/application/queries/`
- [ ] All use cases in `src/core/{context}/application/use-cases/`
- [ ] All repository ports in `src/core/{context}/application/ports/`
- [ ] All repository adapters in `src/core/{context}/infrastructure/adapters/`
- [ ] All DTO mappers in `src/core/{context}/application/mappers/`
- [ ] All persistence mappers in `src/core/{context}/infrastructure/mappers/`
- [ ] All handlers in `src/core/{context}/interface/handlers/`
- [ ] All DTOs in `src/core/{context}/application/dtos/`

## Import Boundaries (`validate-imports.sh`)

### Domain Layer
- [ ] No imports from `application/`
- [ ] No imports from `infrastructure/`
- [ ] No imports from `interface/`
- [ ] No imports from `node_modules` (except types, zod, shared/kernel)
- [ ] No Logger imports
- [ ] No HTTP client imports
- [ ] No database imports

### Application Layer
- [ ] Imports from `domain/` allowed ✅
- [ ] Imports from `application/` allowed ✅
- [ ] Imports from infrastructure only via `ports/` (dependency injection)
- [ ] No direct imports from `infrastructure/adapters/`
- [ ] No direct imports from `interface/handlers/`

### Infrastructure Layer
- [ ] Imports from `application/ports/` allowed ✅
- [ ] Imports from `application/mappers/` allowed ✅
- [ ] Imports from `domain/` allowed ✅ (to build entities)
- [ ] No imports from `interface/handlers/`
- [ ] No imports from `application/use-cases/`

### Interface Layer
- [ ] Imports from `application/use-cases/` allowed ✅
- [ ] Imports from `application/commands/` allowed ✅
- [ ] Imports from `application/queries/` allowed ✅
- [ ] No imports from `infrastructure/adapters/` (adapters injected)
- [ ] No imports from `domain/` directly (use DTOs)

### Cross-Context Imports
- [ ] No circular imports between contexts
- [ ] Cross-context calls only through application ports/services
- [ ] No shared domain objects between contexts

## Test Coverage (`check-test-coverage.sh`)

### Commands
- [ ] `{CommandName}.ts` exists
- [ ] `{CommandName}.validation.spec.ts` exists
  - [ ] Tests Zod schema
  - [ ] Tests valid inputs
  - [ ] Tests invalid inputs (all error paths)
- [ ] `{CommandName}.serialization.spec.ts` exists
  - [ ] Tests round-trip: toPrimitives → fromPrimitives
  - [ ] Tests message bus format (JSON-safe)
  - [ ] Tests idempotency (commandId preserved)

### Queries
- [ ] `{QueryName}.ts` exists
- [ ] `{QueryName}.validation.spec.ts` exists
  - [ ] Tests Zod schema
  - [ ] Tests valid inputs
  - [ ] Tests invalid inputs
- [ ] `{QueryName}.serialization.spec.ts` exists
  - [ ] Tests round-trip
  - [ ] Tests cache key generation (if applicable)

### UseCase
- [ ] `{UseCaseName}UseCase.ts` exists
- [ ] `{UseCaseName}UseCase.spec.ts` exists (unit)
  - [ ] Tests happy path
  - [ ] Tests error scenarios
  - [ ] Tests with mocked dependencies
- [ ] `{UseCaseName}UseCase.integration.spec.ts` exists (recommended)
  - [ ] Tests with real repositories
  - [ ] Tests event publishing
  - [ ] Tests end-to-end flow

### Handler
- [ ] `{HandlerName}Handler.ts` exists
- [ ] `{HandlerName}Handler.spec.ts` exists (unit)
  - [ ] Tests request validation
  - [ ] Tests response formatting
  - [ ] Tests error handling
- [ ] `{HandlerName}Handler.integration.spec.ts` exists (recommended)
  - [ ] Tests with real use cases
  - [ ] Tests HTTP response codes
  - [ ] Tests error response format

### Entity
- [ ] `{EntityName}.ts` exists
- [ ] `{EntityName}.spec.ts` exists (unit)
  - [ ] Tests creation (factory)
  - [ ] Tests invariant enforcement
  - [ ] Tests business methods
  - [ ] Tests immutability

### ValueObject
- [ ] `{ValueObjectName}.ts` exists
- [ ] `{ValueObjectName}.spec.ts` exists (unit)
  - [ ] Tests creation
  - [ ] Tests validation
  - [ ] Tests equality
  - [ ] Tests immutability

## Observability Inventory (`validate-observability-inventory.sh`)

### UseCase Classes
- [ ] Listed in `OBSERVABILITY_INVENTORY.md`
- [ ] Marked with observability level (full logging, error logging, none)
- [ ] Links to span coverage
- [ ] Links to metric coverage

### Handler Classes
- [ ] Listed in `OBSERVABILITY_INVENTORY.md`
- [ ] Marked with observability level
- [ ] Links to correlation ID handling
- [ ] Links to error logging

### Repository Adapter Classes
- [ ] Listed in `OBSERVABILITY_INVENTORY.md`
- [ ] Marked with observability level
- [ ] Links to operation tracing
- [ ] Links to query metrics

### Domain Classes
- [ ] Marked as `❌ pure` in `OBSERVABILITY_INVENTORY.md` (no observability)
- [ ] No Logger imports in code
- [ ] No console.* calls in code
- [ ] No metric recording

## ESLint Rules

### Domain Layer Rules
- [ ] `no-logging-in-domain` — No Logger in domain layer
- [ ] `no-infra-in-domain` — No infrastructure imports in domain
- [ ] `require-entity-base` — All entities extend BaseEntity<TId>
- [ ] `require-value-object-base` — All value objects extend ValueObject<T>
- [ ] `require-readonly-fields` — All domain fields are readonly

### Application Layer Rules
- [ ] `require-command-base` — All commands extend Command<TResult>
- [ ] `require-query-base` — All queries extend Query<TResult>
- [ ] `require-command-id` — All commands have `id` field
- [ ] `require-query-id` — All queries have `id` field
- [ ] `require-command-validation` — All commands have Zod schema
- [ ] `require-command-serialization` — All commands have toPrimitives/fromPrimitives
- [ ] `no-throw-in-application` — Use Result instead of throw
- [ ] `use-result-for-validation` — Factories return Result<T, Error>

### Infrastructure Rules
- [ ] `require-adapter-base` — Repository adapters extend BaseRepositoryAdapter
- [ ] `no-domain-in-adapters` — Adapters don't import domain logic

### General Rules
- [ ] `one-entity-per-file` — One primitive per file
- [ ] `naming-convention` — Class name matches file name
- [ ] `colocated-validation-schema` — Zod schema in same file as command/query

---

Run all checks:
```bash
npm run check:all
```

Fix automatically (where possible):
```bash
npm run check:all -- --fix
```

For CI, any failure should block merge.
