# Layer 8: Operations - Implementation Guide

## What Must Be True

- [ ] `/healthz` endpoint always returns 200 OK
- [ ] `/readyz` endpoint returns 503 if dependencies down
- [ ] Graceful shutdown waits for in-flight requests
- [ ] Deployment logs version, commit, engineer, timestamp
- [ ] Runbooks exist for all P1/P2 alerts
- [ ] SLO/SLI targets documented
- [ ] Scaling rules configured (if Kubernetes)
- [ ] Incident severity levels documented

## Templating Strategies

Use Plop template for new runbooks:

```bash
npm run scaffold:runbook -- --alert "HighErrorRate" --severity "P2"
# Generates: docs/runbooks/high-error-rate.md
# Auto-includes investigation steps, common causes, mitigation
```

Template sections:
1. Severity level (P0-P3)
2. Symptom description
3. Investigation steps (with Loki/Prometheus queries)
4. Common root causes
5. Immediate mitigation
6. Long-term fix
7. Postmortem checklist

## Author-Time Verification

When preparing deployment:

1. Pre-deployment checklist:
   ```bash
   npm run check:deployment
   ```
   - All tests passing
   - No critical security issues
   - Observability inventory in sync
   - Runbooks updated

2. Health check validation:
   ```bash
   # Start app locally
   npm start
   
   # Verify endpoints
   curl http://localhost:3000/healthz  # Should return 200
   curl http://localhost:3000/readyz   # Should return 200 if deps ok
   ```

3. Graceful shutdown test:
   ```bash
   # Start app, then:
   kill -SIGTERM <pid>
   # Should see: "SIGTERM received, draining connections"
   # Should close without forcing exit
   ```

## Runtime Monitoring

Monitor these endpoints and metrics:

- **`GET /healthz`**: Should always return 200 (even if degraded)
- **`GET /readyz`**: Should return 200 only if dependencies ok
- **Uptime metric**: `process_uptime_seconds` (increasing)
- **Memory metric**: `process_resident_memory_bytes` (check for leaks)
- **Deployment event**: `deployment_total` with version tag

Alert if:
- `/readyz` returns 503 (dependency down)
- Memory usage increasing >100MB/hour (leak)
- Uptime resets (crash/restart)
- Deployment takes >30 minutes (stuck)

## How to Edit

**Adding new health check**:
1. Add logic to `/readyz` endpoint
2. Test endpoint locally
3. Document in health checks section
4. Update Kubernetes readiness probe config

**Creating runbook**:
1. Use Plop scaffold template
2. Add specific Loki/Prometheus queries
3. Update alert rule with runbook URL
4. Announce runbook in team docs

**Updating SLO**:
1. Edit in `docs/operations/SLO.md`
2. Calculate error budget
3. Update alert thresholds
4. Announce to team

**Modifying deployment process**:
1. Document new step in `docs/operations/DEPLOYMENT.md`
2. Update CI/CD workflow
3. Test in staging
4. Announce to team before production change

## How to Document

**Health check**:
```typescript
/**
 * GET /readyz - Readiness probe
 * 
 * Returns 200 only if all critical dependencies are ready:
 * - Database: connection successful
 * - OTel Collector: accepting spans
 * 
 * Response: { ready: boolean, dependencies: { database, collector } }
 * 
 * Used by: Kubernetes readiness probe (scale in/out)
 * SLA: Must respond within 5 seconds
 */
app.get('/readyz', async (req, res) => { ... });
```

**Runbook**:
```markdown
# Runbook: High Error Rate (P2)

## Description
Error rate > 5% for 5 minutes

## Investigation
1. Check current errors:
   Loki: {service="modulith-dx"} | json | level="error" | stats count by error_type
2. Correlate with recent deployment
3. Check database performance
4. View trace for slowest operation

## Mitigation
1. If database: scale up read replicas
2. If code bug: rollback previous version
3. If load: scale up app instances

## Resolution
1. Monitor error rate (expect drop to <1% within 5 min)
2. If not dropping, escalate to engineer on-call
3. Post incident: document root cause
```

**SLO**:
```markdown
# Service Level Objectives

## Availability
- **Target**: 99.9% uptime
- **Error budget**: 43 minutes/month
- **Current**: 99.95% (ahead of target)

## Latency
- **Target**: p99 < 500ms
- **Threshold**: Alert if p99 > 1000ms for 5 min
- **Current**: p99 = 245ms

## Error Rate
- **Target**: < 0.5% errors
- **Threshold**: Alert if > 1% for 5 min
- **Current**: 0.1%
```

## How to Test

**Health check tests**:
```typescript
it('should return 200 OK on /healthz', async () => {
  const res = await request(app).get('/healthz');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('healthy');
});

it('should return 503 if database down', async () => {
  // Mock db.query to reject
  const res = await request(app).get('/readyz');
  expect(res.status).toBe(503);
  expect(res.body.ready).toBe(false);
});
```

**Graceful shutdown tests**:
```bash
# Start app
npm start &
PID=$!

# Trigger SIGTERM
kill -SIGTERM $PID

# Verify clean shutdown (no forced exit)
wait $PID
EXIT_CODE=$?
# Should be 0, not 1 (force exit)
```

**Deployment tests**:
```bash
# Simulate deployment
docker build -t app:v1.0.0 .
docker run --health-cmd='curl -f http://localhost:3000/readyz' app:v1.0.0

# Check health immediately
# Should show: healthy
```

## Keep Aligned with Standards

**Gold Standard checklist**:
- [ ] Health checks return correct status codes
- [ ] Graceful shutdown completes within 30 seconds
- [ ] Deployment logs include version + commit
- [ ] SLO targets documented and achievable
- [ ] P1/P2 alerts have runbooks
- [ ] Error budget tracked
- [ ] Scaling rules match environment
- [ ] Incident severity levels understood by team

**Health check validation** (pre-deployment):
```bash
npm run check:health-endpoints
# Verifies:
# - /healthz returns 200
# - /readyz returns 200 (all deps up)
# - Response time < 5 seconds
# - JSON structure matches schema
```

**Runbook verification** (pre-deployment):
```bash
npm run check:runbooks --alert "HighErrorRate"
# Verifies:
# - Runbook exists
# - Queries are valid (test in Loki/Prometheus)
# - Runbook URL in alert rule
```

**SLO tracking** (continuous):
```bash
# Grafana dashboard: "SLO Tracking"
# Shows:
# - Current availability %
# - Error budget remaining
# - Alerts if consuming budget too fast
```

**Deprecation handling**:
If changing deployment process:
1. Keep old process documented (with ⚠️ status)
2. Document new process clearly
3. Announce 2-week transition period
4. Remove old process after transition
