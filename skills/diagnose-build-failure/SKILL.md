---
name: diagnose-build-failure
description: Pull build logs from a failed Hostinger deployment and identify the failure mode (missing dependency, Node version mismatch, wrong output directory, dependency resolution conflict).
when-to-use: A Hostinger deployment failed, the build is stuck, or the user reports "my site won't deploy" / "the build broke".
---

# Diagnose a Hostinger build failure

## When to use

- A deploy returned state `failed`.
- The user reports the live site showing a build or runtime error.
- The user asks "why did my deploy fail?".

## Inputs to gather first

1. Domain.
2. The build `uuid`. If the user doesn't have it, call `hosting_listJsDeployments` (or `hosting_listNodeJSBuildsV1`) for the domain and filter `states` to `failed`.
3. For `hosting_getNodeJSBuildLogsV1` you also need `username` — get it from `hosting_listWebsitesV1`.

## Steps

1. Fetch the logs:
   - `hosting_showJsDeploymentLogs` with `domain` + `buildUuid` for `hosting_deployJsApplication` builds.
   - `hosting_getNodeJSBuildLogsV1` with `username` + `domain` + `uuid` for archive builds.
   - Both accept a start line (`fromLine` / `from_line`) — page through rather than requesting one enormous response.
2. Log content may contain ANSI escape sequences. Strip them before quoting.
3. Match against the signatures below, then report the most likely cause and a concrete fix.

## Common failure modes

| Signature in logs | Likely cause | Fix |
|---|---|---|
| `Error: Cannot find module 'X'` | Dependency missing from `package.json`, or it was only in `devDependencies` | Add it to `dependencies`, rebuild |
| `npm ERR! ERESOLVE`, `peer dep` | Dependency resolution conflict | Pin versions, or commit a lockfile so the server installs deterministically |
| `engine "node" is incompatible`, syntax errors in dependency code | Node version mismatch | Set `node_version` to `18`, `20`, `22`, or `24` on `hosting_createNodeJSBuildFromArchiveV1`, or fix `engines.node` |
| `sh: vite: not found`, `build script not found` | Wrong `build_script`, or the build tool is in `devDependencies` and wasn't installed | Override `build_script`; verify the script name in `package.json` |
| `no such file or directory` for `package.json` | Wrong project root in a monorepo | Set `root_directory` relative to `public_html` |
| Build succeeds but the site 404s | Wrong `output_directory` | Point `output_directory` at the real build output, relative to the root directory |
| `JavaScript heap out of memory` | Build exceeded the memory cap | Reduce the build footprint, or upgrade the plan |
| Wrong package manager resolving deps | Lockfile/manager mismatch | Set `package_manager` to `npm`, `yarn`, or `pnpm` |
| App builds and starts but gets no traffic | Port hardcoded | Bind to `process.env.PORT` |
| `undefined` config values at runtime | Missing environment variables | Environment variables are not settable via the API — the user must add them in hPanel |

## Report format

1. **Cause** — one sentence, quoting the exact log line.
2. **Fix** — the concrete code change or the tool call with the specific override.
3. **Next action** — offer to apply it, and wait for confirmation.

## Do not

- Do not guess a cause without quoting a log line.
- Do not redeploy automatically — a redeploy overwrites what is live. Propose and wait.
- Do not blame a "framework preset" — Hostinger has no preset parameter. The overrides in `rules/nodejs-deployments.mdc` are the real knobs.
