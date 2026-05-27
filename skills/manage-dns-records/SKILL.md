---
name: manage-dns-records
description: Read, create, update, and delete DNS records on a Hostinger-managed domain via the Hostinger MCP server. Use for any DNS change, lookup, or troubleshooting.
when-to-use: User wants to add/update/delete an A, AAAA, CNAME, MX, TXT, NS, or SRV record on a Hostinger domain; or asks "what are my DNS records for X?".
---

# Manage Hostinger DNS records

## When to use

- "Point example.com at this server / IP."
- "Add a TXT record for SPF / DKIM / domain verification."
- "Remove the old MX records and set up Google Workspace."
- "Why isn't my DNS resolving?"

## Inputs to gather first

1. Domain (must be on Hostinger — confirm with `list_domains` if uncertain).
2. Record type (A, AAAA, CNAME, MX, TXT, NS, SRV).
3. Name / subdomain (e.g. `@`, `www`, `mail`).
4. Value(s) and TTL.
5. For MX: priority. For SRV: priority, weight, port, target.

## Steps

1. Read current state first: call `list_dns_records` for the domain.
2. **Snapshot before changing.** Call `create_dns_snapshot` so the change is reversible.
3. Show the user the exact set of records that will be created / changed / deleted (diff format).
4. Wait for explicit confirmation.
5. Apply the change via `create_dns_record`, `update_dns_record`, or `delete_dns_record`.
6. Re-read the records and confirm the resulting state.

## Validation

- Reject syntactically invalid records before calling the API:
  - A → IPv4 only.
  - AAAA → IPv6 only.
  - CNAME → cannot coexist with other records on the same name.
  - MX → must reference a hostname, not an IP.
  - TXT → quote-escape inner double quotes.
- Warn if TTL is below 300s (propagation thrash) or above 86400s (slow recovery).

## Confirm before

- Deleting any record (always).
- Replacing all MX records (mail delivery risk).
- Changing NS records (delegation change — can break the domain).
- Changing the A/AAAA record of the apex (`@`) — site downtime risk.

## Recovery

If a change goes wrong, call `restore_dns_snapshot` with the snapshot ID from step 2.

## Do not

- Do not delete or mutate records without showing the user the diff first.
- Do not infer the intended record type — ask if ambiguous.
