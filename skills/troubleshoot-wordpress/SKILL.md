---
name: troubleshoot-wordpress
description: Diagnose common Hostinger WordPress issues — PHP version mismatches, error logs, plugin/theme conflicts, white screen of death, slow admin, broken updates.
when-to-use: User reports their Hostinger-hosted WordPress site is broken, slow, throwing errors, or behaving unexpectedly after a change.
---

# Troubleshoot a Hostinger WordPress site

## When to use

- "My WordPress site is down / blank / showing a 500."
- "Admin is really slow."
- "I updated a plugin and now nothing works."
- "How do I see WP error logs?"

## Inputs to gather first

1. Domain.
2. Symptom: front-end blank, 500 error, 502/504, admin slow, login loop, white screen, broken updates, etc.
3. What changed recently (plugin install/update, theme switch, PHP version bump, manual file edit).

## Steps

1. Call the Hostinger MCP `hostinger` server:
   - `get_wordpress_site` for the domain → installed version, active theme, PHP version, plan tier.
   - `list_wordpress_plugins` → installed plugins + versions + active status.
   - `get_php_error_log` → last error log entries.
   - `get_php_settings` → PHP version, memory limit, max_execution_time.

2. Map the symptom to the most likely cause from the table below.

3. Propose **one** fix at a time, confirm with the user, then apply.

## Common issues

| Symptom | Likely cause | First check / fix |
|---|---|---|
| Blank front-end ("white screen of death") | Fatal PHP error, often after plugin update | Read `get_php_error_log` for the latest fatal. Disable the suspect plugin via `disable_wordpress_plugin`. |
| 500 error site-wide | `.htaccess` corruption or PHP fatal | Check error log. Regenerate permalinks. |
| Admin extremely slow | Slow plugin (e.g. analytics, security scan), low memory limit | Bulk-disable non-essential plugins; raise PHP memory_limit. |
| Login loop / can't log in | Cookies / `wp_options` `siteurl` mismatch, plugin conflict | Verify `siteurl` and `home` match the actual domain. Disable all plugins. |
| "PHP version" warning | Plugin requires newer PHP than the site runs | Bump PHP via `update_php_version` after confirming compatibility. |
| Auto-update fails | File permission, plan limit, conflicting plugin | Check error log; trigger manual update via `update_wordpress`. |
| Mixed content / SSL warnings | `siteurl` is `http://` while site is `https://` | Update `siteurl`/`home` to `https://`. |
| Site hacked / spam pages | Compromised plugin or stolen admin creds | Restore from `list_backups` → `restore_backup`. Rotate admin password. |

## Destructive operations — confirm before

- `restore_backup` (overwrites current site).
- `disable_wordpress_plugin` on production (could break a customer-facing feature).
- `update_php_version` (can break themes/plugins that don't support the new version).

## Do not

- Do not guess at fixes without inspecting the error log.
- Do not edit `wp-config.php` or `.htaccess` directly when a Hostinger MCP tool covers the same change.
