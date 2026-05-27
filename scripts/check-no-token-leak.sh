#!/usr/bin/env bash
# Refuse the commit if any staged file looks like a leaked Hostinger API token.
# Hostinger personal access tokens are long opaque strings; the safest signal is
# a `HOSTINGER_API_TOKEN=` assignment with a non-empty literal value committed
# to a tracked file.

set -euo pipefail

leaked=$(git diff --cached -U0 -- ':!*.example' ':!*.md' \
  | grep -E '^\+[^+].*HOSTINGER_API_TOKEN\s*=\s*["'\'']?[A-Za-z0-9_\-]{16,}' \
  || true)

if [[ -n "$leaked" ]]; then
  echo "Refusing commit: looks like a Hostinger API token is being committed." >&2
  echo "Use environment variables or a secret store instead." >&2
  echo "" >&2
  echo "$leaked" >&2
  exit 1
fi
