#!/usr/bin/env bash
# Cursor `beforeShellExecution` hook: deny a `git commit` that would record
# something looking like a Hostinger API token.
#
# Contract (Cursor hooks v1): hook input arrives as JSON on stdin, the decision
# is JSON on stdout. We don't need any field from the input — the staged diff is
# the whole source of truth — so stdin is drained and discarded. Draining
# matters: exiting without reading can hand the caller an EPIPE.
#
# Fails open. The hook is registered with `failClosed: false` and every
# unexpected condition below returns `allow`, because a guard that cannot read
# the staged diff must not block every commit the user makes.

set -uo pipefail

cat >/dev/null 2>&1 || true

allow() {
  printf '{"permission":"allow"}\n'
  exit 0
}

command -v git >/dev/null 2>&1 || allow
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || allow

# Added lines only, skipping docs and .example files where a placeholder
# assignment is legitimate.
leaked=$(
  git diff --cached -U0 -- ':!*.example' ':!*.md' 2>/dev/null \
    | grep -E '^\+[^+].*(HOSTINGER_API_TOKEN|API_TOKEN)[[:space:]]*[=:][[:space:]]*["'\'']?[A-Za-z0-9_-]{16,}' \
    || true
)

if [ -n "$leaked" ]; then
  # Report which files are implicated rather than echoing the matched lines —
  # writing the token into the transcript is the thing we're preventing.
  files=$(git diff --cached --name-only -- ':!*.example' ':!*.md' 2>/dev/null | tr '\n' ' ')
  printf '{"permission":"deny","user_message":"Blocked: a staged change looks like it contains a Hostinger API token.","agent_message":"A staged change appears to assign a literal Hostinger API token. Do not commit it. Unstage the value, replace it with a placeholder or an environment variable reference, and set the real token via the HOSTINGER_API_TOKEN environment variable instead. Staged files: %s"}\n' "$files"
  exit 0
fi

allow
