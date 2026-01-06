# Layer 8: Operations

Runbooks, deployment scripts, health checks, scaling rules, and monitoring documentation.

## Overview

**What you provide:**
- Runbooks (incident response, how to query logs)
- Deployment scripts (rolling updates, canary deployment)
- Health checks (liveness, readiness probes)
- Scaling rules (if orchestrated: CPU/memory triggers)
- Monitoring setup documentation

**What you delegate:**
- Infrastructure automation (Terraform, CloudFormation)
- Incident management (PagerDuty, Opsgenie)
- Capacity planning, cost optimization

**Observability rules:**
- ✅ **Must:** Export liveness probe (/healthz)
- ✅ **Must:** Export readiness probe (/readyz) with Collector connectivity check
- ✅ **Must:** Log deployment events (app version, git commit)
- ✅ **Must:** Query logs/metrics on-call (runbook should use Grafana Loki panel)
- ❌ **Never:** Block deployment on observability health (degrade gracefully)
- ❌ **Never:** Missing runbooks for common alerts

**Enforced by:**
- Health check endpoints (ExpressError handler)
- Startup verification (log OTel status)
- Runbook templates in README

### Observability Artifacts
```
GET /healthz → 200 OK
  - Memory usage
  - Uptime
  - Process info

GET /readyz → 200 OK (only if Collector reachable)
  - Collector connectivity: OK
  - Database: OK
  - Cache: OK

Loki queries (for runbooks):
  {service="modulith-dx"} | json | level="error"
  {service="modulith-dx", job="postgres"} | SLOW_QUERY

Grafana dashboards:
  - "Incidents": Filter alerts by severity
  - "SLOs": Error budget, availability %
  - "Operations": Deployment timeline, health check status
```

## Create New

When preparing for production deployment:

1. **Create health check endpoints**:
   - `/healthz`: liveness (always 200)
   - `/readyz`: readiness (only if dependencies OK)

2. **Write runbooks** for common incidents:
   - High error rate
   - High latency
   - Database connection failure
   - Out of memory
   - Deployment failure

3. **Create Grafana dashboard** for operations:
   - Deployment timeline
   - Health check status
   - Current alerts
   - SLO tracking

4. **Document deployment process**:
   - Prerequisites (backup database, etc.)
   - Deployment steps (blue-green, canary, rolling)
   - Verification (health checks, smoke tests)
   - Rollback procedure

5. **Configure scaling rules** (if using Kubernetes):
   - Scale up on high CPU (> 70%)
   - Scale down on low CPU (< 30%)
   - Min replicas: 2, Max replicas: 10
   - Graceful shutdown (drain connections)

Example health check implementation:
```typescript
// src/app.ts
export function createApp() {
  const app = express();

  app.get('/healthz', (req, res) => {
    const memory = process.memoryUsage();
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      memory_mb: Math.round(memory.heapUsed / 1024 / 1024),
      timestamp: new Date().toISOString()
    });
  });

  app.get('/readyz', async (req, res) => {
    try {
      // Test database connectivity
      const dbOk = await db.query('SELECT 1');
      
      // Test OTel Collector connectivity
      const collectorOk = await fetch(
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
        { method: 'POST', timeout: 2000 }
      ).then(() => true).catch(() => false);

      const ready = dbOk && collectorOk;
      res.status(ready ? 200 : 503).json({
        ready,
        dependencies: { database: dbOk, collector: collectorOk }
      });
    } catch (error) {
      res.status(503).json({ ready: false, error: error.message });
    }
  });

  return app;
}
```

## Development Practices

1. **Graceful Shutdown**:
   ```typescript
   const server = app.listen(3000);

   process.on('SIGTERM', async () => {
     console.log('SIGTERM received, draining connections...');
     
     server.close(() => {
       console.log('HTTP server closed');
       process.exit(0);
     });

     // Timeout: force exit after 30 seconds
     setTimeout(() => {
       console.error('Forced exit due to timeout');
       process.exit(1);
     }, 30000);
   });
   ```

2. **Deployment Logging**:
   - Log on startup:
     ```typescript
     console.log('Service: modulith-dx');
     console.log('Version: v1.0.0');
     console.log('Commit: abc123');
     console.log('Environment: production');
     ```
   - Log on shutdown (with timestamp)
   - Log errors with full context

3. **Monitoring Configuration**:
   - Define SLOs (Service Level Objectives):
     - Availability: 99.9% uptime
     - Latency: p99 < 500ms
     - Error rate: < 0.5%
   - Track error budget: remaining availability to reach SLO
   - Alert when consuming error budget too fast

4. **Incident Tracking**:
   - Create incident tickets automatically on alert
   - Include: alert name, threshold, current value, runbook
   - Assign on-call engineer
   - Post incident timeline in retrospective

## Code Maintenance Practices

1. **Runbook Template**:
   ```markdown
   # Runbook: High Error Rate Alert

   ## Severity: P2 (page on-call)

   ## Description
   Application error rate > 5% for 5 minutes.

   ## Investigation
   1. Check current logs (Loki):
      ```
      {service="modulith-dx"} | json | level="error" | stats count by error_type
      ```
   2. Filter by endpoint (if pattern visible):
      ```
      {service="modulith-dx", endpoint="/orders"} | json | level="error"
      ```
   3. Correlate with traces (Tempo):
      - Open trace from Loki log line
      - Check span errors, database latency

   ## Common Causes
   - Database connection failure: check `/readyz` endpoint
   - Validation error: check request log schema
   - Dependency timeout: correlate with dependency service logs
   - Out of memory: check heap usage in `/healthz`

   ## Mitigation
   1. Immediate: Check if degradation is acceptable
   2. Short-term: Scale up (add more instances)
   3. Long-term: Fix root cause, add test case

   ## Resolution
   1. Fix and deploy (with version bump)
   2. Monitor error rate (expect return to < 1% within 5 min)
   3. Post incident: document root cause, add monitoring
   ```

2. **Documentation**:
   - Deployment guide (prerequisites, steps, verification)
   - Incident response playbook (who to contact, escalation)
   - SLO/SLI definitions (what we measure, targets)
   - Monitoring setup (how to access Grafana, query logs)
   - Capacity planning (growth projections, scaling triggers)

3. **Rollback Procedure**:
   - Keep last 3 versions available
   - Rollback by reverting to previous tag
   - Automated: if error rate > 5% for 10 min, trigger rollback
   - Manual: on-call engineer can force rollback via dashboard

4. **Change Management**:
   - All deployments logged (timestamp, version, engineer, change description)
   - Correlate with monitoring (did latency change post-deploy?)
   - Require approval for production deployments
   - Announce deployments to team (Slack, email)

## Operations

1. **Pre-Deployment Checklist**:
   - [ ] All tests passing (unit + integration + e2e)
   - [ ] Code review approved
   - [ ] No critical vulnerabilities (npm audit)
   - [ ] Observability inventory in sync
   - [ ] Backup database (if schema changes)
   - [ ] Runbooks up-to-date

2. **Deployment Process**:
   ```
   1. Tag release: git tag v1.0.0
   2. CI builds and tests (automatic)
   3. Build and push Docker image
   4. Deploy to staging (automated)
   5. Run smoke tests (automated)
   6. Deploy to production (blue-green or canary)
   7. Verify health checks (/healthz, /readyz)
   8. Monitor error rate, latency for 10 minutes
   9. Mark deployment as successful
   ```

3. **Health Check Frequency**:
   - Kubernetes: liveness probe every 10 seconds (timeout 5 sec)
   - Readiness probe every 5 seconds (startup 30 sec delay)
   - Manual monitoring: query Prometheus every 30 seconds
   - Error rate alert: evaluate every 1 minute

4. **Scaling Policy**:
   - Scale up trigger: CPU > 70% OR memory > 80%
   - Scale down trigger: CPU < 30% for 10 minutes
   - Min replicas: 2 (high availability)
   - Max replicas: 10 (cost limit)
   - Cooldown: 5 minutes between scale events

5. **Incident Severity Levels**:
   - **P0 (Critical)**: Complete service outage, error rate = 100%
     - Page all on-call engineers, escalate immediately
   - **P1 (High)**: Degraded performance, error rate > 10%
     - Page primary on-call, expected resolution < 30 min
   - **P2 (Medium)**: Elevated errors, error rate 1-10%
     - Page on-call, expected resolution < 2 hours
   - **P3 (Low)**: Minor issues, error rate < 1%
     - Create ticket, non-blocking

6. **On-Call Responsibilities**:
   - Respond to alerts within 5 minutes
   - Follow runbooks for investigation
   - Communicate status updates (every 15 min for P1/P2)
   - Escalate if unable to resolve within SLA
   - Document incident and lessons learned
