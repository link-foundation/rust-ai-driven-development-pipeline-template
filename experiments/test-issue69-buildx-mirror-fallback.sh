#!/usr/bin/env bash
# Offline adapter regression; upstream owns Docker pull retries (PR #609).
set -euo pipefail
cd "$(dirname "$0")/.."
node --test experiments/issue-247-buildx.test.mjs
