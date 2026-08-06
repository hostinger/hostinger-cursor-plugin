---
name: deploy-nodejs-app
description: Guide the agent through deploying a Node.js or static project to Hostinger. Use when the user asks to deploy, publish, or push an app to Hostinger.
when-to-use: User mentions deploying a Node.js / React / Vue / Vite / Express / Nest / Fastify / SvelteKit / Next.js app to Hostinger, or asks how to put a project live on a Hostinger domain.
---

# Deploy an app to Hostinger

## When to use

- User says "deploy this to Hostinger", "ship this app", or "put this live on <domain>".
- User wants to redeploy a project that already lives on Hostinger.

## Inputs to gather first

1. Target domain. Call `hosting_listWebsitesV1` if it's ambiguous — filter with the `domain` parameter, or page through with `page` / `per_page`.
2. Whether the project needs a build. A `package.json` with a `build` script means yes; a folder of finished HTML/CSS/JS means no.
3. Project root, if it isn't the repo root (monorepos).
4. Any build overrides the user already knows they need — Node version, package manager, entry file, output directory.

See `rules/nodejs-deployments.mdc` for the full list of accepted override values. Do not invent `app_type` values.

## Steps

1. Confirm the target domain and that deploying will overwrite what is currently live. Wait for explicit approval.
2. Build the archive: source only, excluding `node_modules/`, build output, `.git/`, and `.env`. Keep it under 50 MB.
3. Deploy:
   - **Default** — `hosting_deployJsApplication` with `domain` and `archivePath`. Hostinger auto-detects build settings and resolves the username.
   - **Needs overrides** — `hosting_createNodeJSBuildFromArchiveV1`. This one also needs `username`, from `hosting_listWebsitesV1`.
   - **No build step** — `hosting_deployStaticWebsite`, with the archive named `<directoryname>_YYYYMMDD_HHMMSS.zip`.
4. Track the build: `hosting_listJsDeployments` (or `hosting_listNodeJSBuildsV1`) for state and the build `uuid`.
5. Stream logs while the state is `running` — `hosting_showJsDeploymentLogs` or `hosting_getNodeJSBuildLogsV1`, passing the last line count back as `fromLine` / `from_line`.
6. On success, report the live URL and the build duration. On failure, hand off to `diagnose-build-failure`.

## Optional follow-ups

- `hosting_clearWebsiteCacheV1` if the user is seeing stale content.
- `hosting_restartNode_jsApplicationV1` if the process needs a bounce after a config change.
- `hosting_listNode_jsVulnerabilitiesV1` to audit dependencies post-deploy.
- `DNS_getDNSRecordsV1` to confirm the domain actually points at Hostinger before promising the user a working URL.

## Failure handling

- Surface Hostinger API errors verbatim — do not fabricate causes.
- If authentication fails, the MCP server opens a browser sign-in on the next tool call. Only if the user needs a non-interactive setup should they generate an API token in hPanel (**Profile & settings → API Tokens**) and export `HOSTINGER_API_TOKEN` before launching Cursor.

## Do not

- Do not include `.env`, credentials, or tokens in the archive.
- Do not deploy to a production domain without explicit confirmation.
- Do not promise to set application environment variables — the API cannot. Direct the user to hPanel.
