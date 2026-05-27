---
name: deploy-nodejs-app
description: Guide the agent through deploying a Node.js project to Hostinger Managed Node.js Hosting. Use when the user asks to deploy, publish, or push a Node.js app to Hostinger.
when-to-use: User mentions deploying a Node.js / SvelteKit / Hono / Remix / Fastify / Astro / Next.js app to Hostinger, or asks how to put a Node project live on a Hostinger domain.
---

# Deploy a Node.js app to Hostinger

## When to use

- User says "deploy this to Hostinger", "ship this Node app", or names a framework (SvelteKit, Hono, Remix, Fastify, Astro, Next.js).
- User wants to redeploy a project that already lives on Hostinger Managed Node.js Hosting.

## Inputs to gather first

1. Which Hostinger account / Node.js hosting plan to use (call the MCP `list_hosting_plans` tool if ambiguous).
2. The target domain or subdomain.
3. Framework / preset — SvelteKit, Hono, Remix, Fastify, Astro, Next.js, or "generic Node".
4. Node.js version (default to the LTS supported by the chosen plan).
5. Entry point / start command (`npm start`, `node server.js`, etc.).
6. Required environment variables (read from a `.env` file if present, but never commit it).
7. Source: local directory, Git repository, or zip bundle.

## Steps

1. Confirm the inputs above with the user before any write operation.
2. Detect the framework from `package.json` and dependency list when the user hasn't specified one. Match to a Hostinger framework preset.
3. Call the Hostinger MCP `hostinger` server:
   - `list_hosting_plans` → pick the Node-capable plan.
   - `check_domain_status` → verify the domain is connected and DNS is healthy.
   - `create_nodejs_deployment` (or update if one exists) → submit the source, framework preset, Node version, and env vars.
4. Poll deployment status / stream build logs and surface failures back to the user.
5. After success, return the public URL, the build duration, and any post-deploy follow-ups (cache purge, SSL provisioning status).

## Failure handling

- Surface raw Hostinger API errors verbatim — do not fabricate causes.
- If the build fails, hand off to the `diagnose-build-failure` skill.
- If the token is missing or unauthorized, instruct the user to generate a token at hpanel.hostinger.com → Profile & settings → API Tokens, then set `HOSTINGER_API_TOKEN` and restart Cursor.

## Do not

- Do not commit `.env`, credentials, or tokens to the source bundle.
- Do not auto-deploy to a production domain without explicit confirmation.
- Do not change the framework preset between deploys without telling the user — it can reset build caches.
