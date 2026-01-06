# Handler Generator

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

See [docs/ddd-implementation/primitives/handler/specification.md](../../ddd-implementation/primitives/handler/specification.md) for full details.

## Quick Start

```bash
# HTTP handler
nx generate @local/ddd:handler --context=orders --name=PlaceOrder --protocol=http

# gRPC handler
nx generate @local/ddd:handler --context=orders --name=PlaceOrder --protocol=grpc

# CLI handler
nx generate @local/ddd:handler --context=orders --name=PlaceOrder --protocol=cli
```

Creates:
```
src/core/orders/interface/handlers/
├── PlaceOrderHttpHandler.ts (or PlaceOrderGrpcHandler, PlaceOrderCliHandler)
├── PlaceOrderHttpHandler.spec.ts (unit test)
└── PlaceOrderHttpHandler.integration.spec.ts (optional stub)
```

See [TEMPLATE.md](TEMPLATE.md) for common patterns (base class, dependency injection, Result type, etc).

## Generated Structure (HTTP Example)

### Handler Class
```typescript
export class PlaceOrderHttpHandler extends BaseHttpHandler {
  constructor(
    private placeOrderUseCase: PlaceOrderUseCase,
  ) {
    super();
  }

  async handle(req: Request, res: Response): Promise<void> {
    try {
      // 1. Extract + validate command from request
      const cmd = PlaceOrder.create({
        customerId: req.body.customerId,
        items: req.body.items,
      });

      if (cmd.isFailure) {
        return res.status(400).json({
          error: cmd.error.message,
          code: 'VALIDATION_ERROR',
        });
      }

      // 2. Execute use case
      const result = await this.placeOrderUseCase.execute(cmd.value);

      if (result.isFailure) {
        this.logger.error('Order placement failed', result.error);
        return res.status(500).json({
          error: result.error.message,
          code: result.error.code,
        });
      }

      // 3. Return response
      res.status(201).json(result.value);
    } catch (error) {
      this.logger.error('Unhandled error', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

### Test Template (Unit)
```typescript
describe('PlaceOrderHttpHandler (Unit)', () => {
  let handler: PlaceOrderHttpHandler;
  let useCase: MockPlaceOrderUseCase;
  let req: MockRequest;
  let res: MockResponse;

  beforeEach(() => {
    useCase = new MockPlaceOrderUseCase();
    handler = new PlaceOrderHttpHandler(useCase);
    req = new MockRequest();
    res = new MockResponse();
  });

  describe('happy path', () => {
    it('should create order and return 201', async () => {
      req.body = {
        customerId: 'cust-123',
        items: [{ sku: 'WIDGET', quantity: 5 }],
      };

      await handler.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
      }));
    });
  });

  describe('validation failures', () => {
    it('should return 400 for invalid input', async () => {
      req.body = { customerId: '' }; // Missing items

      await handler.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'VALIDATION_ERROR',
      }));
    });
  });

  describe('business rule failures', () => {
    it('should return error for business rule violation', async () => {
      useCase.setFailure(new ApplicationError('CUSTOMER_NOT_FOUND', ...));

      await handler.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
```

## Protocol Variants

### HTTP Handler
```typescript
export class MyHttpHandler extends BaseHttpHandler {
  async handle(req: Request, res: Response): Promise<void> {
    // HTTP-specific logic
  }
}
```

### gRPC Handler
```typescript
export class MyGrpcHandler extends BaseGrpcHandler {
  async handle(request: MyServiceRequest): Promise<MyServiceResponse> {
    // gRPC-specific logic
  }
}
```

### CLI Handler
```typescript
export class MyCliHandler extends BaseCliHandler {
  async handle(argv: CliArgs): Promise<void> {
    // CLI-specific logic
  }
}
```

## Key Features

- ✅ Extends appropriate base class (HTTP/gRPC/CLI)
- ✅ Full observability (logging, tracing, error handling via base)
- ✅ Validates commands/queries before executing
- ✅ Maps errors to appropriate HTTP status codes
- ✅ Injects use cases via constructor
- ✅ Unit tests with mocks
- ✅ Integration test stub (optional)

## Key Rules

✅ **DO**:
- Validate input before executing use case
- Map domain errors to appropriate status codes
- Include both unit and integration tests
- Handle and log errors appropriately
- Use dependency injection via constructor

❌ **DON'T**:
- Include business logic (use cases handle that)
- Throw uncaught exceptions
- Skip error handling
- Create tight coupling to specific adapters

## Related Documentation

- [Handler specification](../../ddd-implementation/primitives/handler/specification.md)
- [UseCase spec](../../ddd-implementation/primitives/use-case/specification.md) — Handlers call use cases
- [Command/Query generators](command.md) — Handlers validate these

---

See [generators/README.md](README.md) for overview of all generators.
