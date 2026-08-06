---
name: manage-dns-records
description: Read, update, and delete DNS zone records on a Hostinger-managed domain via the Hostinger DNS MCP server. Use for any DNS change, lookup, or troubleshooting.
when-to-use: User wants to add/update/delete an A, AAAA, CNAME, ALIAS, MX, TXT, NS, SRV, or CAA record on a Hostinger domain; or asks "what are my DNS records for X?".
---

# Manage Hostinger DNS records

## When to use

- "Point example.com at this server / IP."
- "Add a TXT record for SPF / DKIM / domain verification."
- "Remove the old MX records and set up Google Workspace."
- "Why isn't my DNS resolving?"

## The zone model matters

Hostinger's DNS API is **zone-oriented, not record-oriented**. There is no `create record` or `update record` tool. `DNS_updateDNSRecordsV1` takes a `zone` array where each entry groups all records sharing one name and type:

```json
{
  "domain": "example.com",
  "overwrite": true,
  "zone": [
    { "name": "@",   "type": "A",   "ttl": 300, "records": [{ "content": "192.0.2.10" }] },
    { "name": "www", "type": "CNAME", "ttl": 300, "records": [{ "content": "example.com" }] }
  ]
}
```

`name`, `type`, and `records` are required per entry; `ttl` is optional. Use `@` for the apex.

The `overwrite` flag is the critical decision:

- **`overwrite: true`** — every existing record matching that name+type is deleted and replaced by exactly what you send. Use this when you want the listed records to be the complete set (e.g. replacing all MX records).
- **`overwrite: false`** (or omitted) — TTLs are updated and your records are *appended* alongside the existing ones. Use this when adding a record without touching siblings (e.g. adding one more TXT verification record).

Getting this backwards either silently duplicates records or silently deletes the ones you meant to keep. State which mode you're using, and why, in your confirmation message.

Valid `type` values: `A`, `AAAA`, `CNAME`, `ALIAS`, `MX`, `TXT`, `NS`, `SOA`, `SRV`, `CAA`.

## Steps

1. **Read current state** — `DNS_getDNSRecordsV1` for the domain.
2. **Note the rollback point** — `DNS_getDNSSnapshotListV1` and record the most recent snapshot ID. Hostinger creates snapshots automatically; there is no tool to create one on demand, so capture the existing ID rather than promising a fresh backup.
3. **Dry run** — `DNS_validateDNSRecordsV1` with the exact `zone` and `overwrite` values you intend to send. It returns `200` when valid and `422` with details when not. Always do this before mutating.
4. **Show the diff** — list what will be created, changed, and removed, and name the `overwrite` mode.
5. **Wait for explicit confirmation.**
6. **Apply** — `DNS_updateDNSRecordsV1`.
7. **Verify** — re-read with `DNS_getDNSRecordsV1` and confirm the resulting zone. Optionally corroborate with `dig` against public DNS, noting that propagation lags the API.

## Deleting

`DNS_deleteDNSRecordsV1` filters by name and type, and removes *all* records matching each filter. To drop only some of several records sharing a name and type, use `DNS_updateDNSRecordsV1` with `overwrite: true` and the records you want to keep.

`DNS_resetDNSRecordsV1` returns the entire zone to Hostinger defaults. It is not a targeted delete — treat it as a last resort and confirm explicitly.

## Rolling back

`DNS_restoreDNSSnapshotV1` with the domain and a snapshot ID from `DNS_getDNSSnapshotListV1`. Inspect a snapshot's contents first with `DNS_getDNSSnapshotV1` so the user knows what state they're reverting to.

## Validation before calling

- `A` → IPv4 only; `AAAA` → IPv6 only.
- `CNAME` cannot coexist with other record types on the same name, and cannot be used on the apex — use `ALIAS` there.
- `MX` must point at a hostname, never an IP.
- `TXT` → escape inner double quotes.
- Changing apex `A`/`AAAA`, `NS`, or `MX` breaks live traffic or mail. Call these out prominently.

## Do not

- Do not call `DNS_updateDNSRecordsV1` without a preceding `DNS_validateDNSRecordsV1`.
- Do not claim a backup was created — snapshots are automatic, so cite an existing snapshot ID instead.
- Do not use `dig` as the primary read path; it reflects cached data, not the zone.
