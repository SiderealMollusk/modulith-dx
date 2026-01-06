# Layer 3: Networking - Implementation

Practical HTTP handler, middleware, and API integration guidance.

## What Must Be True

**Mandatory invariants:**
- [ ] Trace context extracted from W3C headers
- [ ] TraceId injected into response headers
- [ ] All HTTP requests logged with latency
- [ ] Request/response validated with Zod schemas
- [ ] Error responses include error code
- [ ] No sensitive data in logs or responses
- [ ] Middleware order correct (context → validation → handler)

## Templating Strategies

**Scaffolding handlers and endpoints:**
- Handler template: `npm run scaffold:handler CreateOrderHandler --context=orders`
- OpenAPI spec template: `npm run scaffold:openapi /orders POST CreateOrderRequest`
- Presenter template: `npm run scaffold:presenter OrderPresenter --context=orders`

## Author-Time Verification

**Before commit:**
- Request/response schemas validated with Zod
- Handlers extract and pass trace context
- Integration tests pass
- No console.log in handlers

## Runtime Monitoring

**HTTP observability:**
- Request latency histogram
- Error rate by endpoint and status
- Request count by method
- Response payload size

## How to Edit

**Refactoring patterns:**
- Versioning endpoints (URL path prefix)
- Adding query parameters (backward compatible)
- Changing response format (with deprecation period)
- Middleware reordering (test impact)

## How to Document

**API documentation:**
- OpenAPI specs alongside handlers
- Error codes documented
- Example requests/responses
- Auth requirements

## How to Test

**Testing HTTP layer:**
- Integration: full HTTP request/response
- Validation: invalid requests return 400
- Error handling: map domain errors to status codes
- Trace context: verify header extraction

## Keep Aligned with Standards

**HTTP conventions:**
- Status codes per HTTP spec
- Error response format consistent
- Trace context headers (W3C)
- Content-Type headers correct
