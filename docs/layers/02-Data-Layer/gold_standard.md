# Layer 2: Data Layer

ORM, queries, schema management, and repository adapters with observability instrumentation.

## Overview

**What you provide:**
- ORM/query code (TypeScript)
- Schema definitions (migrations)
- Repository adapters (InMemoryUserRepository, PostgresUserRepository)
- Domain event → persistence mapping

**What you delegate:**
- Database engine (PostgreSQL, MySQL, etc.)
- Replication, backup, indexing (DBA/DevOps)

**Observability rules:**
- ✅ **Must:** Wrap queries in OTel spans (query text, duration)
- ✅ **Must:** Add query attributes (table, operation: SELECT/INSERT/UPDATE)
- ✅ **Must:** Log slow queries (latency > threshold)
- ✅ **Must:** Emit error span on query failure
- ❌ **Never:** Log sensitive data (passwords, PII)
- ❌ **Never:** Bypass ORM (no raw SQL without instrumentation)

**Enforced by:**
- ORM instrumentation plugin (auto-wraps queries)
- ESLint rule: flag raw SQL without span comment
- Slow query logs trigger alerts

### Observability Artifacts
```
Tempo traces:
  db.system=postgresql
  db.statement=SELECT * FROM users WHERE id=?
  db.duration_ms=45
  db.rows_affected=1

Prometheus metrics:
  postgresql_queries_total{operation=SELECT,table=users}
  postgresql_query_duration_ms{operation=SELECT,p99=150}
  postgresql_connection_pool_size=10

Loki logs:
  {service=modulith-dx, component=postgres}
    SLOW_QUERY: query took 234ms (threshold: 200ms)
    table=users, operation=UPDATE, rows_affected=5
```

## Create New

When adding a new data adapter:

1. **Define repository port** in application layer (interface)
2. **Create adapter implementation** in infrastructure/adapters
3. **Implement mapper** to transform domain ↔ persistence models
4. **Wire instrumentation** (query spans, slow query logging)
5. **Add integration tests** with real database (or in-memory for testing)
6. **Document** schema, query performance notes

Example adapter structure:
```
src/core/<context>/infrastructure/
├── adapters/
│   ├── InMemoryOrderRepository.ts    ← For testing
│   ├── PostgresOrderRepository.ts    ← For production
│   └── index.ts
├── mappers/
│   ├── OrderMapper.ts                ← Domain ↔ DB model
│   └── index.ts
└── migrations/
    ├── 001_create_orders_table.sql
    └── 002_add_order_status_index.sql
```

## Development Practices

1. **Schema Management**:
   - Use migrations (Knex, TypeORM, etc.) versioned in git
   - Each migration: up/down reversible
   - Document schema changes in commit message
   - Include index creation for query performance

2. **Query Instrumentation**:
   - Wrap all queries in OTel spans with context:
     ```typescript
     const span = tracer.startSpan('find_order_by_id', {
       attributes: {
         'db.system': 'postgresql',
         'db.statement': 'SELECT * FROM orders WHERE id = ?',
         'db.table': 'orders',
         'db.operation': 'SELECT'
       }
     });
     ```
   - Record query duration, row count, errors
   - End span with status (OK, ERROR)

3. **ORM Usage**:
   - Use typed ORM (TypeORM, Prisma, Knex with TypeScript)
   - Leverage ORM auto-instrumentation plugins
   - Avoid raw SQL unless absolutely necessary (include span comment)
   - Use parameterized queries (prevent SQL injection)

4. **Mapper Pattern**:
   - Keep domain entities separate from persistence models
   - Mappers transform: Entity ↔ Database Row
   - Never return persistence models to application layer
   - Validate data during mapping (catch DB-level issues)

5. **Connection Pooling**:
   - Configure pool size based on workload
   - Monitor active connections (metric: `db_connection_pool_active`)
   - Log connection pool exhaustion warnings

6. **Testing Strategies**:
   - Unit tests: Use in-memory adapters (no I/O)
   - Integration tests: Spin up test database (Docker container, ephemeral)
   - Seed test data via migrations
   - Test error scenarios (connection failure, constraint violation)

## Code Maintenance Practices

1. **Query Optimization**:
   - Identify slow queries (log threshold: > 200ms)
   - Add indexes for frequently filtered columns
   - Denormalize selectively (measure impact first)
   - Use query explain plans to verify optimization

2. **Data Consistency**:
   - Use transactions for multi-row operations
   - Enforce foreign key constraints
   - Validate domain constraints before write
   - Document eventual consistency points

3. **Migration Safety**:
   - Test migrations on data copy first
   - Include rollback procedure
   - Communicate downtime windows (if required)
   - Version production schema in git

4. **Documentation**:
   - Schema diagrams (ER diagrams, comment in migration files)
   - Query performance notes (why index exists, when added)
   - Known hot spots and optimization history
   - Backup/restore procedures

5. **Adapter Swapping**:
   - Keep port interfaces stable (backward compatible)
   - New adapter = new implementation file, not refactored port
   - Test both adapters (in-memory + Postgres) in CI

## Operations

1. **Health Checks**:
   - Readiness probe: test database connectivity
   - Liveness probe: query health (simple SELECT 1)
   - Timeout: 5 seconds (detect hung connections)

2. **Monitoring**:
   - **Metrics**:
     - Query latency histogram (p50, p95, p99)
     - Query count by operation (SELECT, INSERT, UPDATE)
     - Connection pool utilization
     - Slow query count (threshold: > 200ms)
   - **Alerts**:
     - Connection pool > 80% utilization
     - Query latency p99 > 500ms
     - Slow query rate > 10 per minute

3. **Runbook: High Query Latency**:
   - Query Loki: `{service=modulith-dx, component=postgres} | json | db_duration_ms > 500`
   - Check indexes: `EXPLAIN ANALYZE SELECT ...`
   - Correlate with trace: click exemplar in Grafana to see full request context
   - Check connection pool: are queries waiting for connections?

4. **Incident Response**:
   - Query slow log to identify problematic table/operation
   - Kill long-running queries (if necessary): `SELECT pg_terminate_backend(pid) FROM pg_stat_activity ...`
   - Scale read replicas (if available)
   - Document incident in postmortem (add optimization)

5. **Backup & Recovery**:
   - Automated backups (daily snapshots)
   - Test restore procedure monthly
   - Point-in-time recovery capability
   - Document recovery RTO/RPO
