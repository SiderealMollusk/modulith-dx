# Cross-Cutting: Enforced Architecture

OBSERVABILITY_INVENTORY.md, verification strategies, automation definitions, and ESLint enforcement.

## Overview

**What you provide:**
- OBSERVABILITY_INVENTORY.md (single source of truth)
- OBSERVABILITY_INVENTORY.meta.md (verification strategy)
- WORKFLOWS.md (automation definitions)
- ESLint config (enforce patterns)
- Pre-commit hooks (fail fast)
- Verification workflows (CI validation)

**Rules:**
- ✅ **Must:** Keep inventory in sync with code (automated via workflows)
- ✅ **Must:** Document every observable component (file, signature, role)
- ✅ **Must:** Run `/verify-observability` before commit
- ✅ **Must:** Move planned items (⏳) to completed (✅) when implemented
- ✅ **Must:** All new code documented in same PR
- ❌ **Never:** Merge code with inventory drift
- ❌ **Never:** Undocumented observable components
- ❌ **Never:** Status markers out of sync with reality

**Enforced by:**
- Pre-commit hook runs verification
- CI fails if inventory is stale
- Workflows auto-update inventory on scaffolding
- Code review checklist

## Create New

When adding observability components:

1. **Add to OBSERVABILITY_INVENTORY.md**:
   - File path
   - Component type (Logger, Meter, Tracer, Dashboard, etc.)
   - Role/responsibility
   - Status (✅ or ⏳)

2. **Update OBSERVABILITY_INVENTORY.meta.md** (if adding new section):
   - Verification rule
   - Expected signature
   - Required status

3. **Run verification**:
   ```bash
   npm run verify:observability
   ```
   - Should pass locally before pushing
   - CI re-runs on all PRs

4. **Example inventory entry**:
   ```markdown
   ## Application Layer

   ### CreateUserUseCase
   - **File**: src/core/example/application/use-cases/CreateUserUseCase.ts
   - **Type**: Use Case (Observable)
   - **Role**: Orchestrate user creation, emit UserCreated event
   - **Status**: ✅
   - **Observability**:
     - Logger injection: ✅
     - Result<T, E> pattern: ✅
     - DomainEvent emission: ✅
     - Span attributes: user_id, email
   ```

## Development Practices

1. **Inventory Structure**:
   ```
   OBSERVABILITY_INVENTORY.md
   ├── Observability (OTel setup, health checks)
   ├── Shared Kernel (Logger, Clock, Result, Events)
   ├── Application Layer (Use cases, repositories)
   ├── Data Layer (Adapters, mappers)
   ├── Networking (Handlers, validators, presenters)
   ├── Runtime (main.ts, env schema)
   ├── Platform Services (CI/CD, ESLint, hooks)
   └── Operations (Health checks, runbooks)
   ```

2. **Status Markers**:
   - ✅ (Completed): Implemented, tested, documented
   - ⏳ (Planned): Scheduled for next sprint
   - ❓ (Uncertain): Under discussion, needs decision
   - ⚠️ (At-risk): Blocked or behind schedule

3. **Verification Workflow**:
   - Parse inventory file (markdown)
   - Extract file paths and expected signatures
   - Check files exist and contain expected exports
   - Report missing/outdated components
   - Fail if any drift detected

4. **Documentation Rules**:
   - Every Logger: document what it logs and why
   - Every Meter: document purpose, tags, units
   - Every Tracer: document spans created, attributes
   - Every Dashboard: document metrics, alerts
   - Every Alert: document severity, runbook link

5. **Code Review Checklist**:
   - [ ] New observable component added to inventory
   - [ ] Status marker correct (✅ if done, ⏳ if future)
   - [ ] Verification script passes locally
   - [ ] No console.log() in application code
   - [ ] Logger interface used (not console)
   - [ ] DomainEvents emitted for boundaries
   - [ ] Metrics recorded with bounded tags

## Code Maintenance Practices

1. **Automated Inventory Updates**:
   - GitHub action on pull request:
     - Run verification
     - Comment with status (pass/fail)
     - Block merge if failing

2. **Scaffolding Automation**:
   - Template generator: `npm run scaffold:context <name>`
   - Auto-generates: domain, application, infrastructure, interface
   - Auto-updates inventory with ⏳ status
   - Developer: implement and change to ✅

3. **Drift Detection**:
   - Nightly CI job: verify inventory
   - Alert if files added/removed without inventory update
   - Auto-create issue if drift detected

4. **Migration Support**:
   - Deprecation markers: ⚠️ (moving to new location)
   - Grace period: 2 sprints to migrate
   - Cleanup: remove deprecated after grace period

5. **Versioning**:
   - OBSERVABILITY_INVENTORY.md includes version
   - Breaking changes: require migration guide
   - Example: v1.0 → v2.0 requires DomainEvent refactor

## Operations

1. **Inventory as Contract**:
   - Deployment only succeeds if inventory verified
   - Inventory version tracked in git tags
   - Rollback includes inventory version
   - Breaking changes documented in release notes

2. **Monitoring Inventory Health**:
   - **Metric**: `inventory_verification_success` (boolean)
   - **Alert**: If verification fails (new code not documented)
   - **Dashboard**: Show inventory coverage % (items completed/total)

3. **Runbook: Inventory Drift**:
   - Issue: CI fails with "inventory out of sync"
   - Cause: New file added without inventory entry
   - Fix: 
     ```bash
     npm run verify:observability --fix
     git add docs/enforced-architecture/OBSERVABILITY_INVENTORY.md
     git commit -m "docs: update observability inventory"
     ```
   - Prevention: enable auto-fix in pre-commit hook

4. **Inventory Review Meeting** (monthly):
   - Review status markers: move ⏳ to ✅ if done
   - Identify at-risk items: ⚠️ → escalate
   - Celebrate completions: ✅ items shipped
   - Plan next sprint: new ⏳ items

5. **Incident Correlation**:
   - Incident database indexed by inventory component
   - Example: "CreateOrder" failures linked to CreateOrderUseCase
   - Root cause analysis: review inventory role vs. actual behavior
   - Prevention: update inventory if behavior changed

6. **Enforcement Levels**:
   - **Strict** (production): No drift allowed, CI fails
   - **Flexible** (development): Warnings only, merge allowed
   - **Disabled** (prototyping): Skip verification, document later
   - Toggle via environment variable: `INVENTORY_VERIFICATION_LEVEL`

Example verification output:
```
✅ Observability Layer
  ✅ src/shared/kernel/telemetry/index.ts (OTel SDK setup)
  ✅ src/shared/kernel/logger/Logger.ts (Logger interface)

✅ Application Layer
  ✅ src/core/example/domain/entities/User.ts (Domain entity)
  ✅ src/core/example/application/use-cases/CreateUserUseCase.ts (Observable use case)

⚠️ Data Layer
  ❌ MISSING: src/core/example/infrastructure/adapters/PostgresUserRepository.ts
     Expected file not found. Add to inventory or create file.

✅ Networking Layer
  ✅ src/core/example/interface/handlers/CreateUserHandler.ts (HTTP handler)

Summary:
  ✅ 7 items verified
  ⚠️ 1 item missing (fix required)
  ⏳ 2 items planned (not checked)

Status: VERIFICATION_FAILED
Exit code: 1
```
