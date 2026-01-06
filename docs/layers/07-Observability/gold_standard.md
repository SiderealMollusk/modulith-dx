# Layer 7: Observability

OTel SDK, logging, metrics, dashboards, alert rules, and span exporters.

## Overview

**What you provide:**
- OTel SDK initialization and auto-instrumentation
- Logger implementation (injects traceId/spanId)
- Metrics definitions (counters, histograms)
- Dashboard definitions (Grafana as code)
- Alert rules (Prometheus)
- Span exporters (OTLP → Collector)

**What you delegate:**
- Backend services (Prometheus, Loki, Tempo, Grafana run in docker-compose)
- Long-term storage (cloud storage for retention)
- Alerting delivery (email, Slack, PagerDuty)

**Observability rules:**
- ✅ **Must:** Export Resource with service metadata
- ✅ **Must:** Auto-instrument HTTP, database, gRPC
- ✅ **Must:** Emit traces to Tempo (OTLP/HTTP)
- ✅ **Must:** Emit logs to Loki (with traceId injection)
- ✅ **Must:** Emit metrics to Prometheus (with exemplars)
- ✅ **Must:** Create dashboards for RED metrics (Request rate, Error rate, Duration)
- ✅ **Must:** Alert on: error rate > 5%, latency p99 > 500ms
- ❌ **Never:** Log without trace context
- ❌ **Never:** Metric without exemplar link to trace
- ❌ **Never:** Skip cardinality limits (tag explosion)

**Enforced by:**
- Type checking (Logger interface enforced)
- Inventory verification (all files exist, signatures match)
- OTel SDK startup health checks
- Prometheus scrape success metrics

### Observability Artifacts
```
src/shared/kernel/telemetry/
  index.ts           ← OTel SDK initialization
  metrics.ts         ← Meter definitions
  
src/shared/kernel/logger/
  otel-logger.ts     ← Injects traceId/spanId

ops/
  docker-compose.yml
  collector/
    otel-collector.yaml   ← OTLP receivers, processors, exporters
  prometheus/
    prometheus.yml        ← Scrape configs
    rules.yml             ← Alert rules
  loki/
    loki-config.yml       ← Log retention, label extraction
  tempo/
    tempo.yml             ← Trace retention, search enabled
  grafana/
    provisioning/
      datasources/        ← Prometheus, Loki, Tempo, AlertMgr
      dashboards/         ← RED, USE, OTel health
      alerts/             ← Alert notifications
```

### Example Observability Flow
```
Application span: "CreateUser"
  ├─ Exported to Collector via OTLP/HTTP:4318
  ├─ Collector processors:
  │   ├─ Batch (group traces)
  │   ├─ Attributes (add service.namespace)
  │   └─ Memory limiter (prevent OOM)
  │
  └─ Collector exporters:
      ├─ OTLP → Tempo (traceId: abc123)
      │   └─ Tempo stores trace (100 spans, 234ms duration)
      │
      ├─ Loki → Log lines with traceId:abc123
      │   └─ Loki indexes logs by service, level, traceId
      │
      └─ Prometheus → Metrics
          ├─ Counter: create_user_total{status=success}
          ├─ Histogram: create_user_duration_ms{quantile=0.99}
          └─ Exemplar: duration_ms=234, traceId=abc123
              └─ Click in Grafana → opens trace in Tempo
```

## Create New

When adding observability to a new component:

1. **Define Logger injection** in constructor
2. **Create Meter for metrics** (counters, histograms)
3. **Create Tracer for spans** (manual or auto-instrumented)
4. **Add Log statements** at key points (start, error, completion)
5. **Record metrics** (duration, count, errors)
6. **Update Grafana dashboard** to visualize
7. **Create alert rule** if needed (e.g., error rate threshold)

Example observable use case:
```typescript
// src/core/orders/application/use-cases/CreateOrderUseCase.ts
import { Logger } from '@shared/kernel/logger';
import { Meter } from '@opentelemetry/api';

export class CreateOrderUseCase {
  private meter: Meter;
  private counter = this.meter.createCounter('create_order_total', {
    description: 'Total create order requests'
  });
  private histogram = this.meter.createHistogram('create_order_duration_ms', {
    description: 'Create order duration'
  });

  constructor(
    private repository: OrderRepository,
    private logger: Logger,
    meter: Meter
  ) {
    this.meter = meter;
  }

  async execute(dto: CreateOrderDto): Promise<Result<Order>> {
    const startTime = Date.now();
    const orderId = generateId();

    this.logger.info('CreateOrder.execute', {
      orderId,
      customerId: dto.customerId
    });

    try {
      const order = Order.create(dto);
      const saved = await this.repository.save(order);

      this.counter.add(1, { status: 'success' });
      this.histogram.record(Date.now() - startTime, { operation: 'create_order' });

      this.logger.info('Order created', { orderId, status: 'success' });
      return Result.ok(saved);
    } catch (error) {
      this.counter.add(1, { status: 'failure', error_type: error.name });
      this.histogram.record(Date.now() - startTime, { operation: 'create_order', error: 'yes' });

      this.logger.error('Failed to create order', {
        orderId,
        error: error.message,
        stack: error.stack
      });

      return Result.fail(new ApplicationError('FAILED_TO_CREATE_ORDER', error.message));
    }
  }
}
```

## Development Practices

1. **Logger Interface**:
   - Inject Logger into constructors (never use console.log)
   - Logger automatically injects traceId/spanId
   - Call logger.info(), logger.error(), logger.warn()
   - Include context: { userId, orderId, email, operation }
   - Never log sensitive data: passwords, tokens, full PII

2. **Metrics Definition**:
   - Use Meter to create counters, histograms, gauges
   - Counter: counts occurrences (requests, errors, messages)
   - Histogram: measures durations, sizes (latency, payload)
   - Gauge: measures current state (active connections, memory)
   - Add tags to cardinality limits (max 10-20 unique values)

3. **Span Creation**:
   - Use tracer.startSpan() for manual spans
   - Set span attributes: { userId, operation, status }
   - Span auto-closed on function return (with finally block)
   - Use span.recordException() for error details
   - Set span status: OK or ERROR

4. **Trace Context Propagation**:
   - Extract traceId from request headers (W3C traceparent)
   - Pass traceId to all downstream calls
   - Logger auto-injects traceId into all log lines
   - Metrics exemplars link to traceId

5. **Sampling Strategy**:
   - Sample 100% of traces in development
   - Sample 10-50% of traces in production (adjust based on volume)
   - Sample 100% of error traces (always capture failures)
   - Document sampling decision in code

6. **Testing Observability**:
   - Mock Logger to verify calls
   - Assert log messages, context values
   - Verify metrics recorded correctly
   - Test trace attributes

## Code Maintenance Practices

1. **Grafana Dashboards**:
   - Define dashboards as code (JSON)
   - Store in `ops/grafana/provisioning/dashboards/`
   - Use variables for dynamic queries (service name, environment)
   - Include RED metrics: Request rate, Error rate, Duration
   - Link exemplars to traces (right-click metric → open trace)

2. **Alert Rules**:
   - Define in `ops/prometheus/rules.yml`
   - Alert on: error rate > 5%, latency p99 > 500ms, uptime < 99.9%
   - Include runbook URL in alert annotations
   - Test alert rules in development

3. **Log Retention**:
   - Loki retention: 30 days default (adjust for compliance)
   - Tempo retention: 7 days default (adjust for SLA)
   - Prometheus retention: 15 days default
   - Archive old logs to long-term storage (S3, GCS)

4. **Cardinality Management**:
   - Limit metric tags to 10-20 unique values
   - Never use: user ID, order ID, request ID (unbounded)
   - Use: status, operation, error_type (bounded)
   - Monitor cardinality (Prometheus admin interface)

5. **OTel Collector Configuration**:
   - Batch processor: batches spans before export (reduce overhead)
   - Memory limiter: prevents OOM on spike
   - Attributes processor: adds service metadata
   - Sampling processor: reduces trace volume

## Operations

1. **Health Monitoring**:
   - **Metrics**:
     - OTel Collector: `otel_collector_accepted_spans`, `otel_collector_exported_spans`
     - Prometheus: scrape success, scrape duration
     - Loki: ingestion rate, query latency
   - **Alerts**:
     - Collector not receiving spans
     - Prometheus scrape failures
     - Loki ingestion errors

2. **Runbook: No Traces Appearing in Tempo**:
   - Check OTel Collector logs: `docker logs otel-collector`
   - Verify app is exporting: check `OTEL_EXPORTER_OTLP_ENDPOINT` env var
   - Check network: `curl http://localhost:4318/v1/traces` (should accept POST)
   - Verify Tempo is running and scraping Collector
   - Check sampling rate (might be filtering all traces)

3. **Runbook: High Memory Usage in Collector**:
   - Check batch processor queue size (batching too many spans)
   - Increase batch timeout or reduce batch size
   - Enable memory limiter (reject spans if > limit)
   - Scale to multiple Collector instances

4. **Dashboard Structure**:
   - **Service Health**: uptime, error rate, latency p99
   - **Request Volume**: requests/sec by endpoint, status code
   - **Database Performance**: query count, latency, slow query rate
   - **System Resources**: CPU, memory, GC pause time
   - **Traces**: trace count, duration distribution, error traces
   - **Incidents**: recent alerts, ongoing issues

5. **Alert Response**:
   - High error rate (> 5%): check logs for common error, correlate with deployment
   - High latency (p99 > 500ms): check database slow query log, trace slowest operations
   - Collector not exporting: restart service, check network connectivity
   - Disk full (logs/metrics): rotate logs, clean up old data
