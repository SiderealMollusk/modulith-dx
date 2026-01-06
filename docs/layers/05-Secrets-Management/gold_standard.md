# Layer 5: Secrets Management

Environment variables, credential handling, and secure configuration across development, staging, and production environments.

## Overview

**What you provide:**
- Environment variable schema definitions (typed, validated)
- .env.example documentation (safe, no secrets)
- Secret validation at startup (fail fast)
- Configuration handling across environments
- Secret injection in CI/CD pipelines
- Audit and rotation procedures

**What you delegate:**
- Secret storage backend (GitHub Secrets, Vault, AWS Secrets Manager, etc.)
- Credential rotation infrastructure (if using external tool)
- Access control and RBAC (platform responsibility)
- Encryption at rest (platform responsibility)

**Observability rules:**
- ✅ **Must:** Validate all required secrets on startup
- ✅ **Must:** Log configuration issues (missing secrets, invalid values)
- ✅ **Must:** Never log secret values (redact in logs)
- ✅ **Must:** Track secret validation in health check
- ✅ **Must:** Audit secret access via logs (who read what, when)
- ❌ **Never:** Commit secrets to git (.env, .env.production, etc.)
- ❌ **Never:** Log secret values (keys, tokens, passwords, API keys)
- ❌ **Never:** Use unvalidated configuration (fail fast)
- ❌ **Never:** Hardcode secrets in source code

**Enforced by:**
- Pre-commit hook blocks .env commits
- ESLint rule flags hardcoded secrets
- Startup validation (crashes if secrets missing)
- Environment variable schema type checking

---

## Create New

When setting up secrets management for a new project:

1. **Define environment variable schema** in `config/env.schema.ts`
2. **Create `.env.example`** with placeholder values
3. **Create `.gitignore` entry** to prevent .env commits
4. **Add startup validation** in `src/main.ts`
5. **Configure per-environment** (dev, staging, production)
6. **Document all secrets** in runbook
7. **Set up secrets in CI/CD** (GitHub Secrets, Vault, etc.)

### Example Environment Schema

```typescript
// config/env.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // Database
  DATABASE_URL: z.string().url('Must be valid database connection string'),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
  
  // Observability
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SAMPLING_RATE: z.coerce.number().min(0).max(1).default(0.1),
  
  // Secrets (API keys, tokens)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  API_KEY_GITHUB: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional().startsWith('sk_'),
  
  // Service URLs
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USERNAME: z.string(),
  SMTP_PASSWORD: z.string(),
  
  // Feature flags
  FEATURE_NEW_CHECKOUT: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
});

export type Environment = z.infer<typeof envSchema>;

export function validateEnv(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('\n');
      
      console.error('❌ Environment validation failed:\n', issues);
      process.exit(1);
    }
    throw error;
  }
}
```

### Example .env.example

```bash
# Server
NODE_ENV=development
PORT=3000

# Database (local PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/modulith_dx_dev
DATABASE_POOL_SIZE=10

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SAMPLING_RATE=1.0

# Secrets (get from 1Password, Vault, etc.)
JWT_SECRET=your-secret-key-min-32-characters-required
API_KEY_GITHUB=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SMTP (email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply@example.com
SMTP_PASSWORD=your-app-password-not-personal-password

# Feature flags
FEATURE_NEW_CHECKOUT=false
```

### .gitignore Entry

```bash
# Environment files - NEVER commit unencrypted
.env
.env.local
.env.*.local
.env.production
.env.staging

# SOPS: age key (keep private, share via 1Password)
.age/
.age/keys.txt

# Keep example and encrypted files in git
!.env.example
!.env.encrypted
!.sops.yaml
```

---

## Create New (Continued): Startup Initialization

### Example src/main.ts Integration

```typescript
// src/main.ts
import { validateEnv } from '@config/env.schema';

// Validate environment BEFORE importing app
const env = validateEnv();

console.log(`✅ Environment validated successfully`);
console.log(`   NODE_ENV: ${env.NODE_ENV}`);
console.log(`   DATABASE: ${env.DATABASE_URL.replace(/:.*@/, ':***@')}`);  // Redact password
console.log(`   PORT: ${env.PORT}`);

// Now safe to import app (knows all secrets available)
import { createApp } from './app';

const app = createApp(env);
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
});
```

### Example config/index.ts

```typescript
// config/index.ts
import { validateEnv, type Environment } from './env.schema';

let cachedEnv: Environment | null = null;

export function getEnv(): Environment {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

// Usage in application
import { getEnv } from '@config';
const env = getEnv();
const dbUrl = env.DATABASE_URL;  // Type-safe, guaranteed to exist
```

---

## Development Practices

1. **Local Development Setup**:
   - Copy `.env.example` to `.env.local`
   - Fill in local values (can use dummy values for optional secrets)
   - For production-only secrets: skip, service will degrade gracefully
   - Never commit `.env.local` to git

2. **SOPS: Encrypted Secrets in Git** (Recommended for team development):
   
   **Setup**:
   ```bash
   # Install SOPS
   brew install sops
   
   # Install age (encryption backend)
   brew install age
   
   # Generate age key (or use GPG, KMS, etc.)
   age-keygen -o ~/.age/keys.txt
   
   # Create .sops.yaml in repo root
   cat > .sops.yaml << 'EOF'
   creation_rules:
     - path_regex: '\.env\.encrypted'
       key_groups:
         - age: "age1abc123def456..."  # from above
   EOF
   
   # Create encrypted .env file
   sops -i .env.encrypted
   
   # This launches editor; save with secrets
   # File is auto-encrypted on save
   ```
   
   **Usage**:
   ```bash
   # View decrypted content
   sops .env.encrypted
   
   # Edit decrypted content (auto-encrypts on save)
   sops -i .env.encrypted
   
   # Decrypt to .env.local for local dev
   sops -d .env.encrypted > .env.local
   
   # Or decrypt at runtime (no .env.local needed)
   # See src/main.ts integration below
   ```
   
   **Startup Integration** (with SOPS):
   ```typescript
   // src/main.ts
   import { execSync } from 'child_process';
   import { validateEnv } from '@config/env.schema';
   
   // Decrypt SOPS file if it exists
   if (fs.existsSync('.env.encrypted')) {
     const decrypted = execSync('sops -d .env.encrypted', { encoding: 'utf-8' });
     
     // Parse decrypted env vars into process.env
     decrypted.split('\n').forEach(line => {
       if (line && !line.startsWith('#')) {
         const [key, value] = line.split('=');
         if (key && value) {
           process.env[key] = value;
         }
       }
     });
   }
   
   // Now validate (secrets loaded either from .env.local or .env.encrypted)
   const env = validateEnv();
   console.log(`✅ Environment validated (from .env.local or .env.encrypted)`);
   ```
   
   **CI/CD Integration** (GitHub Actions):
   ```yaml
   # .github/workflows/ci.yml
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         # Install sops and age
         - uses: mdgrs-mei/setup-sops@v2
           with:
             version: v3.8.0
         
         # Decrypt SOPS file using GitHub secret
         - env:
             SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
           run: sops -d .env.encrypted > .env.test
         
         # Use decrypted file for tests
         - run: npm ci && npm test
   ```
   
   **Team Sharing**:
   - `.sops.yaml` committed to git (defines encryption keys)
   - `.env.encrypted` committed to git (encrypted secrets visible but unreadable)
   - `.age/keys.txt` or GPG key: shared via secure channel (1Password, etc.), NOT git
   - Each team member: imports shared key, can decrypt `.env.encrypted`
   - Revoke: remove key from `.sops.yaml`, re-encrypt with new key
   
   **Benefits**:
   - ✅ Secrets in git (encrypted, safe)
   - ✅ No `.env.local` needed (decrypt on-demand)
   - ✅ Team can share one encrypted file
   - ✅ Audit trail (git history shows when secrets changed)
   - ✅ No external service needed (no GitHub Secrets required)

3. **Secret Validation Levels**:
   ```typescript
   // Required: crash if missing
   DATABASE_URL: z.string(),
   
   // Optional: use default if missing
   OTEL_ENDPOINT: z.string().optional(),
   
   // Optional with default value
   LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
   
   // Conditional: required only in production
   JWT_SECRET: z.string().refine(
     (val) => process.env.NODE_ENV !== 'production' || val.length >= 32,
     { message: 'JWT_SECRET required and must be 32+ chars in production' }
   ),
   ```

3. **Secret Sources by Environment**:
   
   **Development**:
   - `.env.local` (local file, not committed) - simplest, for local-only development
   - **RECOMMENDED**: `.env.encrypted` with [SOPS](https://github.com/getsops/sops) (encrypted, committed to repo)
     - Secrets stored encrypted on disk
     - Decrypted at runtime via KMS, GPG, or age
     - Safe to commit to git (encrypted)
     - Shared with team via access controls
   - `1Password` or similar (team password manager)
   - Docker Compose `.env` (local stack, not committed)
   
   **Staging**:
   - GitHub Secrets (set in repo settings, scoped to staging environment)
   - SOPS with staging KMS key (different from dev/prod)
   - `GITHUB_SECRET_*` prefix for clarity
   - Injected by CI workflow into container
   
   **Production**:
   - AWS Secrets Manager, Vault, or similar (preferred for production)
   - SOPS with production KMS key (restricted access)
   - Injected by deployment tool (Terraform, helm, etc.)
   - Rotated on schedule (30-90 days)
   - Never committed to git (encrypted or managed externally)

4. **Configuration Patterns**:
   
   ```typescript
   // Feature flags (controlled by environment)
   const isNewCheckoutEnabled = env.FEATURE_NEW_CHECKOUT === 'true';
   
   // Service URLs (change by environment)
   const stripeApiUrl = env.NODE_ENV === 'production'
     ? 'https://api.stripe.com'
     : 'https://sandbox.stripe.com';
   
   // Database connections (sensitive, validated)
   const db = new Database(env.DATABASE_URL, {
     poolSize: env.DATABASE_POOL_SIZE,
     ssl: env.NODE_ENV === 'production'  // SSL required in prod
   });
   ```

5. **Secret Injection in CI/CD**:
   ```yaml
   # .github/workflows/deploy.yml
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment: production  # Link to GitHub environment
       env:
         DATABASE_URL: ${{ secrets.DATABASE_URL }}
         JWT_SECRET: ${{ secrets.JWT_SECRET }}
         API_KEY_GITHUB: ${{ secrets.API_KEY_GITHUB }}
       steps:
         - uses: actions/checkout@v3
         - run: npm ci
         - run: npm run build
         - run: docker build -t app:${{ github.sha }} .
         - run: docker run app:${{ github.sha }} npm start
   ```

---

## Code Maintenance Practices

1. **Secret Rotation**:
   - **Schedule**: Every 30-90 days (adjust based on risk)
   - **Process**:
     1. Generate new secret
     2. Update in secret storage (don't delete old one yet)
     3. Redeploy application (old+new secrets supported)
     4. Monitor for errors (clients using old secret?)
     5. Delete old secret after grace period
   - **Example**: JWT_SECRET rotation
     ```typescript
     const primarySecret = env.JWT_SECRET;
     const secondarySecret = env.JWT_SECRET_SECONDARY;  // Old secret, still accepted
     
     // During validation, try primary first, then secondary
     function verifyJWT(token: string) {
       try {
         return verify(token, primarySecret);
       } catch {
         return verify(token, secondarySecret);  // Accept old tokens
       }
     }
     ```

2. **Audit Logging**:
   - Log when secrets are accessed (not the value, just the action)
   - Log validation failures (which secrets failed)
   - Log configuration changes (when/who changed secret)
   - Example:
     ```typescript
     this.logger.info('Secret validation', {
       secrets_validated: ['DATABASE_URL', 'JWT_SECRET', 'SMTP_PASSWORD'],
       environment: env.NODE_ENV,
       timestamp: new Date().toISOString()
     });
     ```

3. **Detecting Hardcoded Secrets**:
   - ESLint rule to flag suspicious patterns:
     ```javascript
     // .eslintrc.json custom rule
     'no-hardcoded-secrets': ['error', {
       patterns: ['sk_', 'ghp_', 'pk_', 'api[_-]key', 'password.*=']
     }]
     ```
   - Pre-commit hook using `detect-secrets` tool:
     ```bash
     pip install detect-secrets
     detect-secrets scan --baseline .secrets.baseline
     ```

4. **Documentation**:
   - `.env.example` shows all available variables
   - Runbook documents required vs. optional secrets
   - Comments explain sensitive fields:
     ```bash
     # JWT_SECRET: Used to sign authentication tokens
     # - Min 32 characters
     # - Rotate every 90 days
     # - Revokes all active tokens on change
     JWT_SECRET=
     ```

5. **Environment-Specific Secrets**:
   - Use GitHub Environments feature (different secrets per environment)
   - Example:
     ```yaml
     # Staging environment - use sandbox APIs
     environment: staging
     secrets:
       STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY_SANDBOX }}
     
     # Production environment - use live APIs
     environment: production
     secrets:
       STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY_LIVE }}
     ```

---

## Operations

1. **Startup Verification**:
   - Health check includes secret validation status
   - Example:
     ```typescript
     app.get('/readyz', async (req, res) => {
       const checks = {
         secrets_validated: true,  // Checked at startup
         database_connected: await checkDatabase(),
         collector_ready: await checkCollector()
       };
       res.status(Object.values(checks).every(c => c) ? 200 : 503).json(checks);
     });
     ```

2. **Incident: Missing Required Secret**:
   - **Symptom**: Application crashes on startup
   - **Root cause**: Secret not injected by CI/CD or secret storage
   - **Investigation**:
     ```bash
     # Check logs
     docker logs app-container | grep "Environment validation failed"
     
     # Check GitHub Secrets (if using GitHub)
     gh secret list
     
     # Check GitHub Actions variables
     gh variable list
     ```
   - **Fix**:
     1. Add missing secret to GitHub Secrets or Vault
     2. Redeploy (CI/CD injects secret)
     3. Verify startup logs show success

3. **Incident: Secret Exposure**:
   - **Prevention**: Never log secret values, redact URLs
   - **If exposed**:
     1. Immediately revoke secret (if possible)
     2. Rotate to new secret (deploy immediately)
     3. Search logs for leakage (grep SECRET_VALUE)
     4. Check git history (if accidentally committed)
     5. Postmortem: prevent repeat

4. **Monitoring Secret Health**:
   - **Metric**: `secret_validation_success` (1 = all valid, 0 = failure)
   - **Alert**: If secret validation fails on deployment
   - **Check**: Verify `/readyz` endpoint includes secret check
   - **Schedule**: Automated secret rotation reminders (calendar)

5. **Secrets Lifecycle**:
   ```
   Lifecycle of a secret (e.g., API key):
   
   1. Created
      - Generate in external system (Stripe, GitHub, etc.)
      - Store in secret manager (GitHub Secrets, Vault)
   
   2. Deployed
      - CI/CD injects into container at startup
      - Application validates it exists
      - Logger redacts it from output
   
   3. Rotated (every 30-90 days)
      - Generate new secret in external system
      - Update secret manager (primary + secondary)
      - Redeploy with both (backward compatible)
      - Monitor for errors using old secret
      - Delete secondary secret after grace period
   
   4. Revoked (if compromised)
      - Delete from secret manager immediately
      - Redeploy with new secret
      - Audit: what could have been accessed?
      - Notify users if applicable (e.g., compromised API key)
   ```

6. **Runbook: Rotating JWT_SECRET**:
   - **Procedure**:
     ```
     1. Generate new JWT_SECRET (32+ random chars)
     2. Update GitHub Secret:
        gh secret set JWT_SECRET --body 'new-secret-value'
     3. Keep old secret as JWT_SECRET_SECONDARY
     4. Deploy application
     5. Monitor logs for JWT validation errors
     6. After 7 days: remove JWT_SECRET_SECONDARY
     7. Deploy again
     8. Document rotation date in runbook
     ```
   - **Verification**:
     - New tokens use primary secret
     - Old tokens still validate (using secondary)
     - No 401 errors in logs post-deployment

7. **Runbook: Adding a New Secret**:
   - **Steps**:
     1. Define in `config/env.schema.ts`
     2. Add to `.env.example` (with placeholder)
     3. Create GitHub Secret or Vault entry
     4. Update CI/CD to inject it
     5. Update runbook documenting the secret
     6. Deploy and verify `/readyz` shows success
     7. Monitor health check status

8. **Runbook: Managing SOPS Encrypted Secrets**:
   - **Add a new secret**:
     ```bash
     sops -i .env.encrypted
     # Editor opens, add KEY=value
     # File auto-encrypted on save
     git add .env.encrypted
     git commit -m "chore: add new secret to .env.encrypted"
     ```
   
   - **Onboard new team member**:
     ```bash
     # 1. Share age key via 1Password/secure channel
     mkdir -p ~/.age
     # Paste key content into ~/.age/keys.txt
     chmod 600 ~/.age/keys.txt
     
     # 2. Clone repo, decrypt
     git clone ...
     sops -d .env.encrypted > .env.local
     
     # 3. Verify decryption worked
     cat .env.local  # Should show secrets
     ```
   
   - **Rotate encryption key**:
     ```bash
     # 1. Generate new age key
     age-keygen -o ~/.age/keys-new.txt
     
     # 2. Update .sops.yaml with new key
     vim .sops.yaml  # Add new age key
     
     # 3. Re-encrypt file with new key
     sops updatekeys .env.encrypted
     
     # 4. Verify file is encrypted with new key
     sops -d .env.encrypted > /tmp/test.env
     
     # 5. Commit and notify team
     git add .sops.yaml .env.encrypted
     git commit -m "chore: rotate sops encryption key"
     
     # 6. Team: import new key, test decryption
     ```
   
   - **Revoke team member access**:
     ```bash
     # 1. Remove their age key from .sops.yaml
     vim .sops.yaml  # Delete their key line
     
     # 2. Re-encrypt with remaining keys
     sops updatekeys .env.encrypted
     
     # 3. Commit and notify
     git add .sops.yaml .env.encrypted
     git commit -m "chore: revoke access for departing team member"
     
     # 4. Tell them to delete their age key
     ```

9. **Best Practices Checklist**:
   - [ ] All secrets in `.env` are validated at startup (not lazy-loaded)
   - [ ] `.env.example` is committed with placeholders (no real values)
   - [ ] `.env` files are in `.gitignore`
   - [ ] **SOPS**: `.env.encrypted` committed (encrypted), `.age/keys.txt` not committed
   - [ ] Secrets never logged (search codebase for `console.log(env.*)`)
   - [ ] CI/CD secrets properly scoped (per environment)
   - [ ] Rotation schedule documented and automated
   - [ ] Audit logs show secret access/changes
   - [ ] ESLint prevents hardcoded secrets
   - [ ] Health check includes secret validation
   - [ ] Runbooks cover secret incidents
   - [ ] Team onboarding docs include SOPS key distribution
