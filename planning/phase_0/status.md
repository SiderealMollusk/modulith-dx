## Phase 0 Status

- State: Not started (awaiting stack bring-up).
- Owner: TBD
- Scope: Stand up observability-ready TypeScript baseline per punchlist.

### Readiness
- Repo initialized: No
- Tooling installed (pnpm, node): Partial/unknown
- Docker available for stack: Yes/assumed (verify)

### Health
- Risks: Environment drift (node/pnpm versions), missing Docker resources, overly strict lint blocking progress.
- Mitigations: Pin versions via `.tool-versions`/`.nvmrc` + `packageManager`; keep lint staged; add `make check` wrapper.

### Next Actions
- Confirm runtime toolchain (Node LTS, pnpm) and install.
- Generate scaffolding: tsconfig, eslint/formatter configs, commitlint, hooks.
- Add docker-compose + collector/backend configs; smoke test stack.
- Wire OTel SDK into sample HTTP endpoint; verify traces/metrics/logs in Grafana.

### Exit Criteria (evidence)
- Punchlist proofs met: stack healthy, app emits telemetry, DDD skeleton present, linting enforced, CI baseline green.