---
name: query-deployment-logs
description: Pull and summarize the logs Hostinger's API exposes — Node.js build logs, JS deployment logs, and cron job output — for a domain. Use to investigate a failed or slow build, or a cron job that isn't doing what the user expects.
when-to-use: User asks to "see the logs", investigates why a build or deployment behaved oddly, or wants to know whether a scheduled job ran.
---

# Query Hostinger logs

## What is actually available

Hostinger's API exposes three kinds of log output:

| Log | Tool | Needs |
|---|---|---|
| JS deployment logs | `hosting_showJsDeploymentLogs` | `domain`, `buildUuid`, optional `fromLine` |
| Node.js build logs | `hosting_getNodeJSBuildLogsV1` | `username`, `domain`, `uuid`, optional `from_line` |
| Cron job output | `hosting_getCronJobOutputV1` | cron job identifiers from `hosting_listAccountCronJobsV1` |

**Raw HTTP access logs and PHP error logs are not exposed by the API.** If the user asks for 4xx/5xx breakdowns, traffic spikes, per-request timings, or PHP fatals, tell them directly that these live in hPanel and cannot be fetched here. Do not substitute a plausible-sounding tool name, and do not present build logs as if they were access logs.

## Inputs to gather first

1. Domain.
2. Which log the user actually needs — a build/deployment, or a cron job.
3. For builds: the build `uuid`. Get it from `hosting_listJsDeployments` or `hosting_listNodeJSBuildsV1`, filtering `states` when the user only cares about failures.
4. For `hosting_getNodeJSBuildLogsV1`: the `username`, from `hosting_listWebsitesV1`.

## Steps

1. Resolve the build or cron job identifier first — every log tool requires one.
2. Fetch the log, starting at line `0`.
3. To follow a running build, poll while the state is `running`, passing the previously returned line count as `fromLine` / `from_line` so each call returns only new output.
4. Strip ANSI escape sequences before quoting — build output is colorized.
5. Summarize rather than dumping. Report:
   - The final state and, for a failure, the first error and the last 20 lines verbatim.
   - Which step failed (install, build, start).
   - Total duration, if the timestamps allow it.
6. Offer drill-down: "Want the full log?", "Want me to compare this against the last successful build?".

## Handing off

- A failed build with an identified error signature → `diagnose-build-failure`.
- A cron job producing no output → check the schedule and command with `hosting_listAccountCronJobsV1` before assuming the script is broken.

## Privacy

- Build logs can echo environment values and tokens. Redact anything that looks like a credential before quoting, and never paste a full environment dump into chat.

## Do not

- Do not dump thousands of log lines into the conversation — page through and summarize.
- Do not infer a cause from a single line; corroborate with the surrounding context.
- Do not claim access-log or error-log capability the API doesn't have.
