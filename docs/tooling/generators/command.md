# Command Generator

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

## When to Use

Create a **Command** when you need to **mutate application state**:
- User creates account
- Order is placed
- Payment is processed
- Configuration is updated

**Not for**: Reading data (use Query instead).

## Context

[ADR-0002: Command and Query as First-Class Primitives](../../architecture-decisions/accepted/command-query-as-primitives.md) explains why Commands are first-class primitives: serializable, versionable, idempotent, traceable, and immutable.

## Quick Start

```bash
nx generate @local/ddd:command --context=orders --name=PlaceOrder --result=Order
```

Creates:
```
src/core/orders/application/commands/
├── PlaceOrder.ts
├── PlaceOrder.validation.spec.ts
├── PlaceOrder.serialization.spec.ts
└── index.ts (updated)
```

See [TEMPLATE.md](TEMPLATE.md) for common patterns (base class, private constructor, Result type, etc).

## Unique Features

## Unique Features

### 1. Zod Validation + TypeScript Inference

```typescript
export const PlaceOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(z.object({
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
  notes: z.string().optional(),
});

export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;

export class PlaceOrder extends Command<Order> {
  static create(input: PlaceOrderInput): Result<PlaceOrder, ValidationError> {
    const validated = PlaceOrderSchema.safeParse(input);
    if (!validated.success) return Result.fail(new ValidationError(...));
    return Result.ok(new PlaceOrder(...validated.data));
  }
}
```

### 2. Serialization Support (Message Bus / Storage)

```typescript
toPrimitives() {
  return {
    customerId: this.customerId,
    items: this.items,
    notes: this.notes,
    id: this.id,
    correlationId: this.correlationId,
    version: this.version,
  };
}

static fromPrimitives(primitives: unknown): Result<PlaceOrder, ValidationError> {
  const validated = PlaceOrderSchema.safeParse(primitives);
  if (!validated.success) return Result.fail(new ValidationError(...));
  
  const data = primitives as any;
  return Result.ok(new PlaceOrder(
    validated.data.customerId,
    validated.data.items,
    validated.data.notes,
    data.id,
    data.correlationId,
    data.version ?? 1,
  ));
}
```

### 3. Auto-Generated Metadata

```typescript
export class PlaceOrder extends Command<Order> {
  private constructor(
    readonly customerId: string,
    readonly items: Array<{ sku: string; quantity: number }>,
    readonly notes: string | undefined,
    readonly id: string,              // ✅ commandId for idempotency
    readonly correlationId: string,   // ✅ distributed tracing
    readonly version: number = 1,     // ✅ schema evolution
  ) {
    super();
  }
}
```

## Test Files

Two test files are generated:

1. **`{Name}.validation.spec.ts`** — Zod schema tests
   - Happy path: valid input succeeds
   - Invalid fields rejected
   - Optional fields handled
   - Immutability enforced
   
2. **`{Name}.serialization.spec.ts`** — Round-trip tests
   - `create()` → `toPrimitives()` → `fromPrimitives()` consistency
   - Message bus serialization/deserialization
   - Idempotency key preservation

## Key Rules

✅ **DO**:
- Use Zod for validation schema
- Return `Result<Command, ValidationError>` from factory
- Make all fields `readonly`
- Include `id` + `correlationId` for tracing
- Implement `toPrimitives()` + `fromPrimitives()`
- Create 2 test files (validation + serialization)

❌ **DON'T**:
- Put business logic in command (validation only)
- Throw exceptions (return Result instead)
- Make command mutable
- Skip serialization tests (required for message buses)

## Related Documentation

- [Command specification](../../ddd-implementation/primitives/command/specification.md)
- [ADR-0002: Command/Query as First-Class Primitives](../../architecture-decisions/accepted/command-query-as-primitives.md)
- [UseCase spec](../../ddd-implementation/primitives/use-case/specification.md) — Commands are input to use cases

---

See [generators/README.md](README.md) for overview of all generators.

## Template: {Name}.specification.md (generate alongside the command)

Use this exact file content when scaffolding the instance-level spec for a command. Paths assume the spec lives near the code (adjust if you place it elsewhere).

```markdown
# {Name} Command Specification

**Parent spec**: ../../ddd-implementation/primitives/command/specification.md  
**Purpose**: capture only instance-specific details; omit anything identical to the parent.

## What this command does (1–2 sentences)
- [FILL IN: business intent/context]
- [FILL IN: outcome/state change]

## Inputs and meaning
- [FILL IN: required/optional fields and semantics; note ids that flow to billing/shipping/etc]
- [FILL IN: constraints or defaulting rules unique here]

## Invariants and validation
- [FILL IN: key invariants enforced by schema]
- [FILL IN: cross-field rules unique here]

## Side effects / events
- [FILL IN: events emitted or external systems that rely on fields]
- [FILL IN: ordering/idempotency expectations]

## Callers and consumers
- Callers: [FILL IN: which handler/use case constructs this command]
- Consumers: [FILL IN: which use case executes it; downstream listeners depending on payload]

## Serialization and lifecycle
- [FILL IN: fields that must survive round-trip; versioning/idempotency notes]
- [FILL IN: correlation/tracing requirements if special]

## Error cases (instance-specific)
- [FILL IN: validation failures or business rejections unique here]

## Observability (only if special)
- [FILL IN or “None”]

## Related docs
- Parent: ../../ddd-implementation/primitives/command/specification.md
- Neighbors: [FILL IN other relevant specs]

**Generated by**: nx generate @local/ddd:command --context={context} --name={name}  
**Last updated**: [Auto-generated date]
```

## Template: {Name}.enforcement.md (generate alongside the command)

Generate this file verbatim. It documents instance-specific guardrails beyond the parent enforcement contract.

```markdown
# {Name} Command Enforcement

**Parent enforcement**: ../../ddd-implementation/primitives/command/enforcement.md  
**Purpose**: capture only what is unique to this command; the parent already enforces the rest.

## Why this command is sensitive
- [FILL IN: critical path (revenue/safety/regulatory)]
- [FILL IN: fields/behaviors downstream depend on]

## Required shape & schema deltas
- [FILL IN: fields that must not be removed/renamed; semantics]
- [FILL IN: Zod specifics (coercions, min/max, enums) that are instance-only]

## Invariants to enforce
- [FILL IN: instance-only invariants and cross-field rules]
- [FILL IN: idempotency/version rules if special]

## Safe changes checklist (impact map)
- If fields change: update schema, factory, serialization, handlers, downstream consumers
- If events/result shape change: update listeners/contracts and tests
- If id/correlation/version change: justify, add migration notes, update tests

## Minimal tests required
- Validation: happy path + representative failures for key invariants
- Serialization: round-trip keeps id, correlationId, version, and critical fields
- Regression cases unique to this command

## Collaborators
- Callers: [FILL IN: which handler/use case constructs it]
- Consumers: [FILL IN: which use case executes it; downstream listeners relying on payload/events]

## Anti-patterns (instance-specific)
- [FILL IN: only what is unique here beyond parent bans]

## Observability (only if special)
- [FILL IN tracing/logging requirements] or “None”

**Generated by**: nx generate @local/ddd:command --context={context} --name={name}  
**Last updated**: [Auto-generated date]
```
