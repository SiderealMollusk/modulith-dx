# Observability-Ready TypeScript Stack

## Objectives
- TypeScript app with strong DDD/TD structure and strict linting.
- Full observability via OpenTelemetry -> Prometheus (metrics), Loki (logs), Tempo (traces), Grafana (viz), Alertmanager (routing).
- Git hygiene, hooks, CI.

## Stack Components
- Runtime: TypeScript (strict), pnpm.
- Observability: OTel SDK + Collector (OTLP in, Prometheus/Loki/Tempo out), Grafana, Alertmanager.
- Lint/format: ESLint flat config + Biome (or Prettier) + import/layer rules + security/perf plugins.
- Commit/automation: commitlint + conventional commits; lefthook or husky + lint-staged; ts-node/tsx for scripts.

## Repository Layout (DDD / TD)
- /src
  - /core/<bounded-context>
    - /domain (entities, value objects, policies, domain events)
    - /application (use cases, ports, DTOs, domain services orchestrations)
    - /infrastructure (adapters: db, http, message bus; repos; mappers)
    - /interface (controllers/handlers, validators, presenters/serializers)
  - /shared (kernel: errors, ids, time, result/either, logger abstraction, bus abstractions)
- /tests
  - /unit mirrors domain/application
  - /integration for adapters/infra
  - /contracts for external provider mocks
  - /e2e for system and observability assertions
- /ops
  - docker-compose.yml (Prometheus, Loki, Tempo, Grafana, Alertmanager, OTel Collector)
  - collector/otel-collector.yaml
  - prometheus/prometheus.yml, alertmanager/alertmanager.yml, grafana/provisioning/*, loki/config.yml
- /config (env schemas, defaults)
- /scripts (cli ops, db, fixtures, tracing demo)

## Environment & Tooling
1) Init project
   - pnpm init
   - Add tsconfig (strict, incremental, path aliases @core/*, @shared/*).
   - Add env loader + schema validation (zod/valibot) for edges.
2) Lint/format
   - ESLint flat config with: no default exports, explicit return types on exports, no-floating-promises, no-explicit-any, prefer-const, eqeqeq, curly, sonarjs, security, functional (limit mutation in domain), import/order, boundaries to enforce layers.
   - Biome/Prettier for formatting; ban console.*; structured logger only.
   - ts-prune/knip/depcheck in CI for dead code/deps.
3) Git/commit
   - .gitattributes normalize LF; .gitignore for node/build.
   - commitlint + conventional commits; changelog via release-please or standard-version.
   - lefthook/husky: pre-commit runs lint-staged (eslint + biome + typecheck on touched files), tests optional; pre-push runs full test suite.

## Observability Implementation
1) Application instrumentation
   - Use @opentelemetry/sdk-node with Resource attrs: service.name, service.namespace, service.version, deployment.environment.
   - Auto-instrument HTTP/gRPC/pg/mysql/redis as needed.
   - Manual spans around use cases; record domain-relevant attributes; use baggage sparingly.
   - Metrics via OTel API (counter/updown/histogram); exemplars enabled; expose /metrics if needed.
   - Logging via OTel logger provider; structured JSON; inject trace/span ids into logs.
2) Collector pipeline
   - Receivers: otlp/http and otlp/grpc; optional prometheus scrape if app exposes /metrics.
   - Processors: batch; attributes (add env/service); memory_limiter.
   - Exporters: otlp -> Tempo (traces); loki exporter -> Loki (logs); prometheusremotewrite -> Prometheus (metrics).
3) Backends
   - Prometheus scrape configs (app, collector); recording/alert rules for SLOs (availability, latency, error rate) using RED/USE.
   - Loki config for labels (service, env); pipeline stage to extract traceid from logs; link logs<->traces in Grafana.
   - Tempo configured with OTLP ingest; exemplar support; search enabled.
   - Alertmanager routes by severity/team; inhibit rules; receivers (email, Slack, PagerDuty).
4) Grafana
   - Datasources: Prometheus, Loki, Tempo, Alertmanager.
   - Dashboards as code: RED, USE, JVM/Node runtime, custom domain KPIs.
   - Correlate via trace id in logs; exemplars on latency histograms.

## CI/CD
- Pipeline stages: lint -> typecheck -> unit -> integration (spin compose services) -> e2e (optional) -> build -> push image -> publish coverage.
- Cache pnpm store; run ts-prune/knip; verify generated files (dashboards/rules) are committed.
- Optionally sign commits; trunk-based with short-lived branches.

## Next Steps
1) Scaffold repo (pnpm, tsconfig, eslint/biome configs, commitlint, lefthook, basic src/shared kernel types).
2) Add /ops docker-compose with Prometheus+Loki+Tempo+Grafana+Alertmanager+OTel Collector configs.
3) Wire OTel SDK bootstrap file and sample HTTP endpoint emitting spans/metrics/logs.
4) Add lint/boundary rules and sample bounded context skeleton.
5) Add CI workflow running lint/typecheck/tests/build and collecting coverage.
