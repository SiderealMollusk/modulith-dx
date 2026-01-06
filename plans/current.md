# Tooling Infrastructure Punch List

## Phase 1: Directory Structure Setup

- [ ] Create `ops/scripts/` for bash CI scripts
- [ ] Create `scripts/` for TypeScript automation (tsx)
- [ ] Create `tools/generators/` for Nx generators
- [ ] Create `tools/executors/` for Nx executors
- [ ] Create `tools/eslint-plugin/` for custom ESLint rules
- [ ] Create `.devcontainer/` for dev environment setup
- [ ] Install `tsx` as dev dependency for running TS scripts

## Phase 2: ADR Management Tool

**Location**: `scripts/adr.ts`

- [ ] Command: `new <slug>` - Create ADR in `proposed/` from template
- [ ] Command: `accept <slug>` - Move from `proposed/` to `accepted/` + update index
- [ ] Command: `deprecate <slug>` - Move to `deprecated/` + update index
- [ ] Command: `supersede <old-slug> <new-slug>` - Link old→new + move old to `superseded/`
- [ ] Command: `list` - Show all ADRs with status/tags/impact
- [ ] Command: `validate` - Check template compliance (metadata, sections)
- [ ] Function: `updateIndex()` - Regenerate `adr_index.md` from file scanning
- [ ] Function: `validateMetadata()` - Check Status/Deciders/Date/Tags/Impact/Enforcement
- [ ] Function: `slugToTitle()` - Convert `domain-layer-pure` → `Domain Layer Pure`
- [ ] Function: `getNextNumber()` - Scan existing ADRs, return next ADR-XXX number
- [ ] Add npm scripts to package.json:
  ```json
  "adr:new": "tsx scripts/adr.ts new",
  "adr:accept": "tsx scripts/adr.ts accept",
  "adr:deprecate": "tsx scripts/adr.ts deprecate",
  "adr:supersede": "tsx scripts/adr.ts supersede",
  "adr:list": "tsx scripts/adr.ts list",
  "adr:validate": "tsx scripts/adr.ts validate"
  ```

## Phase 3: Nx Generators (Code Scaffolding)

**Location**: `tools/generators/`

### Entity Generator
- [ ] Create `tools/generators/entity/schema.json` (context, name, idType)
- [ ] Create `tools/generators/entity/index.ts` (generator logic)
- [ ] Template: Entity class with BaseEntity, Brand ID, static factory
- [ ] Template: Unit test with invariants, validation, equality
- [ ] Add to `application/entities/index.ts` exports
- [ ] Register in workspace.json

### ValueObject Generator
- [ ] Create `tools/generators/value-object/schema.json`
- [ ] Create `tools/generators/value-object/index.ts`
- [ ] Template: ValueObject class with validation, equality
- [ ] Template: Unit test with validation, immutability
- [ ] Register in workspace.json

### Command Generator
- [ ] Create `tools/generators/command/schema.json` (context, name, result)
- [ ] Create `tools/generators/command/index.ts`
- [ ] Template: Command class with Zod schema, static factory, serialization
- [ ] Template: `{Name}.validation.spec.ts`
- [ ] Template: `{Name}.serialization.spec.ts`
- [ ] Template: `{Name}Factory.ts` test fixture
- [ ] Add to `application/commands/index.ts` exports
- [ ] Register in workspace.json

### Query Generator
- [ ] Create `tools/generators/query/schema.json`
- [ ] Create `tools/generators/query/index.ts`
- [ ] Template: Query class with Zod schema, caching support
- [ ] Template: `{Name}.validation.spec.ts`
- [ ] Template: `{Name}.serialization.spec.ts`
- [ ] Template: `{Name}Factory.ts` test fixture
- [ ] Register in workspace.json

### UseCase Generator
- [ ] Create `tools/generators/use-case/schema.json`
- [ ] Create `tools/generators/use-case/index.ts`
- [ ] Template: UseCase class extending BaseUseCase
- [ ] Template: Unit test, integration test stubs
- [ ] Register in workspace.json

### Handler Generator
- [ ] Create `tools/generators/handler/schema.json` (context, name, protocol)
- [ ] Create `tools/generators/handler/index.ts`
- [ ] Template: Handler class (HTTP/gRPC/CLI variants)
- [ ] Template: Unit test, integration test stubs
- [ ] Register in workspace.json

### Repository Generator
- [ ] Create `tools/generators/repository/schema.json` (context, aggregate)
- [ ] Create `tools/generators/repository/index.ts`
- [ ] Template: Port interface in `application/ports/`
- [ ] Template: Adapter class in `infrastructure/adapters/`
- [ ] Template: Integration test
- [ ] Register in workspace.json

## Phase 4: CI/CD Shell Scripts

**Location**: `ops/scripts/`

- [ ] `check-file-structure.sh` - Validate context-first directory layout
  - Check `src/core/{context}/domain|application|infrastructure|interface/`
  - Fail if primitives in wrong layer
- [ ] `validate-imports.sh` - Check dependency rules
  - Domain can't import application/infrastructure
  - Application can't import infrastructure (except via DI)
- [ ] `check-test-coverage.sh` - Ensure dual test files for commands/queries
  - Find all commands/queries
  - Check for `{Name}.validation.spec.ts` + `{Name}.serialization.spec.ts`
- [ ] `validate-observability-inventory.sh` - Check inventory is up-to-date
  - Scan all primitives
  - Check corresponding entries in OBSERVABILITY_INVENTORY.md
- [ ] Add to CI workflow (GitHub Actions or similar)

## Phase 5: ESLint Custom Rules

**Location**: `tools/eslint-plugin/`

### Setup
- [ ] Create `tools/eslint-plugin/package.json`
- [ ] Create `tools/eslint-plugin/index.ts` (plugin entry)
- [ ] Create `tools/eslint-plugin/rules/` directory
- [ ] Link to main workspace eslint config

### Domain Rules
- [ ] `no-logging-in-domain` - Forbid Logger in domain layer
- [ ] `no-infra-in-domain` - Forbid infrastructure imports in domain
- [ ] `require-readonly-fields` - Enforce readonly on domain fields
- [ ] `require-entity-base` - Entities must extend BaseEntity
- [ ] `require-value-object-base` - ValueObjects must extend ValueObject

### Application Rules
- [ ] `require-command-base` - Commands extend Command<TResult>
- [ ] `require-query-base` - Queries extend Query<TResult>
- [ ] `require-command-id` - Commands have id field
- [ ] `require-query-id` - Queries have id field
- [ ] `require-command-validation` - Commands have Zod schema
- [ ] `require-command-serialization` - Commands have toPrimitives/fromPrimitives
- [ ] `no-throw-in-application` - Use Result instead of throw
- [ ] `use-result-for-validation` - Factories return Result<T, ValidationError>

### Infrastructure Rules
- [ ] `no-domain-in-adapters` - Adapters can't import domain (use ports)
- [ ] `require-adapter-base` - Repository adapters extend BaseRepositoryAdapter

### General Rules
- [ ] `one-entity-per-file` - Single primitive per file
- [ ] `naming-convention` - Class name matches file name
- [ ] `colocated-validation-schema` - Zod schema in same file as command/query

## Phase 6: Dev Container Setup

**Location**: `.devcontainer/`

- [ ] Create `.devcontainer/devcontainer.json`
  - Node.js 20+
  - pnpm installed
  - Nx CLI installed globally
  - VS Code extensions (ESLint, Prettier, TypeScript)
  - Git config
- [ ] Create `.devcontainer/Dockerfile` (if custom image needed)
- [ ] Mount workspace at `/workspace`
- [ ] Post-create command: `pnpm install`
- [ ] Test: Build and run container locally

## Phase 7: Package.json Script Organization

- [ ] **ADR**: `adr:new`, `adr:accept`, `adr:deprecate`, `adr:supersede`, `adr:list`, `adr:validate`
- [ ] **Generate**: `generate:entity`, `generate:command`, `generate:query`, `generate:use-case`, `generate:handler`, `generate:repository`
- [ ] **Check**: `check:structure`, `check:imports`, `check:tests`, `check:inventory`
- [ ] **Inventory**: `inventory:update` (regenerate observability inventory)
- [ ] **Lint**: `lint`, `lint:fix` (include custom rules)
- [ ] **Test**: `test:unit`, `test:integration`, `test:e2e`, `test:coverage`

## Phase 8: Documentation

- [ ] Create `tools/README.md` - Overview of all tooling
- [ ] Document ADR tool usage in `docs/architecture-decisions/adr_index.md`
- [ ] Document generator usage in `docs/ddd-implementation/primitives/README.md`
- [ ] Create `ops/README.md` - CI/CD script documentation
- [ ] Update root README.md with tooling section

## Dependencies to Install

```bash
pnpm add -D tsx                    # Run TypeScript scripts
pnpm add -D @nx/devkit             # Nx generator utilities
pnpm add -D @typescript-eslint/utils  # ESLint rule helpers
pnpm add -D eslint-plugin-local    # Load local ESLint plugin
```

## Priority Order

**Week 1 (Immediate)**:
1. Phase 1: Directory structure
2. Phase 2: ADR tool (needed for 21 ADRs)
3. Phase 3: Command + Query generators (used most often)

**Week 2 (High Value)**:
4. Phase 3: Entity, ValueObject, UseCase generators
5. Phase 4: File structure + import validation scripts
6. Phase 5: Core ESLint rules (require-*-base, no-logging-in-domain)

**Week 3+ (Polish)**:
7. Phase 5: Remaining ESLint rules
8. Phase 6: Dev container
9. Phase 7: Package.json cleanup
10. Phase 8: Documentation