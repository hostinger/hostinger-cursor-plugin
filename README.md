# Hostinger Connector for Cursor

Official Cursor plugin for [Hostinger](https://hostinger.com/) — deploy and manage Hostinger websites, WordPress, Agency Plan sites, domains, DNS, VPS, and subscriptions without leaving Cursor.

The plugin wires the official [`@hostinger/mcp`](https://www.npmjs.com/package/@hostinger/mcp) servers into Cursor, plus a set of skills, rules, an agent, and a command so the agent can take real actions on your Hostinger account.

---

## What it does

- Troubleshoot a site that is down, slow, erroring or failing to build, and apply the fix.
- Connect a domain end to end — DNS without losing email records, SSL, HTTPS redirect.
- Deploy static sites, Node.js apps, PHP apps and WordPress plugins or themes; set up Git auto-deploy, environment variables and databases.
- Keep WordPress updated and secure across one site or all of them.
- Audit the whole hosting account and get a prioritised to-do list.
- Migrate a site from another host, testing it before DNS moves.
- Manage domains, DNS, VPS, subscriptions, ecommerce and email marketing.

---

## Install

### One-click (Cursor Marketplace)

[Install Hostinger Connector in Cursor](cursor://anysphere.cursor-deeplink/plugin/install?repo=hostinger/hostinger-cursor-plugin)

### From Cursor chat

```
/add-plugin hostinger-cursor-plugin
```

Install from the marketplace rather than from the GitHub URL: an `/add-plugin https://github.com/...` install can stay on the commit it was installed from and miss later updates.

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
npx --package=@hostinger/mcp@latest hostinger-hosting-mcp --login
npx --package=@hostinger/mcp@latest hostinger-hosting-mcp --logout
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

Each product area runs as its own MCP server, so you can disable areas you don't use from Cursor's MCP settings. Every server exposes the same three tools — `search`, `execute` and `multi-execute` — over its own operations.

| Server | Binary | Operations | Covers |
|---|---|---:|---|
| `hostinger-hosting` | `hostinger-hosting-mcp` | 75 | Shared and Cloud websites, Node.js builds and deployments, databases, cron, PHP, SSL, files, Git |
| `hostinger-wordpress` | `hostinger-wordpress-mcp` | 38 | WordPress installations, plugins, themes, core, LiteSpeed cache, maintenance mode |
| `hostinger-agency-hosting` | `hostinger-agency-hosting-mcp` | 42 | Agency Plan websites, deploys, databases, SSL, PHP, metrics |
| `hostinger-domains` | `hostinger-domains-mcp` | 42 | Availability, registration, transfers, locks, forwarding, WHOIS |
| `hostinger-dns` | `hostinger-dns-mcp` | 8 | Zone records, snapshots, validation |
| `hostinger-billing` | `hostinger-billing-mcp` | 9 | Subscriptions, auto-renewal, payment methods, catalog, orders |
| `hostinger-reach` | `hostinger-reach-mcp` | 52 | Contacts, segments, email marketing profiles |
| `hostinger-ecommerce` | `hostinger-ecommerce-mcp` | 29 | Stores, products, sales channels, shipping |
| `hostinger-vps` | `hostinger-vps-mcp` | 64 | Virtual machines, firewalls, snapshots, backups, SSH keys, metrics |

`@hostinger/mcp` also publishes `hostinger-mail-mcp` and `hostinger-horizons-mcp`, which the plugin doesn't wire up.

Operation names follow the API — `hosting_websites_list`, `dns_records_list`, `billing_subscriptions_list` — and the prefix tells you which server owns the operation. For the full catalog, see [`scripts/mcp-tools.json`](scripts/mcp-tools.json) or [hostinger/api-mcp-server](https://github.com/hostinger/api-mcp-server).

### Already using the VS Code extension?

The extension writes these same servers into `~/.cursor/mcp.json` for whichever IDE it detects. If you run both the extension and this plugin in Cursor, you'll get two copies of every server. Pick one: keep the plugin for Cursor, or disconnect the extension from Cursor's config.

---

## What the API can't do

Worth knowing up front, because the agent will tell you rather than inventing a tool:

- **No raw access or PHP error logs.** Build, Node.js runtime and cron output are available; HTTP access logs and PHP error logs live in hPanel only.
- **No website backups.** VPS backups and snapshots are exposed; backups for Shared, Cloud and Agency websites are not.
- **No CPU or memory metrics for Shared and Cloud plans.** Agency Plan orders have them.
- **No on-demand DNS snapshots.** Hostinger creates them automatically. You can list, read, and restore them, but not trigger one.

---

## Available skills

Invoke a skill with `/<name>` in chat, or let the agent pick it from your request.

| Skill | What it does |
|---|---|
| [`troubleshoot-website`](skills/troubleshoot-website/SKILL.md) | One site, one symptom — down, slow, 5xx, SSL warning, failed build — to a named cause and a fix. |
| [`connect-domain`](skills/connect-domain/SKILL.md) | Attach a domain, point DNS at Hostinger without losing `MX`/`TXT` records, install SSL, verify. |
| [`deploy-to-hosting`](skills/deploy-to-hosting/SKILL.md) | Deploy an existing project the right way; Git auto-deploy, environment variables, databases. |
| [`maintain-wordpress`](skills/maintain-wordpress/SKILL.md) | Check core, plugins and themes for updates and vulnerabilities; update safely, site by site. |
| [`audit-hosting`](skills/audit-hosting/SKILL.md) | Read-only review of the whole hosting account with a prioritised to-do list. |
| [`migrate-to-hosting`](skills/migrate-to-hosting/SKILL.md) | Move a site from another host; test the copy before DNS moves. |
| [`hostinger-headless`](skills/hostinger-headless/SKILL.md) | Build a new site from a prompt — hosting, domain, optional store or WordPress backend, deploy. |

The skills come from [hostinger/api-mcp-server](https://github.com/hostinger/api-mcp-server) and are synced into `skills/` by `scripts/sync-skills.mjs` — change them upstream, not here.

## Rules

- [`prefer-mcp-tools`](rules/prefer-mcp-tools.mdc) — use the MCP servers instead of `curl` / `ssh` / one-off scripts, how `search` / `execute` / `multi-execute` work, and which server owns what. Always on.
- [`confirm-destructive-actions`](rules/confirm-destructive-actions.mdc) — require explicit confirmation before any mutating operation. Always on.

## Agents

- [`hostinger-deployment-reviewer`](agents/hostinger-deployment-reviewer.md) — pre-flight checklist for a planned deployment.

## Commands

- [`/hostinger-status`](commands/hostinger-status.md) — one-screen snapshot of websites, builds, domains, VPS, and subscriptions.

---

## Development

```bash
# Validate the plugin manifest and component frontmatter
node scripts/validate-template.mjs

# Assert every MCP operation named in the docs actually exists
node scripts/check-tool-names.mjs

# Refresh the operation catalog after the MCP server ships new operations
node scripts/sync-mcp-tools.mjs

# Refresh skills/ from the latest published server, a version, or a local skills directory
node scripts/sync-skills.mjs
node scripts/sync-skills.mjs 2.5.0
node scripts/sync-skills.mjs ../public-api-generator/mcp/assets/skills
```

`scripts/mcp-tools.json` is a checked-in snapshot of the published server's operation catalog, so `check-tool-names.mjs` runs offline in CI. `skills/` is generated the same way and is replaced wholesale on every sync. The `mcp-sync` workflow (daily, or on demand from the Actions tab) refreshes both from the latest `@hostinger/mcp` release and opens a `chore/mcp-sync` PR.

---

## Links

- MCP server source: https://github.com/hostinger/api-mcp-server
- MCP server on npm: https://www.npmjs.com/package/@hostinger/mcp
- Hostinger VS Code extension: https://open-vsx.org/extension/hostinger/hostinger-connector
- Hostinger API docs: https://developers.hostinger.com
- Hostinger: https://hostinger.com/

## License

MIT — see [`LICENSE`](LICENSE).
