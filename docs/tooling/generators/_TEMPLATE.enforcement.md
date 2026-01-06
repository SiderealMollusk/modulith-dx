# {Name} Enforcement

Instance-level enforcement for this generated primitive. Keep this short; only capture what is **unique** to this instance that is **not already enforced** by the parent primitive’s enforcement.md.

> Fill in the `[FILL IN]` placeholders with the specifics of THIS implementation.

## What’s Unique Here
- [FILL IN: Why this instance matters (e.g., critical integration, revenue path, safety constraint)]
- [FILL IN: Any special fields or behaviors that downstream depend on]

## Safe Modifications (Impact & Required Updates)
- If you add/change/remove fields: [FILL IN minimal required updates: schema, tests, handlers, consumers]
- If you change result shape or events: [FILL IN downstream impacts]
- If you touch idempotency/correlation/version: [FILL IN risks]

## Minimal Testing Expectations
- Always: [FILL IN 2–4 critical cases, e.g., round-trip serialization, key invariant happy + failure]
- When modified: [FILL IN what must be rerun, e.g., handler tests, integration with EventBus]

## Integration Map (Only the specifics)
- Callers: [FILL IN who constructs/uses it]
- Consumers: [FILL IN who relies on its shape/events]
- External dependencies: [FILL IN any external/system contracts]

## Anti-Patterns (Instance-Specific)
- [FILL IN 3–6 bullets; only what’s special for this instance that parent rules don’t cover]

## Observability Notes (If special)
- Tracing/logging/metrics only if this instance has requirements beyond the parent. Otherwise: “No instance-specific observability requirements.”

## Quick Review Checklist
- [ ] Schema & tests updated for any field changes
- [ ] Round-trip serialization still passes (if applicable)
- [ ] Downstream consumers still receive required fields/events
- [ ] No new forbidden deps (e.g., repos in commands)

## See Also
- Parent type enforcement: ../../ddd-implementation/primitives/{primitive}/enforcement.md
- Related specs/enforcement for neighbors: [FILL IN paths]
