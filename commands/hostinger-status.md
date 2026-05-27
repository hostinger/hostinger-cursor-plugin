---
name: hostinger-status
description: Print a one-screen summary of the user's Hostinger account — active hosting plans, recent deployments, VPS power state, and any subscriptions expiring soon.
---

# /hostinger-status

Run a fast snapshot of the user's Hostinger account.

## Steps

1. Call the `hostinger` MCP server:
   - `list_hosting_plans` → name, type, status.
   - `list_recent_deployments` (last 5 across all domains) → domain, status, timestamp.
   - `list_vps` → hostname, power state.
   - `list_subscriptions` → next renewal date, auto-renewal flag.
2. Render as four compact sections — do not paginate.

## Output format

```
Hosting (N plans)
- example.com — Premium, active
- shop.example — Business, suspended

Recent deployments (last 5)
- example.com — success, 2h ago
- api.example — failed, 6h ago

VPS (N)
- srv-1 — running
- srv-2 — stopped

Subscriptions
- Premium hosting — renews 2026-07-01 (auto)
- Domain example.com — renews 2026-08-15 (manual) [!]
```

## Do not

- Do not perform any write operations from this command.
- Do not dump raw API responses — summarize.
