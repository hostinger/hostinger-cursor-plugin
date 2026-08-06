---
name: troubleshoot-wordpress
description: Diagnose common Hostinger WordPress issues — PHP version and extension mismatches, plugin/theme conflicts, white screen of death, slow admin, stale cache, failed core updates.
when-to-use: User reports their Hostinger-hosted WordPress site is broken, slow, throwing errors, or behaving unexpectedly after a change.
---

# Troubleshoot a Hostinger WordPress site

## When to use

- "My WordPress site is down / blank / showing a 500."
- "Admin is really slow."
- "I updated a plugin and now nothing works."
- "My changes aren't showing up."

## What the API can and can't see

The WordPress and hosting MCP servers expose installations, plugins, themes, core version, caches, maintenance mode, and PHP configuration. They do **not** expose PHP error logs or shared-hosting backups. When the diagnosis genuinely needs an error log or a restore, say so and point the user to hPanel rather than calling a tool that doesn't exist.

## Inputs to gather first

1. Domain.
2. Symptom: blank front-end, 500, 502/504, slow admin, login loop, stale content, failed update.
3. What changed recently — plugin install or update, theme switch, PHP version bump, core update.

## Steps

1. Establish the baseline:
   - `hosting_listWordPressInstallationsV1` → which installations exist on the account.
   - `hosting_checkIfWordPressInstallationsAreValidV1` → whether Hostinger considers the install healthy. Run `hosting_detectWordPressInstallationsV1` first if the site isn't listed.
   - `hosting_showWordPressCoreVersionV1` and `hosting_listAvailableWordPressCoreUpdatesV1` → core version and pending updates.
   - `hosting_listInstalledWordPressPluginsV1` and `hosting_listInstalledWordPressThemesV1` → versions and active state.
   - `hosting_getPHPDetailsV1` (and `hosting_getPHPInfoV1` for the full dump) → PHP version, extensions, limits.
2. Map the symptom using the table below.
3. Propose **one** fix at a time, confirm, then apply.

## Common issues

| Symptom | Likely cause | First check / fix |
|---|---|---|
| Blank front-end ("white screen of death") | Fatal PHP error, usually from a plugin or theme update | Compare `hosting_listInstalledWordPressPluginsV1` against what the user just changed, then `hosting_deactivateWordPressPluginV1` on the suspect. The fatal itself is only visible in the hPanel error log. |
| 500 site-wide | PHP fatal, or a PHP version/extension mismatch | `hosting_getPHPDetailsV1` to confirm the version and loaded extensions; `hosting_updatePHPExtensionsV1` if something required is missing |
| Admin extremely slow | Heavy plugin, or a low PHP memory limit / execution time | `hosting_updatePHPOptionsV1` to raise the limits; deactivate non-essential plugins one at a time |
| "Requires PHP x.y" warning | Plugin needs a newer PHP than the site runs | Confirm theme and plugin compatibility, then `hosting_updatePHPVersionV1` |
| Changes not appearing | LiteSpeed or website cache serving stale content | `hosting_showLiteSpeedCacheStatusV1`, then `hosting_purgeLiteSpeedCacheV1`; also `hosting_clearWebsiteCacheV1`, and `hosting_toggleCachelessModeV1` while actively debugging |
| Object cache errors after a plugin change | Memcached object cache out of sync | `hosting_showMemcachedObjectCacheStatusV1`, then `hosting_toggleMemcachedObjectCacheV1` |
| Site stuck showing "briefly unavailable" | Maintenance mode left on | `hosting_showMaintenanceStatusV1`, then `hosting_toggleMaintenanceModeV1` |
| Core auto-update failed | Version conflict or a blocking plugin | `hosting_listAvailableWordPressCoreUpdatesV1`, then `hosting_updateWordPressCoreV1` |
| Can't reach wp-admin to verify a fix | Lost or broken admin session | `hosting_createLoginLinksV1` for a one-time admin login link |
| Broken checkout on a shop | WooCommerce missing or inactive | `hosting_checkIfWooCommerceIsInstalledV1` |
| Hostinger plugin features misbehaving | Outdated Hostinger plugin | `hosting_updateHostingerWordPressPluginV1` |

## Isolating a plugin conflict

Deactivate one plugin at a time with `hosting_deactivateWordPressPluginV1`, re-test, and reactivate with `hosting_activateWordPressPluginV1` before moving to the next. Say which plugin you're about to disable and what user-facing feature might break. Do not bulk-deactivate a production site without explicit approval.

## Confirm before

- `hosting_deleteWordPressInstallationV1` — destroys the site.
- `hosting_uninstallWordPressPluginsV1`, `hosting_uninstallWordPressThemesV1` — may drop plugin data.
- `hosting_updateWordPressCoreV1`, `hosting_updateWordPressPluginsV1`, `hosting_updateWordPressThemesV1` — can introduce new breakage.
- `hosting_updatePHPVersionV1` — can break themes and plugins that don't support the new version.
- `hosting_toggleMaintenanceModeV1` on production — takes the site offline for visitors.

## Do not

- Do not claim to have read an error log. Direct the user to hPanel for PHP error logs.
- Do not offer to restore a backup — shared-hosting backups aren't exposed by the API.
- Do not edit `wp-config.php` or `.htaccess` directly when a Hostinger MCP tool covers the same change.
