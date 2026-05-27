---
name: diagnose-build-failure
description: Pull build logs from a failed Hostinger deployment and identify common failure modes (missing env vars, framework preset mismatch, dep install errors, Node version mismatch).
when-to-use: A Hostinger deployment failed, the build is stuck, or the user reports "my site won't deploy" / "the build broke".
---

# Diagnose a Hostinger build failure

## When to use

- A `create_nodejs_deployment` or static deploy returned a failed status.
- User reports the live site is showing a build/runtime error.
- User asks "why did my deploy fail?".

## Inputs to gather first

1. Domain and deployment ID (if user knows it). Otherwise call `list_deployments` for the domain.
2. Approximate time of the failure (for log ranging).

## Steps

1. Call the Hostinger MCP `hostinger` server:
   - `get_deployment` for the deployment ID → status, framework preset, Node version.
   - `get_deployment_logs` → full build + runtime logs.
2. Scan logs for the failure signatures below and report the most likely cause + concrete fix.

## Common failure modes

| Signature in logs | Likely cause | Fix |
|---|---|---|
| `Error: Cannot find module 'X'` | Missing dependency | Add to `package.json`; redeploy. |
| `ENV_VAR is not defined`, `undefined is not a function` referring to `process.env.X` | Missing env var | Add via `update_nodejs_env_vars` MCP tool. |
| `npm ERR! peer dep`, `ERESOLVE` | Dep resolution conflict | Pin versions or use `npm install --legacy-peer-deps`. |
| `engine "node" is incompatible` | Node version mismatch | Match `engines.node` in `package.json` to the plan's supported Node version. |
| `Build command failed: <framework>` but framework preset is "generic" | Preset mismatch | Re-run deploy with the correct framework preset (SvelteKit, Hono, Remix, Fastify, Astro, Next.js). |
| `out of memory`, `JavaScript heap out of memory` | Build memory cap | Reduce build memory footprint or upgrade plan. |
| `permission denied`, `EACCES` writing to `/` | Wrong start command | Ensure the start command writes only inside the project workdir. |
| `Address already in use`, port collision | Port hardcoded | Use `process.env.PORT`. |

## Report format

Reply with:
1. **Cause** — one sentence, citing the exact log line.
2. **Fix** — concrete diff / MCP tool to call.
3. **Next action** — offer to apply the fix (with explicit user confirmation for any write).

## Do not

- Do not guess the cause without quoting a log line.
- Do not redeploy automatically — propose the fix and wait for confirmation.
