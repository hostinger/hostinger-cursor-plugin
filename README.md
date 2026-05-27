# Hostinger Connector for Cursor

Official Cursor plugin for [Hostinger](https://hostinger.com/) — deploy and manage Hostinger hosting, Node.js apps, deployments, and DNS without leaving Cursor.

This plugin wires the official `hostinger-api-mcp` server, plus a set of skills and rules, into Cursor so the agent can take real actions on your Hostinger account.

---

## What it does

- Deploy Node.js, SvelteKit, Hono, Remix, Fastify, Astro, and Next.js apps to Hostinger Managed Node.js Hosting.
- Diagnose failed builds from real Hostinger build logs.
- Read and write DNS records on Hostinger-managed domains.
- Troubleshoot Hostinger-hosted WordPress sites (logs, plugins, PHP version).
- Query hosting, access, and runtime logs for a domain.
- Inspect VPS state, billing, and subscriptions.

Backed by 100+ MCP tools spanning hosting, domains, DNS, VPS, and billing.

---

## Install

### One-click (Cursor Marketplace)

[Install Hostinger Connector in Cursor](cursor://anysphere.cursor-deeplink/plugin/install?repo=hostinger/hostinger-cursor-plugin)

### From a `/add-plugin` URL

In Cursor chat, run:

```
/add-plugin https://github.com/hostinger/hostinger-cursor-plugin
```

---

## Auth setup

The plugin uses the published [`hostinger-api-mcp`](https://www.npmjs.com/package/hostinger-api-mcp) server. Authentication is via a Hostinger API token:

1. Log in to [hpanel.hostinger.com](https://hpanel.hostinger.com) → **Profile & settings** → **API Tokens** → **Generate new token**.
2. Set the token in your shell environment before launching Cursor:

   ```bash
   export HOSTINGER_API_TOKEN=hst_xxx...
   ```

3. Restart Cursor so the new process inherits the variable.

Never commit a token to source — the plugin ships a pre-commit hook that blocks obvious leaks.

> The `hostinger-api-mcp` CLI exposes `--login` / `--logout` flags for a future OAuth flow, but OAuth is **not currently supported** by the Hostinger backend. Use the API-token path until that ships.

---

## Available skills

| Skill | What it does |
|---|---|
| [`deploy-nodejs-app`](skills/deploy-nodejs-app/SKILL.md) | Guide a Node.js deploy end-to-end with the right framework preset. |
| [`diagnose-build-failure`](skills/diagnose-build-failure/SKILL.md) | Pull build logs, identify the failure mode, propose a fix. |
| [`manage-dns-records`](skills/manage-dns-records/SKILL.md) | Read, create, update, delete DNS records — with snapshot + diff. |
| [`troubleshoot-wordpress`](skills/troubleshoot-wordpress/SKILL.md) | Diagnose WP issues: PHP version, error logs, plugin/theme conflicts. |
| [`query-hosting-logs`](skills/query-hosting-logs/SKILL.md) | Pull and summarize access / error / runtime logs for a domain. |

---

## Available MCP tools

The `hostinger` MCP server exposes 100+ tools across these areas:

- **Hosting** — list plans, deploy Node.js / static / WordPress, retrieve build and runtime logs, manage SSH keys.
- **Domains** — search, register, transfer, lock/unlock, forwarding, WHOIS, verification.
- **DNS** — list/create/update/delete records, snapshots, restore, validation.
- **VPS** — list, power state, firewalls, OS reinstall, SSH keys, metrics, action history.
- **Billing** — subscriptions, auto-renewal, payment methods, catalog, orders.
- **WordPress** — list/install/update/disable plugins, themes, PHP settings, backups.

For the complete tool catalog, see [hostinger/api-mcp-server](https://github.com/hostinger/api-mcp-server).

---

## Rules (always-on guidance)

- [`prefer-mcp-tools`](rules/prefer-mcp-tools.mdc) — use MCP tools instead of `curl` / `ssh` / one-off scripts.
- [`confirm-destructive-actions`](rules/confirm-destructive-actions.mdc) — require explicit confirmation for deletes, restores, redeploys.
- [`framework-presets`](rules/framework-presets.mdc) — pick the right Hostinger framework preset for Node.js deploys.

## Agents

- [`hostinger-deployment-reviewer`](agents/hostinger-deployment-reviewer.md) — pre-flight checklist for a planned deployment.

## Commands

- [`/hostinger-status`](commands/hostinger-status.md) — one-screen snapshot of plans, deployments, VPS, subscriptions.

---

## Validate

```bash
node scripts/validate-template.mjs
```

---

## Links

- Hostinger Connector on Open VSX: https://open-vsx.org/extension/hostinger/hostinger-connector
- MCP server source: https://github.com/hostinger/api-mcp-server
- Hostinger API docs: https://developers.hostinger.com
- Hostinger: https://hostinger.com/

## License

MIT — see [`hostinger-api-mcp`](https://www.npmjs.com/package/hostinger-api-mcp).
