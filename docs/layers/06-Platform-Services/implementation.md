# Layer 6: Platform Services - Implementation

CI/CD pipelines, linting, and deployment guidance.

## What Must Be True

**Mandatory invariants:**
- [ ] CI pipeline runs on all PRs
- [ ] All status checks pass before merge
- [ ] ESLint enforces no console.log (except main.ts)
- [ ] Coverage > 80% enforced
- [ ] Docker builds succeed
- [ ] No secrets in CI logs

## Templating Strategies

**CI/CD scaffolding:**
- GitHub Actions template: `npm run scaffold:ci --template=node`
- ESLint config template: `npm run scaffold:eslint --rules=custom`
- Dockerfile template: `npm run scaffold:docker --base=node:20-alpine`

## Author-Time Verification

**Before pushing:**
- Local lint passes (`npm run lint`)
- Local tests pass (`npm run test`)
- Coverage > 80%
- Docker builds locally

## Runtime Monitoring

**CI/CD observability:**
- CI job duration
- Test coverage trend
- Build success rate
- Deployment frequency

## How to Edit

**CI/CD safe changes:**
- Adding new linting rules (with --fix)
- Updating test requirements
- Adding deployment stages
- Modifying GitHub Actions versions

## How to Document

**CI/CD documentation:**
- .github/workflows/ inline comments
- ESLint rule justifications
- Deployment procedure
- Rollback steps

## How to Test

**Testing CI/CD:**
- Run workflows locally (act tool)
- Test deployment dry-runs
- Verify branch protection rules
- Test secret injection

## Keep Aligned with Standards

**CI validation:**
- ESLint rules enforced in CI
- Test coverage enforced
- Type checking enforced
- Inventory verification enforced
