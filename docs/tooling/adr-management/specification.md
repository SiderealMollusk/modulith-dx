# ADR Management Tool

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

## What It Does

The ADR tool automates the workflow for creating, managing, and tracking Architecture Decision Records.

**Built as**: Nx plugin (`@local/adr`) with generators and executors

## Commands (Nx Integration)

### `nx generate @local/adr:new --slug=<slug>`

Create a new ADR in `docs/architecture-decisions/proposed/`.

```bash
nx generate @local/adr:new --slug=domain-layer-must-be-pure
```

**Generates**:
```
docs/architecture-decisions/proposed/
└── ADR-0021-domain-layer-must-be-pure.md
```

**Template**: Includes metadata (Status, Deciders, Date, Tags, Impact) and standard sections (Problem, Decision, Why This Matters, Trade-offs, Enforcement, References).

**Output**:
```
✓ Created: docs/architecture-decisions/proposed/ADR-0021-domain-layer-must-be-pure.md
? Next: Edit the file, then run: npm run adr:accept -- domain-layer-must-be-pure
```

---

### `nx run tooling:adr-accept --slug=<slug>`

Promote from `proposed/` → `accepted/`, update index, set Status to "Accepted".

```bash
nx run tooling:adr-accept --slug=domain-layer-must-be-pure
```

**Actions**:
1. ✅ Move file: `proposed/ADR-0021-...` → `accepted/ADR-0021-...`
2. ✅ Set `Status: Accepted` + update `Date`
3. ✅ Regenerate `docs/architecture-decisions/adr_index.md`
4. ✅ Update any linked decisions

**Output**:
```
✓ Accepted: ADR-0021-domain-layer-must-be-pure
✓ Updated: adr_index.md
? Next: Add enforcement rules to tools/eslint-plugin/ or ops/scripts/
```

---

### `nx run tooling:adr-deprecate --slug=<slug>`

Mark as deprecated, move to `deprecated/`, keep old ADR number.

```bash
nx run tooling:adr-deprecate --slug=old-architecture-pattern
```

**Actions**:
1. ✅ Move file: `proposed/` or `accepted/` → `deprecated/`
2. ✅ Set `Status: Deprecated`
3. ✅ Prepend notice: *"⚠️ This decision has been deprecated. See [ADR-0025](./ADR-0025-...) for the replacement."*
4. ✅ Update index

---

### `nx run tooling:adr-supersede --old=<old-slug> --new=<new-slug>`

Mark old decision as superseded by new one, link them bidirectionally.

```bash
nx run tooling:adr-supersede --old=old-caching-strategy --new=new-caching-strategy
```

**Actions**:
1. ✅ Find old ADR by slug
2. ✅ Find new ADR by slug
3. ✅ Set old Status: `Superseded by ADR-XXXX`
4. ✅ Add to new ADR: `Supersedes: ADR-XXXX`
5. ✅ Move old to `superseded/`
6. ✅ Update index with both links

**Output**:
```
✓ ADR-0018 superseded by ADR-0023
✓ Updated: adr_index.md
```

---

### `nx run tooling:adr-list [--status=...] [--tag=...]`

List all ADRs with status, impact, tags, enforcement.

```bash
nx run tooling:adr-list
nx run tooling:adr-list --status=proposed
nx run tooling:adr-list --tag=observability
nx run tooling:adr-list --status=accepted --tag=enforcement
```

**Output**:
```
Architecture Decision Records

📋 PROPOSED (3)
  ADR-0021: Domain Layer Must Be Pure
    Tags: architecture, enforcement
    Impact: All domain code
    Enforcement: ESLint + manual review

📌 ACCEPTED (18)
  ADR-0001: DDD as Foundation
    Tags: architecture, core
    Impact: Project-wide
    Enforcement: Generators + ESLint
  
  ADR-0002: Command/Query as Primitives
    Tags: application, observability
    Impact: All commands/queries
    Enforcement: Generators + ESLint: require-command-base
    
⛔ DEPRECATED (2)
  ADR-0005: Old Caching Strategy (⚠️ Use ADR-0023 instead)

🔗 SUPERSEDED (1)
  ADR-0008: Event Storage v1 (→ ADR-0023)

Total: 24 ADRs
```

---

### `nx run tooling:adr-validate [--fix]`

Check all ADRs for metadata compliance (Status, Deciders, Date, Tags, Impact, Enforcement sections).

```bash
nx run tooling:adr-validate
nx run tooling:adr-validate --fix
```

**Checks**:
- ✅ File format: `ADR-XXXX-slug-name.md`
- ✅ Metadata present: Status, Deciders, Date, Tags, Impact
- ✅ Sections present: Problem, Decision, Enforcement, References
- ✅ Status valid: Proposed, Accepted, Deprecated, Superseded
- ✅ Links valid: References to other ADRs exist
- ✅ No orphans: All ADRs listed in index

**Output** (with problems):
```
⚠️ Validation Issues Found

❌ ADR-0019: Missing Deciders
❌ ADR-0023: Date should be YYYY-MM-DD, found "Jan 5"
⚠️ ADR-0015: Impact section empty
⚠️ ADR-0021: Enforcement section incomplete (no test coverage)
✓ ADR-0001-0018, 0020, 0022, 0024: OK

Run: npm run adr:validate -- --fix
```

With `--fix`:
```
✓ Fixed: ADR-0019 (added empty Deciders field)
✓ Fixed: ADR-0023 (reformatted date to 2026-01-05)
⚠️ Manual review needed: ADR-0015 (Impact section)
⚠️ Manual review needed: ADR-0021 (Enforcement section)
```

---

## How It Works

### ADR File Format

Every ADR follows this structure:

```markdown
# Domain Layer Must Be Pure

**Deciders**: Virgil (lead), Team  
**Date**: 2026-01-05  
**Status**: Proposed  
**Tags**: architecture, enforcement, domain  
**Impact**: All domain code in `src/core/{context}/domain/`  

## Problem

[Why this decision is needed...]

## Decision

[What we decided to do...]

## Why This Matters

[Benefits and rationale...]

## Trade-offs

[What we're giving up or accepting...]

## Enforcement

- **ESLint**: `no-logging-in-domain` rule
- **CI Script**: `check-domain-purity.sh`
- **Testing**: Domain tests must not use mocks
- **Review Checklist**: See CONTRIBUTING.md

## References

- [Entity specification](../../ddd-implementation/primitives/entity/specification.md)
- [Observability Inventory](../../enforced-architecture/OBSERVABILITY_INVENTORY/README.md)
- Related: [ADR-0002: Command/Query as Primitives](../accepted/ADR-0002-command-query-as-primitives.md)
```

### Metadata Fields

| Field | Purpose | Example |
|-------|---------|---------|
| **Deciders** | Who made the decision | Virgil (lead), Team |
| **Date** | Decision date (ISO 8601) | 2026-01-05 |
| **Status** | Proposed, Accepted, Deprecated, Superseded | Accepted |
| **Tags** | Categories for filtering | architecture, observability, enforcement |
| **Impact** | Scope and affected code | All domain code, all commands/queries |

### Status Workflow

```
     ┌─────────────┐
     │  PROPOSED   │
     └──────┬──────┘
            │
            ├──[accept]──→ ┌──────────────┐
            │              │  ACCEPTED    │
            │              └──────────────┘
            │
            ├──[deprecate]→ ┌─────────────┐
            │               │ DEPRECATED  │
            │               └─────────────┘
            │
            └──[delete]──→ [Remove from repo]

     ACCEPTED can also:
            ├──[deprecate]→ DEPRECATED
            └──[supersede]→ SUPERSEDED (with link to new ADR)
```

---

## Index File

The tool automatically maintains `docs/architecture-decisions/adr_index.md`:

```markdown
# Architecture Decision Records (ADR Index)

**Total**: 24 ADRs | **Accepted**: 18 | **Proposed**: 3 | **Deprecated**: 2 | **Superseded**: 1

## By Status

### Proposed (3)
- [ADR-0021: Domain Layer Must Be Pure](./proposed/ADR-0021-domain-layer-must-be-pure.md) — architecture, enforcement

### Accepted (18)
- [ADR-0001: DDD as Foundation](./accepted/ADR-0001-ddd-as-foundation.md) — core, enforcement  
  **Impact**: Project-wide | **Enforcement**: Generators
  
- [ADR-0002: Command/Query as Primitives](./accepted/ADR-0002-command-query-as-primitives.md) — application, observability  
  **Impact**: All commands/queries | **Enforcement**: ESLint rules, Generators

### Deprecated (2)
- [ADR-0005: Old Caching Strategy](./deprecated/ADR-0005-old-caching-strategy.md) ⚠️  
  *Superseded by [ADR-0023](./accepted/ADR-0023-new-caching-strategy.md)*

### Superseded (1)
- [ADR-0008: Event Storage v1](./superseded/ADR-0008-event-storage-v1.md) → [ADR-0023: Event Storage v2](./accepted/ADR-0023-event-storage-v2.md)

## By Tag

### architecture (8)
- ADR-0001, ADR-0021, ...

### enforcement (12)
- ADR-0002, ADR-0007, ADR-0021, ...

### observability (5)
- ADR-0002, ADR-0009, ...
```

---

## Implementation Details

### Nx Plugin Structure

```
tools/adr/
├── package.json                    # @local/adr plugin
├── generators/
│   └── new/
│       ├── schema.json             # Nx schema for 'new' generator
│       ├── schema.d.ts
│       └── index.ts                # Generator implementation
├── executors/
│   ├── accept/
│   │   ├── schema.json
│   │   └── executor.ts             # Accept ADR executor
│   ├── deprecate/
│   │   ├── schema.json
│   │   └── executor.ts
│   ├── supersede/
│   │   ├── schema.json
│   │   └── executor.ts
│   ├── list/
│   │   ├── schema.json
│   │   └── executor.ts
│   └── validate/
│       ├── schema.json
│       └── executor.ts
└── src/
    ├── lib/
    │   ├── update-index.ts         # Regenerate adr_index.md
    │   ├── validate-metadata.ts    # Check template compliance
    │   └── file-operations.ts      # Move/update ADR files
    └── templates/
        └── adr-template.md         # ADR file template
```

### Dependencies
- **Language**: TypeScript
- **Framework**: Nx Devkit (`@nx/devkit`)
- **Filesystem**: Node fs
- **Templating**: Nx generators + string interpolation
- **Markdown parsing**: Simple regex (extract metadata from YAML-like block)

### Files Created/Modified

| File | When | What |
|------|------|------|
| `tools/adr/` | Install | Nx plugin (generators + executors) |
| `docs/architecture-decisions/{proposed,accepted,deprecated,superseded}/ADR-XXXX-*.md` | Generator/executor | Decision documents |
| `docs/architecture-decisions/adr_index.md` | Executors | Auto-generated index |
| `.adr-metadata.json` (optional) | Generator | Track next ADR number |

### Next ADR Number

The tool tracks the next ADR number (avoid conflicts). Either:
1. **Store in `.adr-metadata.json`**: `{ "nextNumber": 25 }`
2. **Scan filesystem**: Find all `ADR-XXXX-` files, use max + 1

---

## Example Workflow

### Day 1: Propose a Decision

```bash
npm run adr:new -- use-typescript-for-types
```

Output:
```
✓ Created: docs/architecture-decisions/proposed/ADR-0021-use-typescript-for-types.md
```

Edit the file, fill in Problem/Decision/Trade-offs...

### Day 3: Team Approves

```bash
npm run adr:accept -- use-typescript-for-types
```

Output:
```
✓ Accepted: ADR-0021
✓ Updated: adr_index.md
✓ Status changed: Proposed → Accepted
```

Now the ADR is at: `docs/architecture-decisions/accepted/ADR-0021-use-typescript-for-types.md`

### Later: Better Approach Found

```bash
npm run adr:new -- use-branded-types-for-safety
npm run adr:supersede -- use-typescript-for-types use-branded-types-for-safety
```

Output:
```
✓ Created: docs/architecture-decisions/proposed/ADR-0022-use-branded-types-for-safety.md
✓ Moved: ADR-0021 → superseded/
✓ Linked: ADR-0021 → ADR-0022
✓ Updated: adr_index.md
```

Now:
- `ADR-0021` has status `Superseded by ADR-0022` + link
- `ADR-0022` has status `Accepted` + reverse link to ADR-0021
- Index shows both with their relationship

---

## Integration with Docs

- ADRs link to [docs/ddd-implementation/primitives/](../ddd-implementation/primitives/README.md) specs
- Primitive specs link back to relevant ADRs
- `adr_index.md` shows enforcement for each ADR (links to ESLint rules, generators, etc.)
- CONTRIBUTING.md references ADRs for decision context

See [ADR examples](examples.md) for real usage.
