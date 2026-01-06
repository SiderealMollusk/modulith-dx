# Layer 7: Observability - Implementation Guide

## What Must Be True

- [ ] OTel SDK initialized on startup
- [ ] All Logger calls inject traceId/spanId
- [ ] All metrics use bounded tag values
- [ ] Grafana dashboards created and saved as code
- [ ] Alert rules deployed to Prometheus
- [ ] Exemplars link metrics to traces
- [ ] Sampling configured for environment
- [ ] Health checks include observability status

## Templating Strategies

Use Plop template when adding new observable components:

```bash
npm run scaffold:metric -- --name "create_order" --type "histogram"
# Generates: src/shared/kernel/telemetry/metrics/create-order.ts
# Auto-adds to inventory with ⏳ status
```

Template sections:
1. Meter initialization (shared meter instance)
2. Metric creation (counter/histogram/gauge)
3. Unit specification (milliseconds, bytes, etc.)
4. Tag definition (bounded values only)
5. Example usage in use case
6. Unit tests for metric recording

## Author-Time Verification

When adding observability:

1. Run TypeScript check:
   ```bash
   tsc --noEmit
   ```
   - Verifies Logger interface usage
   - Checks Meter method signatures

2. Lint observability code:
   ```bash
   npm run lint -- --config .eslintrc.observability.json
   ```
   - No unbounded tags (user_id, request_id, etc.)
   - No console.log() calls
   - Tracer used correctly

3. Verify inventory:
   ```bash
   npm run verify:observability
   ```
   - New component exists in OBSERVABILITY_INVENTORY.md
   - Status marked as ⏳ or ✅
   - File paths match actual files

## Runtime Monitoring

Monitor these metrics to verify health:

- **OTel Collector**: `otel_collector_accepted_spans` (increasing)
- **Logger**: `logger_calls_total` by level (info, error, warn)
- **Metrics**: `up` (always 1 if exporter working)
- **Database**: `db_query_duration_ms` histogram (p99 < 1000ms)

Alert if:
- Collector not receiving spans for 5 minutes
- Logger calls decreasing (app crashing silently?)
- Metrics exporter errors in app logs

## How to Edit

**Adding a new metric**:
1. Define in `src/shared/kernel/telemetry/metrics.ts`
2. Add to inventory
3. Update OBSERVABILITY_INVENTORY.md
4. Document in code comments

**Updating dashboard**:
1. Edit JSON in `ops/grafana/provisioning/dashboards/`
2. Reload Grafana datasources (automatic with docker-compose)
3. Test queries in Grafana UI
4. Commit updated JSON

**Modifying alert rules**:
1. Update `ops/prometheus/rules.yml`
2. Reload Prometheus (curl localhost:9090/-/reload)
3. Verify alert evaluates correctly (Prometheus UI)
4. Test in staging before production

## How to Document

**For metrics**:
```typescript
/**
 * Counter tracking CreateUser use case invocations.
 * 
 * Tags:
 * - status: 'success' | 'failure' (bounded)
 * 
 * Usage:
 *   this.createUserCounter.add(1, { status: 'success' });
 * 
 * Alarms: None (informational)
 */
private createUserCounter = meter.createCounter('create_user_total');
```

**For dashboards**:
```json
{
  "title": "CreateUser Performance",
  "description": "Request rate, error rate, and latency for CreateUser use case",
  "panels": [
    {
      "title": "Request Rate",
      "targets": [
        {
          "expr": "rate(create_user_total[5m])",
          "legendFormat": "{{status}}"
        }
      ]
    }
  ]
}
```

**For alerts**:
```yaml
- alert: CreateUserHighErrorRate
  expr: rate(create_user_total{status="failure"}[5m]) > 0.05
  for: 5m
  annotations:
    summary: "CreateUser error rate exceeds 5%"
    runbook_url: "https://wiki.example.com/runbooks/create-user-errors"
```

## How to Test

**Unit tests for metrics**:
```typescript
it('should record success metric on CreateUser', async () => {
  const meter = new TestMeter();
  const useCase = new CreateUserUseCase(repo, logger, meter);
  
  const result = await useCase.execute(dto);
  
  expect(meter.recorded('create_user_total', 1, { status: 'success' })).toBe(true);
  expect(result.isOk()).toBe(true);
});
```

**Integration tests for dashboards**:
```bash
# Query dashboard in Grafana
curl http://localhost:3000/api/dashboards/db/create-user-performance \
  -H "Authorization: Bearer $GRAFANA_TOKEN"
# Verify panels load without errors
```

**Alert rule testing**:
```bash
# In Prometheus UI, test alert expression
# http://localhost:9090/alerts
# Should show: FIRING if condition met, INACTIVE if not
```

## Keep Aligned with Standards

**Gold Standard checklist**:
- [ ] Metrics use bounded tags (< 20 unique values per tag)
- [ ] All loggers inject traceId/spanId automatically
- [ ] Grafana dashboards include RED metrics (Request, Error, Duration)
- [ ] Exemplars link metrics to traces
- [ ] Alert rules have runbook URLs
- [ ] Sampling rate documented and justified
- [ ] Health checks include observability status
- [ ] OBSERVABILITY_INVENTORY.md updated

**Drift detection** (run before commit):
```bash
npm run verify:observability --fix
```

**Deprecation handling**:
If replacing old metric:
1. Keep old metric (with ⚠️ status in inventory)
2. Record both old and new
3. Update dashboards to new metric
4. Remove old metric after 2-sprint grace period
