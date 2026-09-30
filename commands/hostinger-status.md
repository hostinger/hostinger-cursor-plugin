---
name: hostinger-status
description: Print a one-screen summary of the user's Hostinger account — websites, recent deployments, domains, VPS power state, and any subscriptions expiring soon.
---

# /hostinger-status

Run a fast, read-only snapshot of the user's Hostinger account. For a deeper web hosting review (SSL, WordPress vulnerabilities, quotas), use the `audit-hosting` skill instead.

## Steps

1. Run one `multi-execute` batch per server, in parallel:
   - `hostinger-hosting`: `hosting_websites_list` → domain, `website_type`, enabled state. Then, for Node.js websites, `hosting_nodejs_list-builds` with `per_page: 1` → latest build state (`pending`, `running`, `completed`, `failed`) and time.
   - `hostinger-agency-hosting`: `agency-hosting_websites_list-plan` → Agency Plan sites and their state.
   - `hostinger-domains`: `domains_portfolio_list` → registered domains and expiry.
   - `hostinger-vps`: `vps_virtual-machines_list` → hostname and power state.
   - `hostinger-billing`: `billing_subscriptions_list` → next renewal date and auto-renewal flag.
2. Render as compact sections — do not paginate.
3. Flag anything that needs attention with `[!]`: a failed build, a disabled website, a stopped VPS, or a subscription renewing within 30 days without auto-renewal.

If a server isn't enabled in the user's Cursor MCP settings, its section will error. Note the section as unavailable and carry on — don't abort the whole snapshot.

## Output format

```
Websites (N)
- example.com — WordPress, enabled
- shop.example — Node.js, disabled [!]

Agency Plan sites (N)
- client-a.com — active

Recent builds
- api.example — failed, 6h ago [!]

Domains (N)
- example.com — expires 2027-03-14

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
