# Layer 2: Data Layer - Implementation

Practical implementation guidance for the Data Layer (ORM, queries, adapters).

## What Must Be True

**Mandatory invariants:**
- [ ] All queries wrapped in OTel spans
- [ ] Slow queries logged (> 200ms threshold)
- [ ] Migrations are reversible (up/down)
- [ ] No raw SQL without instrumentation
- [ ] Repository adapters implement port interfaces
- [ ] Mappers never return persistence models
- [ ] Connection pool configured and monitored
- [ ] Schema changes tested before production

## Templating Strategies

**Scaffolding for data layer:**
- Migration template: `npm run scaffold:migration create_users_table`
- Repository adapter template: `npm run scaffold:adapter UserRepository --context=users`
- Mapper template: `npm run scaffold:mapper UserMapper --context=users`

## Author-Time Verification

**Checks before commit:**
- Migrations pass (up/down reversible)
- Repository implements port interface
- Query spans configured
- Unit tests pass (in-memory adapters)

## Runtime Monitoring

**Observability metrics:**
- Query latency by table and operation
- Connection pool utilization
- Slow query count
- Migration execution time

## How to Edit

**Safe refactoring patterns:**
- Adding indexes (backward compatible)
- Adding nullable columns (safe migration)
- Renaming columns (with dual-write period)
- Changing adapters (swap at container level)

## How to Document

**Keeping schema docs current:**
- ER diagrams in repository
- Performance notes in migration comments
- Index justification documented
- Query hot spots tracked

## How to Test

**Testing data layer:**
- Unit: in-memory adapters
- Integration: ephemeral Docker database
- Migrations: test on data copy
- Error cases: connection failure, constraints

## Keep Aligned with Standards

**Validation:**
- Span attributes match db.* convention
- Query metrics use bounded tags
- Slow query threshold enforced
- Connection limits enforced
