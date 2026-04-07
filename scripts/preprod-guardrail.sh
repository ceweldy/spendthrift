#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔒 Spendthrift production guardrail"
echo "Running required quality gates before production aliasing..."

echo "\n1) Install dependencies"
npm ci

echo "\n2) Static checks"
npm run lint
npm run typecheck

echo "\n3) Engine hardening script"
npm run test:engine

echo "\n4) Production build"
npm run build

echo "\n✅ Guardrail checks passed."
echo "It is now safe to proceed with production aliasing/deployment."
