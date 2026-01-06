# ADR Tool Examples

Real-world usage scenarios for the ADR management tool.

## Example 1: Proposing a New Architecture Decision

### Scenario
You have an idea: "Domain layer should stay pure (no logging, no infrastructure)". Want to get team input.

### Steps

**1. Create the ADR**
```bash
npm run adr:new -- domain-layer-pure
```

Output:
```
✓ Created: docs/architecture-decisions/proposed/ADR-0021-domain-layer-pure.md

Edit file and run: npm run adr:accept -- domain-layer-pure
```

**2. File created**
```
docs/architecture-decisions/proposed/ADR-0021-domain-layer-pure.md
```

Content:
```markdown
# Domain Layer Pure

**Deciders**: [Your Name]  
**Date**: 2026-01-05  
**Status**: Proposed  
**Tags**: architecture, enforcement, domain  
**Impact**: All code in `src/core/{context}/domain/`

## Problem

Currently, domain layer code can access logging, HTTP clients, and databases directly. This creates:
- **Tight coupling** to infrastructure choices
- **Hard to test** without mocking external services
- **Cannot reason about** business logic in isolation
- **Violates DDD principle**: Domain should be pure business logic

## Decision

Domain layer code (`src/core/{context}/domain/`) must:
- ❌ NOT import from `infrastructure/`
- ❌ NOT use Logger, HTTP clients, or databases
- ❌ NOT throw uncaught exceptions (use Result<T, Error>)
- ✅ Only use domain layer imports (entities, value objects, events, services)
- ✅ Return Result<T, DomainError> for fallible operations
- ✅ Raise domain events for significant state changes

Application and Infrastructure layers handle observability, persistence, and error handling.

## Why This Matters

**Benefits**:
- Enables true unit testing (no mocks needed for domain objects)
- Makes business logic portable (reuse in different applications)
- Supports type-driven development (domain types are contracts)
- Simplifies reasoning about aggregate invariants
- Allows domain logic to be extracted to separate library

**Example of impure domain**:
```typescript
// ❌ BAD: Domain depends on infrastructure
class User extends BaseEntity<UserId> {
  constructor(id, email, name, private logger: Logger) {
    this.logger.info('User created'); // 🚫 Logging in domain!
    this.email = email;
  }
}
```

**Pure domain**:
```typescript
// ✅ GOOD: Domain is pure
class User extends BaseEntity<UserId> {
  private constructor(id: UserId, email: string, name: string) {
    this.email = email;
  }
  
  static create(email: string, name: string): Result<User, DomainError> {
    // Validation only, no side effects
    const emailResult = Email.create(email);
    if (emailResult.isFailure) return Result.fail(emailResult.error);
    return Result.ok(new User(new UserId(generateId()), emailResult.value, name));
  }
}
```

Logging happens at application boundary:
```typescript
// ✅ OK: UseCase logs, domain stays pure
export class CreateUserUseCase extends BaseUseCase {
  async execute(input): Promise<Result<UserDto, ApplicationError>> {
    const userResult = User.create(input.email, input.name);
    if (userResult.isFailure) {
      this.logger.warn('User creation failed', userResult.error);
      return Result.fail(userResult.error);
    }
    // ... rest of use case
  }
}
```

## Trade-offs

**What we lose**:
- Can't log directly in domain (must be in application/handler)
- Can't call external APIs from domain (must be in adapter)
- Cannot use ORM decorators in domain entities
- Requires Result<T, Error> pattern (more boilerplate than throw)

**Why it's worth it**:
- Domain code is testable without complex mocks
- Can understand/verify business rules without infrastructure knowledge
- Supports hexagonal architecture cleanly
- Aligns with DDD best practices

## Enforcement

### ESLint Rules
- **`no-logging-in-domain`**: Forbid `Logger`, `console.log` in `src/core/*/domain/`
- **`no-infra-in-domain`**: Forbid imports from `infrastructure/` or `node_modules` HTTP/DB libs
- **`require-result-return`**: Domain/factory methods return `Result<T, DomainError>`, not throw

### CI Scripts
```bash
# Check domain purity (no infra imports)
ops/scripts/validate-domain-imports.sh

# Check test coverage (domain tests use Result, not throw)
npm run test:unit -- src/core/*/domain/
```

### Manual Review Checklist
- [ ] No `Logger`, `console.*` in domain
- [ ] No imports of `infrastructure/` or `node_modules` HTTP/DB libs
- [ ] All fallible operations return `Result<T, Error>`
- [ ] Domain invariants enforced via private constructors + static factories
- [ ] Domain events raised for significant changes (no listeners in domain)
- [ ] Unit tests use pure domain objects (no mocks)

## References

- [Entity specification](../../ddd-implementation/primitives/entity/specification.md)
- [ValueObject specification](../../ddd-implementation/primitives/value-object/specification.md)
- [DomainService specification](../../ddd-implementation/primitives/domain-service/specification.md)
- [Result type documentation](../../ddd-implementation/primitives/result.md) *(when created)*
- Related: [ADR-0002: Command/Query as Primitives](../accepted/ADR-0002-command-query-as-primitives.md)
- Martin Fowler: [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)
- Alistair Cockburn: [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
```

**3. Share with team**
Post link in Slack: "https://github.com/your-org/modulith-dx/blob/main/docs/architecture-decisions/proposed/ADR-0021-domain-layer-pure.md"

Team reviews, comments, refines the Decision/Trade-offs sections...

---

## Example 2: Accepting a Proposal

### Scenario
Team reviewed ADR-0021, approved the domain purity principle. Time to accept it.

### Steps

**1. Accept the ADR**
```bash
npm run adr:accept -- domain-layer-pure
```

Output:
```
✓ Moved: proposed/ADR-0021-domain-layer-pure.md → accepted/
✓ Set status: Proposed → Accepted
✓ Updated: adr_index.md (added to "Accepted" section)
✓ Generated enforcement summary

? Next: Add ESLint rules or CI scripts to enforce this decision
```

**2. Index updated automatically**

In `docs/architecture-decisions/adr_index.md`:

```markdown
## Accepted (18)

...

- [ADR-0021: Domain Layer Pure](./accepted/ADR-0021-domain-layer-pure.md)  
  **Tags**: architecture, enforcement, domain  
  **Impact**: All code in `src/core/{context}/domain/`  
  **Enforcement**: ESLint rules (require-entity-base, no-logging-in-domain), CI scripts

...
```

**3. Build enforcement** (in separate PR)

Create `tools/eslint-plugin/rules/no-logging-in-domain.ts`:
```typescript
export default {
  meta: { docs: { description: 'Enforce domain layer purity' } },
  create(context) {
    return {
      CallExpression(node) {
        const filePath = context.filename;
        if (!filePath.includes('/domain/')) return;
        
        if (isMemberExpression(node, 'Logger') || 
            isMemberExpression(node, 'console')) {
          context.report({
            node,
            message: `❌ Logging not allowed in domain (${filePath}). Move to application/handler.`,
          });
        }
      }
    };
  }
}
```

Create `ops/scripts/check-domain-imports.sh`:
```bash
#!/bin/bash
# Ensure domain layer doesn't import infrastructure

echo "Checking domain layer imports..."

find src/core -path "*/domain/*.ts" | while read file; do
  if grep -E "from ['\"].*/(infrastructure|adapters|handlers)" "$file"; then
    echo "❌ $file imports infrastructure. Move to application layer."
    exit 1
  fi
done

echo "✓ Domain layer is pure"
```

**4. Update enforcement section in ADR**

Edit `docs/architecture-decisions/accepted/ADR-0021-domain-layer-pure.md`:

```markdown
## Enforcement

### Implemented ✅
- **ESLint**: `no-logging-in-domain` rule added to `tools/eslint-plugin/`
- **CI Script**: `check-domain-imports.sh` validates no infra imports

### PR References
- [#42: Add no-logging-in-domain ESLint rule](https://github.com/...)
- [#43: Add domain import validation script](https://github.com/...)

### Manual Review Checklist
- [ ] No `Logger`, `console.*` in domain
- [ ] ...rest of checklist...
```

---

## Example 3: Deprecating an Old Decision

### Scenario
Old caching strategy (ADR-0012) is being replaced by a new approach (ADR-0023).

### Steps

**1. Deprecate old ADR**
```bash
npm run adr:deprecate -- old-caching-strategy
```

Output:
```
✓ Moved: accepted/ADR-0012-old-caching-strategy.md → deprecated/
✓ Set status: Deprecated
✓ Updated: adr_index.md
```

**2. File is updated automatically**

The deprecated file now has:
```markdown
# Old Caching Strategy

⚠️ **DEPRECATED** — See [ADR-0023: New Caching Strategy](../accepted/ADR-0023-new-caching-strategy.md)

**Previous Status**: Accepted  
**Deprecated**: 2026-01-05  
...rest of original content...
```

**3. Index shows relationship**

In `docs/architecture-decisions/adr_index.md`:

```markdown
### Deprecated (1)
- [ADR-0012: Old Caching Strategy](./deprecated/ADR-0012-old-caching-strategy.md) ⚠️  
  **Replaced by**: [ADR-0023: New Caching Strategy](./accepted/ADR-0023-new-caching-strategy.md)
```

---

## Example 4: Superseding a Decision

### Scenario
ADR-0008 (Event Storage v1) was good, but we're replacing it with v2. Want to keep both for historical context.

### Steps

**1. Create new decision first**
```bash
npm run adr:new -- event-storage-v2
# Edit file with new design...
npm run adr:accept -- event-storage-v2
```

**2. Link old → new**
```bash
npm run adr:supersede -- event-storage-v1 event-storage-v2
```

Output:
```
✓ Moved: accepted/ADR-0008-event-storage-v1.md → superseded/
✓ Set ADR-0008 status: Superseded by ADR-0023 Event Storage v2
✓ Added to ADR-0023: Supersedes ADR-0008
✓ Updated: adr_index.md

Bidirectional links established:
  ADR-0008 → ADR-0023 ✓
  ADR-0023 → ADR-0008 ✓
```

**3. Old ADR file now contains**
```markdown
# Event Storage v1

**Status**: Superseded by [ADR-0023: Event Storage v2](../accepted/ADR-0023-event-storage-v2.md)

**Why superseded**: v2 supports multi-tenant event streams and provides better query performance.

...original content for historical reference...
```

**4. New ADR file contains**
```markdown
# Event Storage v2

**Status**: Accepted  
**Supersedes**: [ADR-0008: Event Storage v1](../superseded/ADR-0008-event-storage-v1.md)

### Migration Path
See [ADR-0008](../superseded/ADR-0008-event-storage-v1.md) for why this supersedes the previous approach.
Event streams can be migrated using the v2 adapter.

...new design...
```

**5. Index shows chain**
```markdown
### Superseded (1)
- [ADR-0008: Event Storage v1](./superseded/ADR-0008-event-storage-v1.md)  
  **Superseded by**: [ADR-0023: Event Storage v2](./accepted/ADR-0023-event-storage-v2.md)

### Accepted (18)
- [ADR-0023: Event Storage v2](./accepted/ADR-0023-event-storage-v2.md)  
  **Supersedes**: [ADR-0008: Event Storage v1](./superseded/ADR-0008-event-storage-v1.md)
```

---

## Example 5: Listing and Filtering ADRs

### List All
```bash
npm run adr:list
```

Output:
```
Architecture Decision Records (24 total)

📋 PROPOSED (3)
  ADR-0025: API Versioning Strategy
    Tags: api, design
    
📌 ACCEPTED (18)
  ADR-0001: DDD as Foundation
  ADR-0002: Command/Query as Primitives
  ADR-0021: Domain Layer Pure
  ...
  
⛔ DEPRECATED (2)
  ADR-0012: Old Caching Strategy (→ ADR-0023)
  
🔗 SUPERSEDED (1)
  ADR-0008: Event Storage v1 (→ ADR-0023)
```

### Filter by Status
```bash
npm run adr:list -- --status=proposed
```

Output:
```
PROPOSED ADRs (3)

  ADR-0020: Logging Framework Choice
    Tags: observability, tooling
    Deciders: Virgil, Sarah
    
  ADR-0021: Domain Layer Pure
    Tags: architecture, enforcement, domain
    Deciders: Virgil
    
  ADR-0025: API Versioning Strategy
    Tags: api, design
    Deciders: Mike
```

### Filter by Tag
```bash
npm run adr:list -- --tag=enforcement
```

Output:
```
ADRs with tag: enforcement (5)

  ✓ ADR-0001: DDD as Foundation — Accepted
    Enforcement: Generators, ESLint
  
  ✓ ADR-0002: Command/Query as Primitives — Accepted
    Enforcement: Generators (command/query), ESLint rules
  
  ✓ ADR-0021: Domain Layer Pure — Proposed
    Enforcement: ESLint rules (pending), CI scripts (pending)
  
  ⚠️ ADR-0012: Old Caching Strategy — Deprecated
    (See ADR-0023 for enforcement)
  
  ✓ ADR-0023: New Caching Strategy — Accepted
    Enforcement: CI script, benchmarks
```

---

## Example 6: Validating all ADRs

### Quick Validation
```bash
npm run adr:validate
```

Output:
```
✓ Validating 24 ADRs...

✓ ADR-0001 through ADR-0019: OK
⚠️ ADR-0020: Missing Enforcement section
❌ ADR-0021: Date field invalid (found "Jan 5", expected "2026-01-05")
✓ ADR-0022: OK
⚠️ ADR-0023: Enforcement section empty (has title, no content)
⚠️ ADR-0024: References point to non-existent ADR-0099
✓ ADR-0025: OK

Summary: 22 OK, 0 Critical, 3 Warnings
Run: npm run adr:validate -- --fix  (to auto-fix fixable issues)
```

### Auto-Fix
```bash
npm run adr:validate -- --fix
```

Output:
```
✓ Fixed 1 issue:
  ✓ ADR-0021: Reformatted date to 2026-01-05

⚠️ Manual review needed (2 issues):
  ⚠️ ADR-0020: Add Enforcement section (see template)
  ⚠️ ADR-0024: Check reference to ADR-0099 (does it exist?)

Run: npm run adr:validate again after manual fixes
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/adr-validation.yml
name: ADR Validation

on: [pull_request]

jobs:
  validate-adrs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run adr:validate
        # Fails if any critical issues found
```

### Pre-commit Hook

```bash
# .husky/pre-commit
npm run adr:validate || {
  echo "❌ ADR validation failed. Run: npm run adr:validate --fix"
  exit 1
}
```

---

These examples show how the ADR tool integrates into daily workflow: proposing, discussing, accepting, and maintaining architectural decisions.
