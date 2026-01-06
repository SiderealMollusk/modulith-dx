# Layer 4: Runtime - Implementation

Practical Node.js setup, dependency management, and OTel initialization guidance.

## What Must Be True

**Mandatory invariants:**
- [ ] Node.js version pinned in .nvmrc and package.json
- [ ] OTel SDK initialized in main.ts before imports
- [ ] Health endpoints exported (/healthz, /readyz)
- [ ] /metrics endpoint for Prometheus
- [ ] All dependencies pinned in lock file
- [ ] Environment variables validated at startup
- [ ] npm audit passes (no critical vulnerabilities)
- [ ] Graceful shutdown handler configured

## Templating Strategies

**Scaffolding and templates:**
- New project: `npm run scaffold:project --name=modulith-dx --node=20`
- OTel SDK template: `npm run scaffold:otel --collector=http://localhost:4318`
- Health check template: `npm run scaffold:health-checks`

## Author-Time Verification

**Before commit:**
- TypeScript compiles
- npm audit passes
- Startup script works locally
- Environment schema validates
- Lock file consistent

## Runtime Monitoring

**Node.js observability:**
- Process uptime
- Memory usage (heap)
- Startup duration
- OTel export success rate

## How to Edit

**Safe dependency updates:**
- npm audit fix for minor/patch
- Review and test major updates
- Update lock file consistently
- Document breaking changes

## How to Document

**Documenting runtime:**
- Node.js version requirements
- Required environment variables
- Startup sequence and logging
- Dependency justification

## How to Test

**Testing runtime:**
- Startup script works
- Health endpoints respond
- OTel exports traces
- Graceful shutdown

## Keep Aligned with Standards

**Validation:**
- Node.js version policy enforced
- Dependency versions pinned
- OTel initialization happens first
- No undeclared environment dependencies
