# Layer 3: Networking

HTTP middleware, gRPC/API contracts, request/response serialization with trace context.

## Overview

**What you provide:**
- HTTP middleware (trace context extraction, error handling)
- gRPC/API contracts (OpenAPI specs)
- Request/response serialization (with error codes)

**What you delegate:**
- Load balancer, reverse proxy (nginx, HAProxy)
- DNS, service discovery (k8s, Consul)
- TLS/mTLS (cert managers, infrastructure)

**Observability rules:**
- ✅ **Must:** Extract traceparent/tracestate headers (W3C)
- ✅ **Must:** Inject traceId into response headers (for client-side correlation)
- ✅ **Must:** Log all HTTP requests (method, path, status, latency)
- ✅ **Must:** Measure request latency (histogram: http_request_duration_ms)
- ✅ **Must:** Track error rate (counter: http_errors_total by status code)
- ❌ **Never:** Log full request body (use sampling or schema validation)
- ❌ **Never:** Block on logging (async, batched)

**Enforced by:**
- Express/Fastify middleware auto-instrumentation
- TypeScript request/response interfaces (validated by Zod)
- Histogram middleware recording latency

### Observability Artifacts
```
Tempo traces:
  http.method=POST
  http.url=/users
  http.status_code=201
  http.client_ip=192.168.1.5
  http.duration_ms=234

Prometheus metrics:
  http_requests_total{method=POST,path=/users,status=201}
  http_request_duration_ms{method=POST,path=/users,quantile=0.99} = 450
  http_errors_total{status=400} = 5

Loki logs:
  {service=modulith-dx, level=info}
    HTTP: POST /users 201 234ms traceid=abc123
    user_id=xyz, email=test@example.com
```

## Create New

When adding a new HTTP endpoint:

1. **Define OpenAPI schema** (or gRPC proto)
2. **Create request/response DTOs** with validation
3. **Add route handler** that extracts trace context
4. **Create presenter** to format response
5. **Write integration tests** with actual HTTP requests
6. **Document endpoint** (path, method, parameters, auth)

Example endpoint structure:
```typescript
// src/core/<context>/interface/handlers/GetOrderHandler.ts
import { Router, Request, Response } from 'express';
import { Logger } from '@shared/kernel';

export class GetOrderHandler {
  constructor(
    private useCase: GetOrderUseCase,
    private logger: Logger
  ) {}

  register(router: Router): void {
    router.get('/orders/:id', (req, res) => 
      this.handle(req, res)
    );
  }

  private async handle(req: Request, res: Response): Promise<void> {
    const traceId = req.headers['traceparent'] || req.id;
    const orderId = req.params.id;

    this.logger.info('GetOrder', { traceId, orderId });

    const result = await this.useCase.execute(orderId);

    if (result.isFailure) {
      res.status(400).json({
        error: result.error.code,
        message: result.error.message,
        traceId
      });
      return;
    }

    res.set('X-Trace-ID', traceId);
    res.json(new OrderPresenter(result.value).toJSON());
  }
}
```

## Development Practices

1. **Trace Context Propagation**:
   - Extract W3C `traceparent` header (format: `00-traceid-spanid-sampled`)
   - Extract `tracestate` header for vendor-specific context
   - Inject traceId into response headers (`X-Trace-ID`)
   - Pass traceId to all downstream calls (database, message queue, etc.)

2. **Request Validation**:
   - Use schema validators (Zod, Joi) to parse request body/params
   - Return 400 Bad Request for validation failures
   - Include validation error details (but not sensitive data)
   - Log validation errors for debugging

3. **Response Serialization**:
   - Use presenters to format domain entities → JSON
   - Never expose infrastructure details (database IDs, timestamps)
   - Include metadata (traceId, timestamp, version)
   - Support content negotiation (JSON, XML, etc.)

4. **Error Handling**:
   - Map domain errors to HTTP status codes:
     - ValidationError → 400
     - NotFoundError → 404
     - ConflictError → 409
     - InternalError → 500
   - Include error code in response (for client-side handling)
   - Do not expose stack traces in production

5. **Middleware Order**:
   ```
   1. Request ID generation (if no traceparent)
   2. Trace context extraction (W3C standard)
   3. Logging middleware (log start)
   4. Metrics middleware (start timer)
   5. Request validation middleware
   6. Route handlers
   7. Error handling middleware
   8. Metrics middleware (end timer, status)
   9. Logging middleware (log end)
   ```

6. **Request Logging**:
   - Log at request start: method, path, client IP
   - Log at request end: status, latency, error (if any)
   - Include traceId in all log lines
   - Scrub sensitive data (passwords, tokens, credit cards)

## Code Maintenance Practices

1. **OpenAPI Documentation**:
   - Generate from code annotations or maintain separately
   - Include: path, method, request/response schemas, auth requirements
   - Update documentation when endpoint changes
   - Use for API contract testing

2. **Version APIs**:
   - Use path versioning (`/v1/orders`, `/v2/orders`) for breaking changes
   - Deprecate old versions with sunset headers
   - Support transitional period (multiple versions)
   - Document migration path for clients

3. **Security Headers**:
   - Add security headers: `X-Content-Type-Options: nosniff`
   - CORS headers: `Access-Control-Allow-Origin` (if needed)
   - CSP headers: `Content-Security-Policy` (if serving HTML)
   - Rate limiting headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

4. **Testing**:
   - Integration tests: full HTTP request/response
   - Test valid requests (200 responses)
   - Test invalid requests (400, 404, 409)
   - Test error scenarios (database failure, timeout)
   - Mock external services, real database

5. **Handler Consistency**:
   - Standardize error response format
   - Consistent naming (camelCase, snake_case, kebab-case)
   - Consistent pagination (offset/limit or cursor-based)
   - Consistent filtering query parameters

## Operations

1. **Monitoring**:
   - **Metrics**:
     - Request rate (requests/sec by method and path)
     - Latency histogram (p50, p95, p99 by endpoint)
     - Error rate by status code (4xx, 5xx)
     - Payload size (request/response)
   - **Alerts**:
     - Error rate (5xx) > 1%
     - Latency p99 > 1000ms
     - 4xx rate spike (possible DoS)

2. **Runbook: High Error Rate**:
   - Query Loki: `{service=modulith-dx} http_status=500`
   - Correlate with traces: find common pattern (endpoint, error type)
   - Check application logs for stack traces
   - Query metrics: latency degradation? database issues?
   - Check infrastructure: CPU, memory, network

3. **Runbook: High Latency**:
   - Query Grafana dashboard: which endpoints slow?
   - Click exemplar → open trace in Tempo
   - Analyze trace: which span is slow? (database query, external API, etc.)
   - Correlate with database metrics (slow query log)
   - Check network latency (client side)

4. **Rate Limiting**:
   - Implement token bucket or sliding window
   - Return 429 Too Many Requests
   - Include retry-after header
   - Alert on sustained rate limit violations

5. **Graceful Degradation**:
   - Return cached data if database slow
   - Serve stale data if service unavailable (with warning header)
   - Timeout external API calls (fail fast)
   - Circuit breaker pattern for dependent services
