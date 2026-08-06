# Changelog

## [0.2.0] - 2026-08-06

Brings the plugin back in line with `hostinger-api-mcp` (now 1.29.0) and with the product surface of the Hostinger VS Code extension (1.3.2). The plugin was last touched on 2026-05-27, two days before OAuth shipped.

### Fixed

- **Every Hostinger tool name in the rules, skills, agent, and command was invented.** The plugin instructed the agent to call `list_hosting_plans`, `create_nodejs_deployment`, `list_dns_records`, `create_dns_snapshot`, `query_logs`, `restore_backup`, and others — none of which the MCP server has ever exposed. All 104 tool references now use the real OpenAPI operation IDs (`hosting_listWebsitesV1`, `DNS_getDNSRecordsV1`, `billing_getSubscriptionListV1`, …) and are verified in CI.
- **The token-leak hook never ran.** `hooks/hooks.json` used a `pre-commit` trigger, which is not a Cursor hook event, along with an array shape and a `script` key that Cursor's v1 schema doesn't read. It is now a `beforeShellExecution` hook matching `git commit`, and the script speaks the hook JSON protocol on stdin/stdout. It fails open, so a guard that can't read the staged diff won't block every commit.
- **The deployment guidance described an API that doesn't exist.** There is no framework "preset" parameter. `rules/framework-presets.mdc` invented seven preset names; the real `app_type` override accepts only `create-react-app`, `vite`, `angular`, `react`, `vue`, `parcel`, `express`, `fastify`, and `nest`, with everything else auto-detected from `package.json`. Replaced by `rules/nodejs-deployments.mdc`, documenting the real tools and the accepted `node_version`, `package_manager`, `root_directory`, `output_directory`, `build_script`, and `entry_file` overrides.
- **DNS guidance assumed per-record operations.** Hostinger's DNS API is zone-oriented: `DNS_updateDNSRecordsV1` takes a whole zone array plus an `overwrite` flag, and there is no tool to create a snapshot on demand. The skill now explains the `overwrite` semantics, uses `DNS_validateDNSRecordsV1` as a dry run, and cites an existing snapshot ID for rollback instead of promising a fresh backup.
- **`query-hosting-logs` promised access and error logs the API does not expose.** Renamed to `query-deployment-logs` and scoped to what exists: JS deployment logs, Node.js build logs, and cron output. The plugin now states plainly that HTTP access logs, PHP error logs, Node.js environment variables, and shared-hosting backups are hPanel-only.
- `repository.url` in `plugin.json` pointed at `hostinger/api-mcp-server` instead of this repository.
- Added the `LICENSE` file that `plugin.json` has always declared.

### Changed

- **One MCP server per product area instead of a single monolith.** `mcp.json` previously started `hostinger-api-mcp`, loading all 289 tools into context at once. It now registers eight servers — hosting, wordpress, domains, dns, billing, reach, ecommerce, vps — mirroring the VS Code extension's groups, so users can disable areas they don't use from Cursor's MCP settings.
- **OAuth is the default auth path.** The README claimed OAuth was "not currently supported by the Hostinger backend"; it shipped in the MCP server and in extension 1.1.0 on 2026-05-29. The server now signs in through the browser on the first authenticated tool call, and `mcp.json` no longer hardcodes `HOSTINGER_API_TOKEN` — the fragile `${HOSTINGER_API_TOKEN}` interpolation would have shadowed the OAuth fallback. An exported token still takes precedence.
- **Product naming matches the extension.** "Web Hosting" → Websites, "Reach" → Email Marketing, "Billing" → Subscriptions & Payments, and DNS is documented alongside Domains.
- The README now documents the overlap with the VS Code extension, which writes these same servers into `~/.cursor/mcp.json` — running both in Cursor duplicates every server.

### Added

- `USER_AGENT` on every MCP server (`plugin;cursor;<version>`), matching the extension's attribution so plugin traffic is no longer invisible to Hostinger.
- `scripts/check-tool-names.mjs` — asserts every tool-shaped identifier in the docs resolves to a real tool. It default-denies unknown snake_case identifiers rather than checking known prefixes, because the original fabricated names had no prefix at all and a prefix check would have missed them entirely.
- `scripts/sync-mcp-tools.mjs` and `scripts/mcp-tools.json` — a checked-in snapshot of the published tool catalog (289 tools, 11 groups) so the check runs offline.
- `.github/workflows/ci.yml` — runs both validators, parses every JSON file, shellchecks the hook, and confirms it's executable. A second advisory job flags when the catalog snapshot falls behind `hostinger-api-mcp@latest`.

## [0.1.0] - 2026-05-27

### Initial release

- Hostinger MCP server wiring, five skills, three rules, one agent, one command.
