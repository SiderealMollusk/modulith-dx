# Layer 4: Runtime

Node.js environment, dependencies, OTel SDK initialization, and health endpoints.

## Overview

**What you provide:**
- Node.js version pinning (.nvmrc, package.json engines)
- Dependencies (package.json, lock file)
- npm scripts (test, build, start)

**What you delegate:**
- Docker image base (node:20-alpine)
- Container runtime (Docker, containerd)
- Secret storage backend (see [Layer 5: Secrets Management](../05-Secrets-Management/gold_standard.md))

**Observability rules:**
- ✅ **Must:** Pin all dependency versions (lock file)
- ✅ **Must:** Include @opentelemetry/* packages
- ✅ **Must:** Initialize OTel SDK in main.ts (before app start)
- ✅ **Must:** Export /metrics endpoint (Prometheus format)
- ❌ **Never:** Use latest tags (always pin versions)
- ❌ **Never:** Start app without OTel initialization

**Enforced by:**
- TypeScript compilation (no missing OTel imports)
- Startup health check (verifies Collector connectivity)
- npm scripts validation in CI

### Observability Artifacts
```
src/main.ts:
  1. Initialize OTel SDK with Resource attributes
  2. Auto-instrument HTTP, database, gRPC
  3. Start server
  4. Expose /metrics endpoint

Resource attributes:
  service.name=modulith-dx
  service.version=0.0.1
  deployment.environment=production
  service.namespace=modulith
```

## Create New

When initializing a new Node.js project:

1. **Set Node.js version** in `.nvmrc` and `package.json`
2. **Install dependencies**: `npm install`
3. **Create lock file**: `npm ci` (commit package-lock.json)
4. **Initialize OTel SDK** in `src/main.ts`
5. **Add health endpoints** (`/healthz`, `/readyz`)
6. **Export metrics** endpoint for Prometheus scraping
7. **Test startup**: `npm start` should run without errors

Example main.ts initialization:
```typescript
// src/main.ts
import { NodeTracerProvider } from '@opentelemetry/node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Initialize OTel SDK before importing app
const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'modulith-dx',
    [SemanticResourceAttributes.SERVICE_VERSION]: '0.0.1',
    'deployment.environment': process.env.NODE_ENV || 'development',
    'service.namespace': 'modulith'
  })
);

const provider = new NodeTracerProvider({ resource });
const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'
});
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

// Auto-instrument Node.js libraries
const sdk = require('@opentelemetry/auto-instrumentations-node');
sdk.default(provider);

// Now import and start app
import { createApp } from './app';

const app = createApp();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## Development Practices

1. **Dependency Management**:
   - Use `npm ci` in CI/Docker (respects lock file)
   - Use `npm install` locally (allows updates)
   - Review security advisories: `npm audit`
   - Update major versions: test thoroughly before merging
   - Pin all dependency versions (no `^`, `~` in production code)

2. **Environment Variables**:
   - Define schema in `config/env.schema.ts` (see [Layer 5: Secrets Management](../05-Secrets-Management/gold_standard.md))
   - Validate on startup (fail fast)
   - Do not log sensitive values
   - Use `.env.example` (commit, no secrets)
   - Keep `.env` in `.gitignore`

3. **OTel SDK Setup**:
   - Initialize SDK in `src/main.ts` before any imports
   - Configure exporters via environment variables
   - Set Resource attributes (service name, version)
   - Enable auto-instrumentation for common libraries
   - Set up sampling strategy (percentage of traces)

4. **Node.js Version**:
   - Use LTS versions (16, 18, 20)
   - Pin major.minor version in `.nvmrc`
   - Document upgrade process
   - Test on new version before upgrading production

5. **Build Process**:
   - Compile TypeScript to JavaScript: `tsc`
   - Output to `dist/` directory
   - Include `.js` files in Docker image
   - Strip source maps from production build

6. **Start Script**:
   - `npm start`: run compiled main.js
   - `npm run dev`: run with ts-node (development)
   - `npm test`: run all tests
   - `npm run build`: compile TypeScript

## Code Maintenance Practices

1. **Dependency Auditing**:
   - Run `npm audit` before every deployment
   - Fix critical vulnerabilities immediately
   - Document deferred vulnerabilities (with justification)
   - Update dependencies monthly

2. **Lock File Management**:
   - Commit `package-lock.json` to git
   - Never manually edit lock file
   - Update lock file before merging: `npm ci && npm install`
   - Reproduce CI failures locally using lock file

3. **Performance Optimization**:
   - Monitor startup time (log in main.ts)
   - Profile memory usage (Node.js flags: `--max-old-space-size`)
   - Use native modules for CPU-intensive tasks
   - Keep node_modules size minimal (npm prune in Docker)

4. **Configuration**:
   - Use environment variables for configuration
   - Provide sensible defaults
   - Document all configuration options
   - Validate configuration on startup

5. **Logging at Startup**:
   ```typescript
   console.log(`Node.js version: ${process.version}`);
   console.log(`Service: modulith-dx v0.0.1`);
   console.log(`Commit: abc123`);
   console.log(`Environment: ${process.env.NODE_ENV}`);
   console.log(`OTel Exporter: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`);
   console.log(`Ready to accept requests on port ${port}`);
   ```

## Operations

1. **Health Checks**:
   ```typescript
   app.get('/healthz', (req, res) => {
     res.json({
       status: 'healthy',
       uptime: process.uptime(),
       memory: process.memoryUsage(),
       node_version: process.version,
       service: 'modulith-dx',
       timestamp: new Date().toISOString()
     });
   });

   app.get('/readyz', async (req, res) => {
     // Check dependencies (database, cache, collector)
     const checks = {
       database: await checkDatabase(),
       collector: await checkCollectorConnectivity(),
       memory: process.memoryUsage().heapUsed < 1024 * 1024 * 512 // < 512MB
     };

     const ready = Object.values(checks).every(c => c === true);
     res.status(ready ? 200 : 503).json({
       ready,
       checks
     });
   });
   ```

2. **Startup Monitoring**:
   - Log startup sequence (SDK init → app config → server listen)
   - Record startup duration (metric: `app_startup_duration_ms`)
   - Alert if startup takes > 10 seconds
   - Verify Collector connectivity at startup

3. **Runtime Monitoring**:
   - **Metrics**:
     - Process uptime
     - Memory usage (heap, external)
     - CPU usage (via container metrics)
     - Active event loop lag
   - **Alerts**:
     - Memory > 80% of limit
     - Heap size increasing without GC (memory leak)
     - High event loop lag (> 100ms)

4. **Scaling**:
   - Deploy stateless instances (no session state in memory)
   - Use load balancer to distribute traffic
   - Set process.env.NODE_ENV=production (enables optimizations)
   - Configure worker threads for CPU-bound tasks

5. **Incident Response**:
   - Monitor startup health check: verify Collector reachable
   - Check memory leaks: compare memory at startup vs. after load
   - Review OTel span export errors (check Collector logs)
   - Verify lock file matches running version
