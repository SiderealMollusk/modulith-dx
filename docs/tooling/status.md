# Tooling Infrastructure Status

**Last Updated**: January 5, 2026  
**Overall Status**: 🟠 **Planned, Not Yet Implemented**

## Current State

None of the tooling described in this folder currently exists. This is a **documentation specification** for tooling infrastructure that needs to be built.

## What Should Exist

| Component | Purpose | Status |
|-----------|---------|--------|
| **ADR Management Tool** | Create/manage Architecture Decision Records | ❌ Not built |
| **Nx Generators** | Scaffold DDD primitives (Entity, Command, Query, etc.) | ❌ Not built |
| **ESLint Custom Rules** | Enforce architectural constraints at lint time | ❌ Not built |
| **CI/CD Scripts** | Validate file structure, imports, test coverage | ❌ Not built |
| **Dev Container** | Standardized development environment | ❌ Not built |

## Implementation Timeline

See [**Phase-by-Phase Plan**](../../plans/current.md) for detailed breakdown of what needs to be built and in what order.

**Quick summary**:
- **Week 1**: Directory structure + ADR tool + Command/Query generators
- **Week 2**: Entity/ValueObject generators + validation scripts + core ESLint rules
- **Week 3+**: Remaining generators, dev container, documentation

## For Developers Now

**If you want to create a primitive today**:
1. Follow the structure described in [docs/ddd-implementation/primitives/](../ddd-implementation/primitives/README.md)
2. Use existing examples in [src/core/example/](../../src/core/example/)
3. Manually create test files (validation + serialization for Commands/Queries)

**Example manually creating a Command**:
```typescript
// src/core/orders/application/commands/PlaceOrder.ts
import { Command } from '@shared/kernel';
import { z } from 'zod';

export const PlaceOrderSchema = z.object({
  customerId: z.string().brand<'CustomerId'>(),
  items: z.array(z.object({ sku: z.string(), qty: z.number() })),
});

export class PlaceOrder extends Command<Order> {
  static create(dto: z.infer<typeof PlaceOrderSchema>): Result<PlaceOrder, ValidationError> {
    const validated = PlaceOrderSchema.safeParse(dto);
    if (!validated.success) return Result.fail(new ValidationError(...));
    return Result.ok(new PlaceOrder(validated.data, generateId(), generateCorrelationId()));
  }
}
```

Then manually create:
- `PlaceOrder.validation.spec.ts` - Test the Zod schema
- `PlaceOrder.serialization.spec.ts` - Test toPrimitives/fromPrimitives

## Next Steps

1. **Implement Phase 1**: Directory structure (`ops/scripts/`, `tools/generators/`, `tools/eslint-plugin/`, `.devcontainer/`)
2. **Implement Phase 2**: ADR management tool (`scripts/adr.ts`)
3. **Implement Phase 3**: Nx generators for primitives
4. **Implement Phase 4**: CI/CD shell scripts
5. **Implement Phase 5**: ESLint custom rules
6. **Implement Phase 6**: Dev container setup
7. **Implement Phase 7**: Update package.json scripts
8. **Implement Phase 8**: Update documentation

**See**: [plans/current.md](../../plans/current.md) for full details and dependencies.

## Architecture Decision Links

These ADRs guide what the tooling must enforce:
- [Command and Query as First-Class Primitives](../architecture-decisions/accepted/command-query-as-primitives.md) - Why Commands/Queries need Zod validation + serialization
- See [docs/ddd-implementation/primitives/](../ddd-implementation/primitives/README.md) for all 13 primitives the generators must scaffold

