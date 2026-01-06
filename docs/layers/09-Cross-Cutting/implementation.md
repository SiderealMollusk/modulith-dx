# Cross-Cutting: Enforced Architecture - Implementation Guide

## What Must Be True

- [ ] OBSERVABILITY_INVENTORY.md exists and is current
- [ ] All observable files documented in inventory
- [ ] Status markers (✅/⏳/⚠️) match reality
- [ ] Pre-commit hook runs verification
- [ ] CI fails if inventory drift detected
- [ ] ESLint enforces observability patterns
- [ ] Code review checklist includes inventory check
- [ ] Inventory version synced with releases

## Templating Strategies

Use Plop template when scaffolding new components:

```bash
npm run scaffold:context -- --name "orders" --type "domain-driven"
# Generates:
# - src/core/orders/domain/entities/
# - src/core/orders/application/use-cases/
# - src/core/orders/infrastructure/adapters/
# - src/core/orders/interface/handlers/
#
# Auto-updates OBSERVABILITY_INVENTORY.md with ⏳ status
```

Template sections:
1. Directory structure (domain, application, infrastructure, interface)
2. Base classes (Entity, AggregateRoot, ValueObject)
3. Logger injection
4. Metric definitions
5. Unit test scaffolds
6. Inventory entries (auto-generated with ⏳ status)

## Author-Time Verification

When committing observability work:

1. Local verification:
   ```bash
   npm run verify:observability
   # Checks:
   # - All files in inventory exist
   # - Files contain expected exports
   # - Status markers match (✅ for implemented, ⏳ for planned)
   # - No untracked observable files
   ```

2. Status update:
   ```bash
   # After implementing a feature:
   # 1. Open OBSERVABILITY_INVENTORY.md
   # 2. Change status from ⏳ to ✅
   # 3. Verify: npm run verify:observability
   # 4. Commit with inventory changes
   ```

3. Pre-commit hook:
   ```bash
   # Automatically runs verification
   # Fails if inventory out of sync
   # Developer must fix before pushing
   ```

## Runtime Monitoring

Monitor inventory health:

- **`inventory_verification_success`** metric (1 = pass, 0 = fail)
- **CI job**: Nightly inventory verification
- **Alert**: If verification fails (new code untracked)
- **Dashboard**: Show coverage % (implemented/total)

Alert if:
- Verification fails (new files not documented)
- Files exist but missing from inventory
- Status markers out of sync (marked ✅ but file doesn't exist)

## How to Edit

**Adding component to inventory**:
1. Component must exist in codebase
2. Add entry to OBSERVABILITY_INVENTORY.md
3. Include: file path, type, role, status
4. Run: `npm run verify:observability`
5. Commit inventory changes

**Updating status markers**:
1. Change status: ⏳ → ✅ when implemented
2. Run: `npm run verify:observability`
3. Commit with: `docs: mark {component} as complete in inventory`

**Adding new section**:
1. Define section in OBSERVABILITY_INVENTORY.md
2. Create OBSERVABILITY_INVENTORY.meta.md rule for validation
3. Document verification strategy
4. Test with: `npm run verify:observability`

**Deprecating component**:
1. Change status to ⚠️ in inventory
2. Document deprecation date (2 sprints from now)
3. Document migration path
4. Update component comment: "Deprecated, use X instead"

## How to Document

**Inventory entry**:
```markdown
### CreateUserUseCase
- **File**: src/core/example/application/use-cases/CreateUserUseCase.ts
- **Type**: Use Case (Observable)
- **Role**: Orchestrate user creation from DTO, emit UserCreated event
- **Status**: ✅ (Implemented in sprint 3)
- **Observability**:
  - Logger injection: ✅
  - Result<T, E> pattern: ✅
  - DomainEvent emission: ✅
  - Metrics: create_user_total counter, create_user_duration_ms histogram
  - Span attributes: user_id (bounded), status
- **Last updated**: 2024-01-15 by @alice
```

**Verification rule** (meta.md):
```markdown
## Application Layer Verification

### Rule: Observable Use Cases
- **Expected**: Every use case file exports use case class + execute method
- **Signature**: `export class CreateUserUseCase { execute(...): Promise<Result<T, E>> }`
- **Verification**: Parse file, check exports, verify method signature
- **Required status**: ✅ (not ⏳, not ⚠️)

### Rule: Logger Injection
- **Expected**: Constructor includes `logger: Logger` parameter
- **Verification**: Check constructor parameters, verify Logger interface usage
- **Required status**: ✅ for observable components
```

**Migration guide**:
```markdown
# Migration: v1.0 → v2.0 (DomainEvent Refactor)

## What changed
- DomainEvent base class moved to `shared/kernel/events/`
- Event subscribers now registered via EventBus
- Emit syntax: `this.eventBus.publish(new UserCreated(...))`

## Migration steps
1. Update imports: `from '@shared/kernel/events'`
2. Update emit syntax: `this.eventBus.publish(...)`
3. Register subscribers in EventBus setup
4. Test: events emitted and handled correctly
5. Mark inventory: ⏳ → ✅

## Deadline
- Start: Sprint 4
- Finish: Sprint 6
- Deprecation: End of Sprint 6
```

## How to Test

**Inventory verification tests**:
```typescript
describe('OBSERVABILITY_INVENTORY.md', () => {
  it('should verify all files exist', async () => {
    const result = await verifyInventory();
    expect(result.missingFiles).toEqual([]);
  });

  it('should verify status markers match implementation', async () => {
    const result = await verifyInventory();
    expect(result.statusMismatches).toEqual([]);
  });

  it('should verify no untracked observable files', async () => {
    const result = await verifyInventory();
    expect(result.untracked).toEqual([]);
  });
});
```

**ESLint rule tests**:
```typescript
it('should flag hardcoded secrets', () => {
  const code = `const secret = 'sk_live_xxxx';`;
  const results = linter.verify(code, eslintConfig);
  expect(results[0].rule).toBe('no-hardcoded-secrets');
});

it('should allow Logger usage', () => {
  const code = `this.logger.info('message', { context });`;
  const results = linter.verify(code, eslintConfig);
  expect(results).toEqual([]);
});
```

**CI verification tests**:
```bash
# In CI pipeline
npm run verify:observability
# Should pass (exit 0) if inventory current
# Should fail (exit 1) if drift detected

# On PR comment:
# ✅ Inventory verified
# or
# ❌ Inventory out of sync (X items missing)
```

## Keep Aligned with Standards

**Gold Standard checklist**:
- [ ] OBSERVABILITY_INVENTORY.md is current
- [ ] All status markers accurate (✅/⏳/⚠️)
- [ ] No untracked observable components
- [ ] ESLint rules enforced
- [ ] Pre-commit hook blocks outdated inventory
- [ ] CI fails if inventory drift
- [ ] Code review requires inventory update
- [ ] Versions tracked in git tags

**Drift detection** (pre-commit):
```bash
npm run verify:observability
# Exit 0 = all good, can commit
# Exit 1 = inventory out of sync
#   - Fix: add missing entries, update status
#   - Or: delete untracked files
#   - Then commit inventory + fixes together
```

**Status marker rules**:
- ✅ (Completed): File exists, signatures correct, tested, documented
- ⏳ (Planned): Scheduled, scaffolded but not implemented yet
- ⚠️ (Deprecated): Being phased out, migration in progress
- ❓ (Uncertain): Under discussion, decision pending

**Deprecation timeline**:
1. Mark component ⚠️ (sprint N)
2. Document migration path
3. Announce to team (email, standup)
4. Grace period: 2 sprints (N+1, N+2)
5. Remove from inventory (sprint N+3)
6. Remove from codebase (sprint N+4)

**Release versioning**:
```markdown
# Version History

## v2.0.0 (2024-03-15) - BREAKING
- **Changed**: DomainEvent base class location
- **Migration**: See MIGRATION_v1_to_v2.md
- **Deadline**: Sprint 7

## v1.5.0 (2024-02-01) - Minor
- Added: New metrics for dashboard
- Deprecated: Old metric names (see v2.0 migration)

## v1.0.0 (2024-01-01) - Initial
- Initial release, baseline inventory
```
