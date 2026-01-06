# {Decision Title}

**Status**: Proposed | Accepted | Deprecated | Superseded  
**Deciders**: {Name(s)}  
**Date**: YYYY-MM-DD  
**Tags**: `domain` `application` `infrastructure` `testing` `observability` `tooling`  
**Impact**: `high` | `medium` | `low`  
**Enforcement**: `automated` | `semi-automated` | `manual`

## Problem
{What we're solving. 1-2 sentences.}

## Decision
{What we chose. Clear, actionable.}

## Rationale
- ✅ {Benefit 1}
- ✅ {Benefit 2}
- ⚠️ {Trade-off 1}
- ⚠️ {Trade-off 2}
- ❌ **{Rejected Alternative}**: {Why not}

## Compliance
```bash
{Check command - e.g., npm run lint:rule-name}
```
**Auto**: ESLint `rule-name` | Generator `nx g {type}` | CI `job-name` | TS `--flag`  
**Manual**: {Checklist item for PR review}

## Links
- Spec: [{primitive}](../ddd-implementation/primitives/{primitive}/specification.md)
- Related: [ADR-XXX](../accepted/other-decision.md)
