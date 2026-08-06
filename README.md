# Hostinger Connector for Cursor

Official Cursor plugin for [Hostinger](https://hostinger.com/) — deploy and manage Hostinger websites, WordPress, domains, DNS, VPS, and subscriptions without leaving Cursor.

The plugin wires the official [`hostinger-api-mcp`](https://www.npmjs.com/package/hostinger-api-mcp) servers into Cursor, plus a set of skills, rules, an agent, and a command so the agent can take real actions on your Hostinger account.

---

## What it does

- Deploy Node.js and static sites to Hostinger, then follow the server-side build to completion.
- Diagnose failed builds from real Hostinger build logs.
- Read, validate, and update DNS zone records, with snapshot-based rollback.
- Manage Hostinger-hosted WordPress: installations, plugins, themes, core, caches, PHP settings.
- Manage domains — availability, registration, transfers, locks, forwarding, WHOIS.
- Inspect VPS state, firewalls, snapshots, and metrics.
- Review subscriptions, renewals, and payment methods.

---

## Install

### One-click (Cursor Marketplace)

[Install Hostinger Connector in Cursor](cursor://anysphere.cursor-deeplink/plugin/install?repo=hostinger/hostinger-cursor-plugin)

### From an `/add-plugin` URL

In Cursor chat, run:

```
/add-plugin https://github.com/hostinger/hostinger-cursor-plugin
```

### Requirements

Node.js 20 or newer must be on your `PATH`, since the MCP servers run via `npx`. Check with `node --version`.

---

## Auth setup

**No token needed.** On the first tool call that touches your account, the MCP server registers an OAuth 2.0 client, opens your browser to sign in to Hostinger, and stores the credentials locally:

- macOS / Linux: `~/.config/hostinger-mcp/credentials.json` (mode 0600)
- Windows: `%APPDATA%\hostinger-mcp\credentials.json`

Access tokens refresh automatically, and the credentials are shared across every Hostinger MCP server, so you sign in once.

To sign in ahead of time, or to sign out:

```bash
npx --package=hostinger-api-mcp@latest hostinger-hosting-mcp --login
npx --package=hostinger-api-mcp@latest hostinger-hosting-mcp --logout
```

### API token (optional)

For CI, scripting, or shared machines, an API token bypasses OAuth entirely:

1. Log in to [hpanel.hostinger.com](https://hpanel.hostinger.com) → **Profile & settings** → **API Tokens** → **Generate new token**.
2. Export it before launching Cursor, so the editor's child processes inherit it:

   ```bash
   export HOSTINGER_API_TOKEN=hst_xxx...
   ```

3. Restart Cursor.

`HOSTINGER_API_TOKEN` always takes precedence when set — no OAuth code runs. The plugin's `mcp.json` deliberately does **not** hardcode the variable, so the server can fall back to OAuth when it's absent.

Never commit a token. The plugin ships a `beforeShellExecution` hook that inspects the staged diff and blocks a `git commit` carrying what looks like a literal token. The hook fails open: if it can't read the diff, it allows the commit rather than blocking all of your commits.

---

## MCP servers

Each product area runs as its own MCP server. This keeps the tool count per server small instead of loading all 289 tools into context at once, and it lets you disable areas you don't use from Cursor's MCP settings.

| Server | Binary | Tools | Covers |
|---|---|---:|---|
| `hostinger-hosting` | `hostinger-hosting-mcp` | 48 | Websites, Node.js builds and deployments, databases, cron, PHP, subdomains |
| `hostinger-wordpress` | `hostinger-wordpress-mcp` | 35 | WordPress installations, plugins, themes, core, LiteSpeed cache, maintenance mode |
| `hostinger-domains` | `hostinger-domains-mcp` | 36 | Availability, registration, transfers, locks, forwarding, WHOIS |
| `hostinger-dns` | `hostinger-dns-mcp` | 8 | Zone records, snapshots, validation |
| `hostinger-billing` | `hostinger-billing-mcp` | 9 | Subscriptions, auto-renewal, payment methods, catalog, orders |
| `hostinger-reach` | `hostinger-reach-mcp` | 12 | Contacts, segments, email marketing profiles |
| `hostinger-ecommerce` | `hostinger-ecommerce-mcp` | 12 | Stores, products, sales channels, shipping |
| `hostinger-vps` | `hostinger-vps-mcp` | 62 | Virtual machines, firewalls, snapshots, backups, SSH keys, metrics |

These eight mirror the product groups in the [Hostinger VS Code extension](https://open-vsx.org/extension/hostinger/hostinger-connector). `hostinger-api-mcp` also publishes `hostinger-mail-mcp`, `hostinger-agency-hosting-mcp`, and `hostinger-horizons-mcp`, which neither the plugin nor the extension wires up yet.

Tool names are Hostinger's OpenAPI operation IDs — `hosting_listWebsitesV1`, `DNS_getDNSRecordsV1`, `billing_getSubscriptionListV1` — and the prefix tells you which server owns the call. WordPress tools share the `hosting_` prefix despite living on their own server. For the full catalog, see [`scripts/mcp-tools.json`](scripts/mcp-tools.json) or [hostinger/api-mcp-server](https://github.com/hostinger/api-mcp-server).

### Already using the VS Code extension?

The extension writes these same servers into `~/.cursor/mcp.json` for whichever IDE it detects. If you run both the extension and this plugin in Cursor, you'll get two copies of every server and roughly 200 duplicate tools. Pick one: keep the plugin for Cursor, or disconnect the extension from Cursor's config.

---

## What the API can't do

Worth knowing up front, because the agent will tell you rather than inventing a tool:

- **No raw access or PHP error logs.** Build, deployment, and cron logs are available; HTTP access logs and PHP error logs live in hPanel only.
- **No Node.js environment variables.** Set them in hPanel — there is no API for it.
- **No shared-hosting backups.** VPS backups and snapshots are exposed; shared-hosting backups are not.
- **No on-demand DNS snapshots.** Hostinger creates them automatically. You can list, read, and restore them, but not trigger one.

---

## Available skills

| Skill | What it does |
|---|---|
| [`deploy-nodejs-app`](skills/deploy-nodejs-app/SKILL.md) | Pick the right deploy tool, build a clean archive, follow the build to completion. |
| [`diagnose-build-failure`](skills/diagnose-build-failure/SKILL.md) | Pull build logs, match the failure signature, propose a concrete fix. |
| [`manage-dns-records`](skills/manage-dns-records/SKILL.md) | Read, validate, and update zone records; roll back via snapshots. |
| [`troubleshoot-wordpress`](skills/troubleshoot-wordpress/SKILL.md) | Diagnose WP issues: PHP settings, plugin/theme conflicts, caches, maintenance mode. |
| [`query-deployment-logs`](skills/query-deployment-logs/SKILL.md) | Pull and summarize build, deployment, and cron logs. |

## Rules

- [`prefer-mcp-tools`](rules/prefer-mcp-tools.mdc) — use MCP tools instead of `curl` / `ssh` / one-off scripts, and which server owns what. Always on.
- [`confirm-destructive-actions`](rules/confirm-destructive-actions.mdc) — require explicit confirmation before any mutating tool call. Always on.
- [`nodejs-deployments`](rules/nodejs-deployments.mdc) — which deploy tool to use, how to build the archive, and the accepted build override values.

## Agents

- [`hostinger-deployment-reviewer`](agents/hostinger-deployment-reviewer.md) — pre-flight checklist for a planned deployment.

## Commands

- [`/hostinger-status`](commands/hostinger-status.md) — one-screen snapshot of websites, deployments, domains, VPS, and subscriptions.

---

## Development

```bash
# Validate the plugin manifest and component frontmatter
node scripts/validate-template.mjs

# Assert every MCP tool named in the docs actually exists
node scripts/check-tool-names.mjs

# Refresh the tool catalog after the MCP server ships new tools
node scripts/sync-mcp-tools.mjs
```

`scripts/mcp-tools.json` is a checked-in snapshot of the published server's tool catalog, so `check-tool-names.mjs` runs offline in CI. Regenerate and commit it whenever the server adds tools. CI also runs an advisory job that flags when the snapshot has fallen behind `hostinger-api-mcp@latest`.

---

## Links

- MCP server source: https://github.com/hostinger/api-mcp-server
- MCP server on npm: https://www.npmjs.com/package/hostinger-api-mcp
- Hostinger VS Code extension: https://open-vsx.org/extension/hostinger/hostinger-connector
- Hostinger API docs: https://developers.hostinger.com
- Hostinger: https://hostinger.com/

## License

MIT — see [`LICENSE`](LICENSE).
