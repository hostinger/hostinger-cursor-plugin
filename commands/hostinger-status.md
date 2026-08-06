---
name: hostinger-status
description: Print a one-screen summary of the user's Hostinger account — websites, recent deployments, domains, VPS power state, and any subscriptions expiring soon.
---

# /hostinger-status

Run a fast, read-only snapshot of the user's Hostinger account.

## Steps

1. Call these tools in parallel where possible:
   - `hosting_listWebsitesV1` → domain, username, enabled state.
   - `hosting_listJsDeployments` per domain that has deployments → state (`pending`, `running`, `completed`, `failed`) and timestamp. Skip domains with none rather than erroring.
   - `domains_getDomainListV1` → registered domains and expiry.
   - `VPS_getVirtualMachinesV1` → hostname and power state.
   - `billing_getSubscriptionListV1` → next renewal date and auto-renewal flag.
2. Render as compact sections — do not paginate.
3. Flag anything that needs attention with `[!]`: a failed deployment, a disabled website, a stopped VPS, or a subscription renewing within 30 days without auto-renewal.

If a server isn't enabled in the user's Cursor MCP settings, its section will error. Note the section as unavailable and carry on — don't abort the whole snapshot.

## Output format

```
Websites (N)
- example.com — enabled
- shop.example — disabled [!]

Recent deployments
- example.com — completed, 2h ago
- api.example — failed, 6h ago [!]

Domains (N)
- example.com — expires 2027-03-14
- shop.example — expires 2026-09-02

VPS (N)
- srv-1 — running
- srv-2 — stopped [!]

Subscriptions
- Premium hosting — renews 2027-01-01 (auto)
- Domain example.com — renews 2026-08-15 (manual) [!]
```

## Do not

- Do not perform any write operations from this command.
- Do not dump raw API responses — summarize.
- Do not invent a section for data the enabled servers didn't return.
