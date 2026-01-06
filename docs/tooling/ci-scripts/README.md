# CI Scripts

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

## Purpose

Shell scripts in `ops/scripts/` validate architecture at CI time:
- File structure follows context-first organization
- Import dependencies respect layering
- All Commands/Queries have dual test files
- Observability inventory is up-to-date

## Scripts Overview

| Script | Purpose | When | Status |
|--------|---------|------|--------|
| `check-file-structure.sh` | Validate context-first layout | Pre-commit + CI | ❌ Planned |
| `validate-imports.sh` | Check layer boundaries | CI | ❌ Planned |
| `check-test-coverage.sh` | Ensure dual tests for Commands/Queries | CI | ❌ Planned |
| `validate-observability-inventory.sh` | Keep inventory in sync | CI | ❌ Planned |

## Script Details

### `check-file-structure.sh`

**What it does**: Validate that primitives are in correct folders.

**Checks**:
- ✅ Entities in `{context}/domain/entities/`
- ✅ ValueObjects in `{context}/domain/value-objects/`
- ✅ DomainEvents in `{context}/domain/events/`
- ✅ Commands in `{context}/application/commands/`
- ✅ Queries in `{context}/application/queries/`
- ✅ UseCases in `{context}/application/use-cases/`
- ✅ Handlers in `{context}/interface/handlers/`
- ✅ Repositories in `{context}/application/ports/` (port) and `{context}/infrastructure/adapters/` (adapter)

**Usage**:
```bash
ops/scripts/check-file-structure.sh
```

**Output (pass)**:
```
✓ Checking file structure...
✓ src/core/identity/domain/entities/User.ts — correct location
✓ src/core/identity/application/commands/CreateUser.ts — correct location
✓ src/core/orders/interface/handlers/PlaceOrderHttpHandler.ts — correct location
✓ All 47 files in correct locations
```

**Output (fail)**:
```
❌ src/core/identity/application/CreateUser.ts — wrong location
   Expected: src/core/identity/application/commands/CreateUser.ts
   (File looks like Command, but is in application/, not application/commands/)

❌ src/core/orders/domain/OrderRepository.ts — wrong location
   Expected: src/core/orders/application/ports/OrderRepository.ts
   (File looks like Repository interface, should be in ports/)

2 files in wrong locations
```

**Implementation**:
```bash
#!/bin/bash

check_file() {
  local file=$1
  local context=$(echo "$file" | grep -oE "src/core/[^/]+" | cut -d/ -f3)
  
  if [[ $file =~ (Entity|Aggregate).ts$ ]]; then
    # Should be in domain/entities/
    if [[ ! $file =~ /domain/entities/ ]]; then
      echo "❌ $file — wrong location (should be in domain/entities/)"
      return 1
    fi
  elif [[ $file =~ (Command|Query).ts$ && ! $file =~ (\.spec\.ts|\.validation|\.serialization)$ ]]; then
    # Should be in application/commands/ or application/queries/
    if [[ $file =~ Command && ! $file =~ /application/commands/ ]]; then
      echo "❌ $file — wrong location (should be in application/commands/)"
      return 1
    fi
  # ... more checks ...
  fi
  
  echo "✓ $file — correct location"
  return 0
}

find src/core -type f -name "*.ts" ! -path "*/node_modules/*" | while read file; do
  check_file "$file" || exit 1
done

echo "✓ All files in correct locations"
```

---

### `validate-imports.sh`

**What it does**: Ensure imports respect layering rules.

**Rules**:
- ❌ Domain cannot import from `application/`, `infrastructure/`, `interface/`
- ❌ Application cannot import from `infrastructure/` (except via DI)
- ❌ Infrastructure can import from application (ports), but not handler logic
- ❌ No circular imports between contexts

**Usage**:
```bash
ops/scripts/validate-imports.sh
```

**Output (pass)**:
```
✓ Validating import dependencies...

Context: identity
  ✓ domain/ — no application/infrastructure/interface imports
  ✓ application/ — imports domain (allowed), no infrastructure direct imports
  ✓ infrastructure/ — imports application/ports (allowed)
  ✓ interface/ — imports application (allowed)

Context: orders
  ✓ domain/ — clean
  ✓ application/ — clean
  ✓ infrastructure/ — clean
  ✓ interface/ — clean

✓ No circular imports detected
✓ All import boundaries respected
```

**Output (fail)**:
```
❌ src/core/identity/domain/entities/User.ts imports infrastructure:
   import { InMemoryUserRepository } from '../../infrastructure/adapters/InMemoryUserRepository';
   
   Domain cannot import infrastructure. Use dependency injection in application layer.

❌ src/core/orders/application/use-cases/PlaceOrder.ts has circular import:
   PlaceOrder.ts → OrderService.ts → PlaceOrder.ts
   
   Break cycle by extracting OrderService to separate module.

2 import violations
```

**Implementation** (simplified):
```bash
#!/bin/bash

check_imports() {
  local file=$1
  local layer=$(echo "$file" | grep -oE "/(domain|application|infrastructure|interface)/" | head -1 | tr -d '/')
  
  case "$layer" in
    domain)
      # Domain cannot import from application, infrastructure, interface
      if grep -E "from ['\"].*/(application|infrastructure|interface)" "$file"; then
        echo "❌ $file: domain cannot import from other layers"
        return 1
      fi
      ;;
    application)
      # Application can import domain, but not infrastructure directly
      if grep -E "from ['\"].*/infrastructure/(adapters|mappers)" "$file" && \
         ! grep -E "from ['\"].*/(ports)" "$file"; then
        echo "❌ $file: application cannot import infrastructure (except via ports)"
        return 1
      fi
      ;;
    infrastructure)
      # Infrastructure can import application/ports only
      if grep -E "from ['\"].*/application/(use-cases|handlers)" "$file"; then
        echo "❌ $file: infrastructure cannot import use-cases/handlers"
        return 1
      fi
      ;;
  esac
  
  return 0
}

find src/core -name "*.ts" ! -path "*/node_modules/*" | while read file; do
  check_imports "$file" || exit 1
done

echo "✓ All imports respect layer boundaries"
```

---

### `check-test-coverage.sh`

**What it does**: Ensure Commands/Queries have both test files.

**Requirements**:
- Every `Command` must have `{Name}.validation.spec.ts` + `{Name}.serialization.spec.ts`
- Every `Query` must have `{Name}.validation.spec.ts` + `{Name}.serialization.spec.ts`
- UseCase/Handler must have `{Name}.spec.ts` (unit) + `{Name}.integration.spec.ts` (optional but recommended)

**Usage**:
```bash
ops/scripts/check-test-coverage.sh
```

**Output (pass)**:
```
✓ Checking test coverage...

Commands:
  ✓ CreateUser.ts → CreateUser.validation.spec.ts ✓ CreateUser.serialization.spec.ts
  ✓ UpdateUser.ts → UpdateUser.validation.spec.ts ✓ UpdateUser.serialization.spec.ts
  ✓ DeleteUser.ts → DeleteUser.validation.spec.ts ✓ DeleteUser.serialization.spec.ts

Queries:
  ✓ GetUserById.ts → GetUserById.validation.spec.ts ✓ GetUserById.serialization.spec.ts
  ✓ ListUsers.ts → ListUsers.validation.spec.ts ✓ ListUsers.serialization.spec.ts

UseCases:
  ✓ CreateUserUseCase.ts → CreateUserUseCase.spec.ts
  ⚠️  CreateUserUseCase.integration.spec.ts (recommended)

✓ All Commands/Queries have dual test files
⚠️  6 UseCases missing integration tests (optional)
```

**Output (fail)**:
```
❌ CreateUser.ts missing validation test
   Expected: CreateUser.validation.spec.ts

❌ CreateUser.ts missing serialization test
   Expected: CreateUser.serialization.spec.ts

❌ UpdateUserUseCase.ts missing unit test
   Expected: UpdateUserUseCase.spec.ts

3 test files missing
```

---

### `validate-observability-inventory.sh`

**What it does**: Check that [OBSERVABILITY_INVENTORY.md](../../enforced-architecture/OBSERVABILITY_INVENTORY/README.md) is up-to-date.

**Scans for**:
- All UseCase classes → Should have `✅` in inventory (logging, tracing, metrics)
- All Handler classes → Should have `✅` in inventory
- All domain classes → Should have `❌` in inventory (pure, no observability)

**Usage**:
```bash
ops/scripts/validate-observability-inventory.sh
```

**Output (pass)**:
```
✓ Validating observability inventory...

Found 23 UseCase classes:
  ✓ CreateUserUseCase — listed in inventory
  ✓ UpdateUserUseCase — listed in inventory
  ✓ DeleteUserUseCase — listed in inventory
  ...

Found 8 Handler classes:
  ✓ CreateUserHttpHandler — listed in inventory
  ✓ GetUserHttpHandler — listed in inventory
  ...

Found 42 Domain classes:
  ✓ User — marked as pure (no observability)
  ✓ Order — marked as pure (no observability)
  ...

✓ Inventory is up-to-date
```

**Output (fail)**:
```
⚠️  Missing from inventory:
  - CreateOrderUseCase (found in codebase, not in inventory)
  - ProcessPaymentUseCase (found in codebase, not in inventory)

⚠️  Stale in inventory:
  - LegacyUserValidator (listed in inventory, not found in codebase)

⚠️  Incorrectly marked:
  - Order.ts (marked as ❌ pure, but imports Logger!)

Run: ops/scripts/validate-observability-inventory.sh --update
     to auto-update inventory
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/architecture-validation.yml
name: Architecture Validation

on: [pull_request, push]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      
      - name: Check File Structure
        run: ops/scripts/check-file-structure.sh
      
      - name: Validate Imports
        run: ops/scripts/validate-imports.sh
      
      - name: Check Test Coverage
        run: ops/scripts/check-test-coverage.sh
      
      - name: Validate Observability
        run: ops/scripts/validate-observability-inventory.sh
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/bash

echo "🏗️  Checking architecture..."

ops/scripts/check-file-structure.sh || {
  echo "❌ File structure validation failed"
  exit 1
}

ops/scripts/validate-imports.sh || {
  echo "❌ Import validation failed"
  exit 1
}

echo "✓ Architecture checks passed"
```

## Troubleshooting

### File in wrong location

**Error**:
```
❌ src/core/identity/application/User.ts — wrong location
   Expected: src/core/identity/domain/entities/User.ts
```

**Fix**:
```bash
# Move file to correct location
mv src/core/identity/application/User.ts \
   src/core/identity/domain/entities/User.ts

# Update imports
npm run lint -- --fix
```

### Missing test file

**Error**:
```
❌ CreateUser.ts missing validation test
   Expected: CreateUser.validation.spec.ts
```

**Fix** (manually until generator exists):
```bash
# Create test file
touch src/core/orders/application/commands/CreateUser.validation.spec.ts

# Or use generator (when available)
nx generate command --context=orders --name=CreateUser --result=Order
```

### Import violation

**Error**:
```
❌ domain/entities/User.ts imports infrastructure
   import { Logger } from '../../infrastructure/logger';
```

**Fix**:
```typescript
// ❌ BAD: Remove infrastructure import
import { Logger } from '../../infrastructure/logger';

// ✅ GOOD: Move logging to UseCase
class CreateUserUseCase extends BaseUseCase {
  async execute(input) {
    // ...
    this.logger.info('User created'); // ✅ Logging at application boundary
  }
}
```

---

See [validation-checklist.md](validation-checklist.md) for complete validation reference.
