# Layer 5: Secrets Management - Implementation

Practical secrets management, SOPS setup, and rotation procedures.

## What Must Be True

**Mandatory invariants:**
- [ ] Environment schema defined and validated at startup
- [ ] No hardcoded secrets in code
- [ ] `.env.local` and `.env` in .gitignore
- [ ] `.env.example` committed (no real secrets)
- [ ] `.env.encrypted` encrypted with SOPS (if using)
- [ ] Secret validation crashes on startup if missing
- [ ] No console.log of secret values
- [ ] Pre-commit hook blocks .env commits
- [ ] ESLint rule detects hardcoded secrets

## Templating Strategies

**Scaffolding secrets setup:**
- Env schema template: `npm run scaffold:env-schema --context=modulith-dx`
- SOPS setup template: `npm run scaffold:sops-setup`
- Secret rotation template: `npm run scaffold:secret-rotation JWT_SECRET`

## Author-Time Verification

**Before commit:**
- Env schema validates correctly
- `npm run detect-secrets` passes
- No .env files staged
- Health check includes secret validation

## Runtime Monitoring

**Secrets observability:**
- Secret validation success metric
- Missing secret errors
- Secret access audit logs
- Secret rotation schedule tracking

## How to Edit

**Safe secret management:**
- Adding new secrets (add to schema, .env.example, docs)
- Rotating secrets (old + new, then remove old)
- Revoking access (remove from SOPS, re-encrypt)

## How to Document

**Keeping secrets docs current:**
- .env.example updated with all variables
- Runbooks for rotation and access revocation
- CI/CD secret injection documented
- SOPS team sharing procedures

## How to Test

**Testing secrets layer:**
- Validation schema tests
- Health check includes secret checks
- Missing secret causes startup failure
- Decryption tests (if using SOPS)

## Keep Aligned with Standards

**Validation:**
- No hardcoded secrets (ESLint)
- No commits of .env files (pre-commit)
- Startup validation enforced
- SOPS encryption standard
