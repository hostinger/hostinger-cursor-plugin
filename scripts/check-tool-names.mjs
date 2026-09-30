#!/usr/bin/env node
/**
 * Assert that every Hostinger MCP tool named in this plugin's rules, skills,
 * agents, commands, and README actually exists.
 *
 * This exists because the plugin originally shipped guidance built entirely on
 * invented tool names (`list_hosting_plans`, `create_dns_snapshot`,
 * `query_logs`, ...). The agent would then hunt for tools the server has never
 * exposed. Checking only known prefixes would not have caught that, since the
 * invented names had no prefix at all — so this default-denies: any backticked
 * snake_case-looking identifier must either resolve to a real tool or be listed
 * in NON_TOOL_IDENTIFIERS below.
 *
 * Catalog source: scripts/mcp-tools.json (regenerate with sync-mcp-tools.mjs).
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(path.join(repoRoot, "scripts", "mcp-tools.json"), "utf8"));

const knownTools = new Set(Object.values(catalog.groups).flat());

/**
 * Identifiers that look like tool names but aren't: API request/response fields,
 * npm and filesystem names, WordPress internals, shell and code fragments.
 * Additions here should be things a reader could otherwise mistake for a tool.
 */
const NON_TOOL_IDENTIFIERS = new Set([
  // Deployment / build request fields
  "app_type",
  "build_script",
  "entry_file",
  "from_line",
  "node_version",
  "output_directory",
  "package_manager",
  "root_directory",
  "public_html",
  // Pagination and filter fields
  "is_enabled",
  "order_id",
  "per_page",
  "snapshot_id",
  "website_type",
  // package.json / npm / filesystem
  "create-react-app",
  "engines.node",
  "legacy-peer-deps",
  "node_modules",
  "package.json",
  "package-lock.json",
  // Env vars and code fragments
  "HOSTINGER_API_TOKEN",
  "API_TOKEN",
  "USER_AGENT",
  "process.env.PORT",
  "max_execution_time",
  "memory_limit",
  // WordPress internals
  "wp-config.php",
  "wp_options",
  "wp-admin",
  "siteurl",
]);

/** Ignore fenced code blocks: JSON examples and shell snippets aren't guidance. */
function stripFencedBlocks(text) {
  return text.replace(/^```[\s\S]*?^```/gm, (block) => block.replace(/[^\n]/g, " "));
}

/**
 * A backticked token is "tool-shaped" if it could plausibly be read as an MCP
 * tool name: a bare identifier containing an underscore, no whitespace, and no
 * path or call syntax.
 */
function isToolShaped(token) {
  if (!token.includes("_")) return false;
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(token)) return false;
  // A trailing underscore is a prefix reference (`hosting_`, `DNS_`), not a name.
  if (token.endsWith("_")) return false;
  return true;
}

function walk(target) {
  const found = [];
  const stack = [target];
  while (stack.length > 0) {
    const current = stack.pop();
    let info;
    try {
      info = statSync(current);
    } catch {
      continue;
    }
    if (info.isDirectory()) {
      for (const entry of readdirSync(current)) stack.push(path.join(current, entry));
    } else if (/\.(md|mdc|markdown)$/i.test(current)) {
      found.push(current);
    }
  }
  return found;
}

// Everything the agent reads as instructions, plus the user-facing README.
// CHANGELOG.md is deliberately out of scope: it has to name the tools that were
// wrong in order to describe having fixed them.
const targets = ["rules", "skills", "agents", "commands", "README.md"].flatMap((t) =>
  walk(path.join(repoRoot, t)),
);

const problems = [];
const seen = new Set();
const groupPrefix = new RegExp(`^(?:${Object.keys(catalog.groups).join("|")})_`);
const syncedSkillsDir = `skills${path.sep}`;

for (const file of targets) {
  const relative = path.relative(repoRoot, file);
  const synced = relative.startsWith(syncedSkillsDir);
  const lines = stripFencedBlocks(readFileSync(file, "utf8")).split("\n");

  lines.forEach((line, index) => {
    for (const [, token] of line.matchAll(/`([^`\n]+)`/g)) {
      if (!isToolShaped(token)) continue;
      if (synced && !groupPrefix.test(token)) continue;
      if (NON_TOOL_IDENTIFIERS.has(token)) continue;
      if (knownTools.has(token)) {
        seen.add(token);
        continue;
      }
      problems.push({ file: relative, line: index + 1, token });
    }
  });
}

// The mcp.json binaries must map onto real tool groups, otherwise a server
// starts with zero tools and nothing obviously fails.
const mcpConfig = JSON.parse(readFileSync(path.join(repoRoot, "mcp.json"), "utf8"));
const manifest = JSON.parse(
  readFileSync(path.join(repoRoot, ".cursor-plugin", "plugin.json"), "utf8"),
);
const binaryProblems = [];

for (const [key, server] of Object.entries(mcpConfig.mcpServers ?? {})) {
  const binary = (server.args ?? []).at(-1);
  const group = String(binary).replace(/^hostinger-/, "").replace(/-mcp$/, "");
  if (!Object.hasOwn(catalog.groups, group)) {
    binaryProblems.push(`${key}: "${binary}" does not map to a tool group in the catalog`);
  }

  // USER_AGENT carries the plugin version for Hostinger-side attribution, so a
  // version bump that misses mcp.json would silently report the old one.
  const expectedUserAgent = `plugin;cursor;${manifest.version}`;
  const actualUserAgent = server.env?.USER_AGENT;
  if (actualUserAgent !== expectedUserAgent) {
    binaryProblems.push(
      `${key}: USER_AGENT is "${actualUserAgent}", expected "${expectedUserAgent}" to match plugin.json`,
    );
  }
}

if (problems.length > 0 || binaryProblems.length > 0) {
  console.error(`Check failed against ${catalog.package}@${catalog.version}.\n`);

  for (const { file, line, token } of problems) {
    console.error(`  ${file}:${line}  unknown tool \`${token}\``);
  }
  for (const message of binaryProblems) {
    console.error(`  mcp.json  ${message}`);
  }

  if (problems.length > 0) {
    console.error(
      [
        "",
        "Every backticked identifier that reads like an MCP tool must exist in",
        "scripts/mcp-tools.json. If the catalog is stale, regenerate it:",
        "",
        "  node scripts/sync-mcp-tools.mjs",
        "",
        "If the identifier is a request field or some other non-tool name, add it",
        "to NON_TOOL_IDENTIFIERS in scripts/check-tool-names.mjs.",
      ].join("\n"),
    );
  }

  process.exit(1);
}

console.log(
  `Tool-name check passed: ${seen.size} distinct tools referenced, all present in ${catalog.package}@${catalog.version}.`,
);
console.log(
  `MCP binary check passed: ${Object.keys(mcpConfig.mcpServers ?? {}).length} servers map to real tool groups.`,
);
