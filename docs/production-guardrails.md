# Production Safety Guardrails

This repository uses a **green-build-only** policy before any production aliasing.

## Required Gate (local or CI)

Run:

```bash
./scripts/preprod-guardrail.sh
```

That script enforces:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test:engine` (edge-case engine hardening scenario)
5. `npm run build`

If any step fails, **do not alias to production**.

## Manual Checklist

- [ ] Working tree is clean (`git status`)
- [ ] `./scripts/preprod-guardrail.sh` passes locally
- [ ] CI workflow `Production Guardrail` passes on the branch/commit
- [ ] Only then perform production aliasing/deploy

## Why this exists

The hardening script validates a high-risk interaction stack in one flow:

- stacked discounts
- special-card effects
- payday injection
- endgame boundary behavior

This protects against regressions where production could appear healthy but game-economy calculations are wrong.
