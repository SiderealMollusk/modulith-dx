## Phase 0 Punchlist

### Capacity 1: Observability Stack Infrastructure
Compose stack with Prometheus, Loki, Tempo, Grafana, Alertmanager, OTel Collector fully configured and operational.

**Tasks:**
1. [ ] docker-compose.yml created with services:
   - OTel Collector (otlp/http:4318, otlp/grpc:4317, metrics:8888)
   - Prometheus (9090, scrape config for Collector + app)
   - Loki (3100, static config, retention, label matchers)
   - Tempo (3200, otlp receiver, retention)
   - Grafana (3000, provisioned datasources: Prom/Loki/Tempo/AlertMgr, theme, auth disabled)
   - Alertmanager (9093, routing config, inhibit rules)
   - Shared network & health checks defined.
2. [ ] OTel Collector config (collector/otel-collector.yaml):
   - Receivers: otlp/http, otlp/grpc, prometheus (optional scrape).
   - Processors: batch (timeout 10s), attributes (add env, service.namespace), memory_limiter.
   - Exporters: otlp to Tempo, loki to Loki, prometheusremotewrite to Prometheus.
3. [ ] Prometheus config (prometheus/prometheus.yml):
   - Global: scrape_interval 15s, evaluation_interval 15s.
   - Scrape configs: otel-collector:8888/metrics, app:3000/metrics.
   - Alert rules: availability (error rate > 5%), latency (p99 > 500ms), cardinality.
4. [ ] Loki config (loki/loki-config.yml):
   - Retention 168h, chunk encoding snappy.
   - Labels: service, env, level; pipeline to extract traceid from message.
5. [ ] Tempo config (tempo/tempo.yml):
   - Search enabled, max_search_bytes.
   - Retention 168h.
6. [ ] Alertmanager config (alertmanager/alertmanager.yml):
   - Routes by severity (critical -> page, warning -> log).
   - Receivers: stdout (for testing).
7. [ ] Grafana provisioning:
   - Datasources auto-added (prometheus, loki, tempo, alertmanager).
   - Dashboards: RED, USE, OTel Collector health.
   - Alerting rules provisioned to Alertmanager.

**Proof of Completion:**
- [ ] `docker compose ps` shows all services healthy.
- [ ] Grafana 3000 accessible; login succeeds (admin/admin or env-var); all datasources green.
- [ ] Prometheus /graph accessible; can query up{job="prometheus"}.
- [ ] Loki /loki/api/v1/labels accessible; returns service, env, level labels.
- [ ] Tempo /api/traces accessible; can ingest test trace via otlp/http.
- [ ] Alertmanager /api/v1/status accessible; alerts configured.
- [ ] OTel Collector logs show OTLP receivers listening and processors running.

---

### Capacity 2: TypeScript App Scaffold & DDD Structure
Repository with strict TypeScript, path aliases, DDD folder layout, and shared kernel types.

**Tasks:**
1. [ ] Project init:
   - `pnpm init`, set `packageManager` field to pnpm.
   - Add .npmrc (store-dir, save-exact, shamefully-hoist off).
   - Create `.tool-versions` (node 20.x, pnpm 9.x) and .nvmrc (20.x).
2. [ ] TypeScript config (tsconfig.json):
   - Strict mode ON: noImplicitAny, strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, noImplicitThis, alwaysStrict, noUnusedLocals, noUnusedParameters, noImplicitReturns, noFallthroughCasesInSwitch, exactOptionalPropertyTypes.
   - target ES2020, module ESNext, lib ES2020.
   - Incremental build, skipLibCheck, forceConsistentCasingInFileNames.
   - Path aliases: @core/*, @shared/*, @tests/*, @ops/*.
   - Outdir dist, rootDir src.
3. [ ] Folder structure created:
   ```
   src/
     core/
       example/ (sample bounded context)
         domain/
           entities/ (User.ts with id: UserId brand type)
           valueObjects/ (UserId, Email)
           policies/ (PasswordPolicy)
           events/ (UserCreated event)
         application/
           ports/ (UserRepository interface)
           use-cases/ (CreateUserUseCase)
           dtos/ (CreateUserRequest, CreateUserResponse)
         infrastructure/
           adapters/ (InMemoryUserRepository)
           repositories/ (UserRepositoryImpl)
           mappers/ (UserMapper)
         interface/
           handlers/ (CreateUserHandler)
           validators/ (CreateUserValidator)
           presenters/ (UserPresenter)
     shared/
       kernel/
         errors/ (DomainError, ApplicationError base classes)
         id/ (createId, Id branded type factory)
         result/ (Result<T,E> or Either<E,T> with match/fold)
         time/ (Clock interface, SystemClock impl)
         logger/ (Logger interface, abstract)
         events/ (DomainEvent, EventBus abstractions)
         bus/ (CommandBus, QueryBus, EventBus stubs)
       utils/
         string/ (slug, normalize)
         collections/ (groupBy, partition)
   tests/
     unit/
       core/example/domain/ (UserIdSpec, PasswordPolicySpec)
       core/example/application/ (CreateUserUseCaseSpec)
     integration/
       core/example/infrastructure/ (InMemoryUserRepositorySpec)
     e2e/
       api/ (CreateUser via HTTP)
   config/
     env.schema.ts (Zod schema for env vars)
     defaults.ts
   scripts/
     tracing-demo.ts (sample script emitting OTel telemetry)
   ```
4. [ ] Shared kernel types and abstractions:
   - DomainError, ApplicationError, ValidationError with structured messages.
   - Result<T, E> (success/failure) with map, flatMap, fold.
   - UserId = Brand<string, 'UserId'>, userId factory.
   - Clock interface and SystemClock impl for time abstraction.
   - Logger interface (debug, info, warn, error) with noop impl.
   - DomainEvent interface; EventBus stubs.
5. [ ] Sample bounded context (example):
   - User entity with UserId brand type, email ValueObject.
   - PasswordPolicy domain service.
   - CreateUserUseCase in application layer taking ports.
   - UserRepository interface (port); InMemoryUserRepository adapter.
   - CreateUserHandler controller, CreateUserValidator.

**Proof of Completion:**
- [ ] `pnpm install` succeeds.
- [ ] `pnpm tsc --noEmit` passes (zero errors).
- [ ] `pnpm exec vitest list` shows all test files discovered.
- [ ] `pnpm exec vitest run` executes unit tests for User entity, PasswordPolicy, CreateUserUseCase; all pass.
- [ ] `import { UserId } from '@shared/kernel/id'` works; wrong type assignment caught at compile.
- [ ] Folder structure matches layout; no orphaned files.

---

### Capacity 3: Linting & Code Quality Enforcement
ESLint + formatter + boundary rules + git hooks + CI checks.

**Tasks:**
1. [ ] ESLint flat config (eslint.config.js):
   - typescript plugin with strict settings.
   - Disable default exports (/@typescript-eslint/explicit-module-boundary-types, no-default-export).
   - Enforce explicit return types on exports.
   - no-floating-promises, no-explicit-any (except in .test files with escape comment).
   - prefer-const, eqeqeq, curly, no-var.
   - eslint-plugin-sonarjs (cognitive complexity, code smell).
   - eslint-plugin-security (injection, hardcoded secrets).
   - eslint-plugin-import (order imports: builtins, externals, @scope, @core, @shared, relative; no-cycle).
   - eslint-plugin-boundaries (disallow cross-layer imports: domain can't import application/infrastructure, etc).
   - eslint-plugin-functional (immutability in domain layer; const assertion in domain objects).
2. [ ] Formatter (Biome or Prettier):
   - Line width 100, indent 2, quotes single, semicolons required.
   - .prettierignore or biome.json configured.
3. [ ] lint-staged config:
   - On commit: eslint --fix, prettier/biome --write, tsc --noEmit on touched .ts files.
   - Run unit tests on modified files (vitest --related).
4. [ ] Lefthook or husky + commitlint:
   - pre-commit: lint-staged.
   - pre-push: pnpm run typecheck && pnpm run test:unit.
   - commit-msg: commitlint (enforce Conventional Commits: feat/fix/docs/test/chore).
5. [ ] Additional checks:
   - ts-prune in CI to detect unused exports.
   - knip or depcheck to find unused dependencies.
6. [ ] pnpm scripts added:
   - `lint`: eslint src tests.
   - `lint:fix`: eslint --fix src tests.
   - `format:check`: prettier/biome --check.
   - `format`: prettier/biome --write src tests.
   - `typecheck`: tsc --noEmit.

**Proof of Completion:**
- [ ] `pnpm lint` on clean code: passes (zero errors).
- [ ] `pnpm lint` on code with any/console.log/floating promise: fails with clear message.
- [ ] `pnpm format:check` on unformatted file: fails; `pnpm format` fixes it.
- [ ] Cross-layer import (domain imports infrastructure): `pnpm lint` catches and fails.
- [ ] Commit message not conventional (e.g., "add stuff"): commitlint rejects.
- [ ] Pre-commit hook blocks if lint/typecheck fails.
- [ ] CI job runs `pnpm lint`, `pnpm typecheck`, `pnpm test:unit --coverage` and reports coverage.

---

### Capacity 4: Git Hygiene & CI Baseline
Initialized repo with conventional commits, CI skeleton, version management.

**Tasks:**
1. [ ] Git init and config:
   - `.gitattributes` (normalize LF, mark binaries).
   - `.gitignore` (node_modules, dist, coverage, .env.local, .vscode/settings, .DS_Store, etc).
   - Initial commit: setup files.
2. [ ] Conventional Commits & changelog:
   - commitlint.config.js configured (feat, fix, docs, test, chore, perf, refactor, ci, build, revert).
   - CHANGELOG.md template or release-please config.
3. [ ] Version management:
   - package.json version bumped to 0.0.1.
   - Semver in CI: patch for fix, minor for feat, major for BREAKING CHANGE.
4. [ ] CI workflow (GitHub Actions / GitLab / other):
   - .github/workflows/ci.yml or .gitlab-ci.yml:
     - Trigger on push to main, PR.
     - Setup Node (pnpm), cache pnpm store.
     - Run: lint, typecheck, test:unit, test:integration (with docker-compose).
     - Collect coverage (codecov or similar).
     - Build docker image (if applicable).
   - Require all checks pass before merge.
5. [ ] Signed commits (optional but opinionated):
   - Docs added to CONTRIBUTING.md.

**Proof of Completion:**
- [ ] `git log --oneline` shows conventional commit messages (feat: add user domain, fix: password validation bug).
- [ ] `git commit -m "oops"` rejected by pre-commit hook / commitlint.
- [ ] `git push` to PR runs CI; lint/typecheck/tests visible in checks.
- [ ] Coverage report generated; accessible in CI artifacts.
- [ ] Tag v0.0.1 created; changelog updated.

---

### Capacity 5: OTel SDK Integration & Telemetry Bootstrap
App emits traces, metrics, and logs to local Collector with correct resource attributes.

**Tasks:**
1. [ ] Install OTel packages:
   - @opentelemetry/sdk-node, @opentelemetry/sdk-trace-node.
   - @opentelemetry/instrumentation-http, @opentelemetry/instrumentation-pino (or winston).
   - @opentelemetry/exporter-trace-otlp-http, @opentelemetry/exporter-metrics-otlp-http.
   - @opentelemetry/api, @opentelemetry/resources.
2. [ ] Create src/shared/kernel/telemetry/index.ts:
   - Exports initializeTracing(serviceName, env).
   - Creates NodeSDK with: Resource(service.name, service.version, deployment.environment, etc).
   - Configures OTLP exporter to http://localhost:4318/v1/traces.
   - Auto-instruments HTTP, pino/winston.
   - Returns sdk.start().
3. [ ] Create src/shared/kernel/telemetry/metrics.ts:
   - Exports MetricsProvider singleton.
   - Creates metrics via @opentelemetry/api (counter, histogram).
   - Exports functions: recordHttpDuration, recordDatabaseQuery, etc.
4. [ ] Create src/shared/kernel/logger/otel-logger.ts:
   - Logger that wraps pino/winston and injects trace/span ids into log context.
   - Exports createLogger(name: string): Logger.
5. [ ] Sample HTTP endpoint (src/core/example/interface/handlers/health.handler.ts):
   - GET /health returns 200 with JSON body.
   - Emits span: tracer.startActiveSpan("health-check").
   - Logs at info level with trace context.
6. [ ] Sample metric endpoint (implicit in Collector scrape or custom /metrics):
   - Prometheus client or OTel metrics exporter wires up counter (requests_total) and histogram (request_duration_ms).
7. [ ] Bootstrap file (src/main.ts or src/index.ts):
   - Calls initializeTracing('modulith-dx', process.env.NODE_ENV).
   - Starts HTTP server listening on port 3000.
   - Routes: GET /health, GET /metrics (if exposing Prom format).

**Proof of Completion:**
- [ ] `pnpm run dev` (or `tsx src/main.ts`) starts app; logs show "Tracing initialized" and "Server listening on :3000".
- [ ] `curl http://localhost:3000/health` returns 200; Grafana Tempo shows new trace with span "health-check" and log lines with traceid.
- [ ] Prometheus scrape shows app_requests_total{method=GET, path=/health} and request_duration_ms histogram quantiles.
- [ ] Loki shows log lines; `{service="modulith-dx", level="info"} | json trace_id` filters logs by traceid.
- [ ] Exemplar in Prometheus histogram links latency to trace in Tempo.

---

### Capacity 6: Sample Bounded Context & Test Pyramid
Example domain (User) with unit, integration, and e2e test coverage.

**Tasks:**
1. [ ] Domain layer (src/core/example/domain):
   - User.ts: entity with UserId (brand type), email, createdAt; methods: isActive(), changeEmail(newEmail).
   - UserId.ts: value object factory.
   - Email.ts: value object with validation.
   - PasswordPolicy.ts: domain service with static validate(pwd): Result<void, PasswordError>.
   - UserCreated.ts: domain event.
2. [ ] Application layer (src/core/example/application):
   - CreateUserUseCase.ts: use case taking UserRepository (port) and Clock, returns Result<User, Error>.
   - UserRepository.ts: port interface with save(user): Promise<void>, findById(id): Promise<User | null>.
3. [ ] Infrastructure layer (src/core/example/infrastructure):
   - InMemoryUserRepository.ts: adapter implementing UserRepository with Map storage.
   - UserMapper.ts: maps domain User to DTO and vice versa.
4. [ ] Interface layer (src/core/example/interface):
   - CreateUserController.ts: takes request, calls use case, returns response.
   - CreateUserValidator.ts: validates input against schema (Zod).
5. [ ] Test files:
   - tests/unit/core/example/domain/User.spec.ts: User.changeEmail() validation, isActive() logic.
   - tests/unit/core/example/domain/PasswordPolicy.spec.ts: password rules (min 8 chars, uppercase, number).
   - tests/unit/core/example/application/CreateUserUseCase.spec.ts: mocked repository, success/error flows.
   - tests/integration/core/example/infrastructure/InMemoryUserRepository.spec.ts: save/findById semantics.
   - tests/e2e/user.api.spec.ts: POST /users -> database -> GET /users/:id; verify telemetry emitted.

**Proof of Completion:**
- [ ] `pnpm test:unit` runs 4+ unit tests; all pass; coverage > 80% on src/core/example/domain and application.
- [ ] `pnpm test:integration` runs 1+ integration tests against real (in-memory) adapter.
- [ ] `pnpm test:e2e` (optional) starts compose stack, app, hits API, verifies response and trace in Grafana.
- [ ] No console logs; structured logging only via Logger abstraction.
- [ ] Linting on test files: mock(), describe(), it() recognized; no false positives.
