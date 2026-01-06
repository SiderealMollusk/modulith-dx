# Layer 6: Platform Services

CI/CD pipelines, ESLint, pre-commit hooks, secrets management, build scripts, and deployment manifests.

## Overview

**What you provide:**
- CI/CD pipeline definitions (.github/workflows/)
- ESLint + Prettier configs (code quality)
- Pre-commit hooks (verify inventory, run tests)
- Build scripts, deployment manifests

**What you delegate:**
- GitHub Actions infrastructure
- Secret storage (see [Layer 5: Secrets Management](../05-Secrets-Management/gold_standard.md))
- Container registry (DockerHub, ECR)
- Artifact storage

**Observability rules:**
- ✅ **Must:** Run `/verify-observability` in CI
- ✅ **Must:** Run ESLint (no console.log, no undocumented code)
- ✅ **Must:** Run tests with coverage reporting
- ✅ **Must:** Build and push metrics dashboard configs
- ✅ **Must:** Scan for inventory drift (OBSERVABILITY_INVENTORY.md)
- ❌ **Never:** Merge PR with failing verification
- ❌ **Never:** Deploy code without test coverage > 80%

**Enforced by:**
- GitHub branch protection rules
- CI status checks (must pass all)
- Automated inventory updates via workflows

### Observability Artifacts
```
.github/workflows/
  ci.yml:
    - lint (eslint)
    - typecheck (tsc)
    - test:unit (vitest)
    - test:integration (vitest)
    - verify:inventory (bash scripts)
    - coverage report (codecov)
    - build docker image
    - push metrics dashboards

enforced-architecture/
  OBSERVABILITY_INVENTORY.md ← Single source of truth
  OBSERVABILITY_INVENTORY.meta.md ← Verification rules
  WORKFLOWS.md ← Automation definitions
```

## Create New

When setting up CI/CD for a new project:

1. **Create `.github/workflows/ci.yml`** with stages:
   - Lint & TypeScript check
   - Unit tests
   - Integration tests
   - Coverage validation
   - Build Docker image
   - Inventory verification

2. **Configure ESLint** (`.eslintrc.json`) with rules:
   - No console.log (except in main.ts)
   - No undocumented imports
   - Boundary enforcement (bounded context isolation)

3. **Add pre-commit hooks** (husky):
   - Run linter
   - Run fast unit tests
   - Verify inventory
   - Block commit if failures

4. **Create deployment manifest** (if using Kubernetes):
   - Liveness probe (`/healthz`)
   - Readiness probe (`/readyz`)
   - Environment variables
   - Resource limits

5. **Document deployment process**:
   - Manual steps (if any)
   - Rollback procedure
   - Monitoring after deployment

Example CI workflow:
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - run: npm run lint
      
      - run: npm run typecheck
      
      - run: npm run test:unit
      
      - run: npm run test:integration
      
      - run: npm run verify:inventory
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Development Practices

1. **ESLint Configuration**:
   - Extend `@eslint/recommended` and `@typescript-eslint`
   - Add custom rules:
     - No console.log (whitelist main.ts, tests)
     - No eval()
     - No undocumented public APIs
   - Configure boundary rule to prevent cross-context imports
   - Run `npm run lint -- --fix` to auto-fix

2. **Pre-commit Hooks**:
   - Install husky: `npm install husky --save-dev`
   - Configure hook: `.husky/pre-commit`
   - Run: lint, fast tests, inventory check
   - Fail fast (don't run all tests)
   - Allow bypass with `--no-verify` (rare)

3. **GitHub Actions**:
   - Reusable workflows (DRY principle)
   - Cache dependencies (npm ci with cache)
   - Parallel jobs (lint, test, build simultaneously)
   - Artifact storage (coverage reports)
   - Status checks (require all to pass before merge)

4. **Secrets & Environment**:
   - Configure per [Layer 5: Secrets Management](../05-Secrets-Management/gold_standard.md)
   - Use GitHub Secrets for sensitive values in CI/CD
   - Pass secrets as environment variables to containers
   - Verify `/readyz` endpoint validates all required secrets

5. **Docker Build**:
   - Multi-stage Dockerfile (small final image)
   - Use node:20-alpine (minimal)
   - Pin dependency versions (npm ci)
   - Build: `docker build -t modulith-dx:v1.0.0 .`
   - Push: `docker push ghcr.io/org/modulith-dx:v1.0.0`

## Code Maintenance Practices

1. **Prettier Configuration**:
   - Configure `prettier.config.js`
   - Enforce with pre-commit hook
   - Run: `npm run format` to auto-format
   - Make formatting non-blocking in CI (FYI only)

2. **Branch Protection**:
   - Require status checks (CI, code review)
   - Require up-to-date branches
   - Dismiss stale reviews on push
   - Restrict who can push to main

3. **Release Management**:
   - Tag releases: `v1.0.0`
   - Auto-generate changelog (conventional commits)
   - Create GitHub release with notes
   - Include breaking changes, features, fixes

4. **Dependency Updates**:
   - Use Dependabot for automated PRs
   - Configure update schedule (weekly, group by type)
   - Require tests to pass before merge
   - Document major version upgrades

5. **CI/CD Secret Injection**:
   - Refer to [Layer 5: Secrets Management](../05-Secrets-Management/gold_standard.md) for schema and validation
   - Inject secrets via GitHub Secrets into workflow environment
   - Map secrets to container environment variables
   - Never print secrets in logs (CI logs are searchable)

## Operations

1. **CI Status Checks**:
   - Lint: ESLint runs, no console.log found
   - TypeScript: tsc with strict mode, no errors
   - Tests: unit + integration pass, coverage > 80%
   - Inventory: OBSERVABILITY_INVENTORY.md in sync with code
   - Docker build: succeeds, image pushes to registry

2. **Deployment Pipeline**:
   - Trigger: tag push (e.g., `v1.0.0`)
   - Build & push Docker image
   - Update Kubernetes manifest (or docker-compose)
   - Run health check (curl /healthz)
   - Monitor metrics (error rate, latency)
   - Rollback on failure (revert to previous tag)

3. **Monitoring & Alerts**:
   - **Metrics**:
     - CI job duration (lint, test, build)
     - Test coverage trend
     - Build failure rate
   - **Alerts**:
     - CI failing (on main)
     - Coverage < 80%
     - Deployment failure

4. **Runbook: Deployment Failure**:
   - Check CI logs: lint, test, or build error?
   - Rollback: `git checkout v<previous-version>` and redeploy
   - Analyze failure: fix locally, push new tag
   - Notify team: use incident management tool

5. **Incident Response**:
   - Failed deployment: automatic rollback to last healthy version
   - High error rate post-deploy: trigger rollback via metrics alert
   - Recovery: once fixed, re-deploy new version
   - Postmortem: document root cause, update tests
