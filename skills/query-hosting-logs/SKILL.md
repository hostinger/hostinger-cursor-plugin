---
name: query-hosting-logs
description: Pull runtime, access, and error logs for a domain on Hostinger and summarize what's happening. Use to investigate traffic spikes, 4xx/5xx bursts, slow requests, or runtime errors.
when-to-use: User asks to "see the logs", investigates a traffic anomaly, debugs a runtime issue, or wants to know why requests are failing.
---

# Query Hostinger hosting logs

## When to use

- "Show me the access log for example.com."
- "Why am I getting 500s?"
- "Did anything spike traffic last night?"
- "Are there errors in my Node.js app?"

## Inputs to gather first

1. Domain.
2. Log type: `access`, `error`, `runtime` (Node.js / app stdout), `build`.
3. Time range (default to last 1 hour if user doesn't specify).
4. Optional filters: status code (e.g. 5xx), path prefix, IP, request method.

## Steps

1. Call the Hostinger MCP `hostinger` server:
   - `list_log_streams` for the domain → confirm which log types are available for the plan.
   - `query_logs` with `{ domain, type, since, until, filter }`.
2. Summarize the result — do **not** dump 10k log lines into chat. Limit to:
   - Top 5 status codes with counts.
   - Top 5 endpoints by request volume.
   - Top 5 error messages (for error/runtime logs).
   - Up to 20 most recent lines verbatim.
3. Offer drill-down: "Want me to filter by 5xx?", "Want the full raw output for path X?".

## Anomaly checks to run automatically

- Spike: compare request count vs the previous matching window — flag a >3× jump.
- Error rate: flag if 5xx > 1% of total requests.
- New user agent: flag a single UA suddenly responsible for >20% of traffic (potential bot/scraper).
- Slow requests: flag the p95 response time if >2s.

## Privacy

- Strip or redact IPs in summary output unless the user explicitly asks for them.
- Never paste session cookies or `Authorization` headers from logs into chat.

## Do not

- Do not dump raw logs without summarization.
- Do not infer a cause from a single log line — corroborate with at least one other signal.
