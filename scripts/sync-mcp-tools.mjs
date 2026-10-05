#!/usr/bin/env node
/**
 * Regenerate scripts/mcp-tools.json from a published @hostinger/mcp tarball.
 *
 *   node scripts/sync-mcp-tools.mjs            # latest
 *   node scripts/sync-mcp-tools.mjs 1.29.0     # a specific version
 *
 * The catalog is checked in so scripts/check-tool-names.mjs can run offline in
 * CI. Re-run this whenever the MCP server ships new tools, then commit the diff.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const version = process.argv[2] ?? "latest";
const spec = `@hostinger/mcp@${version}`;
const outFile = path.join(import.meta.dirname, "mcp-tools.json");

const work = mkdtempSync(path.join(tmpdir(), "hostinger-mcp-tools-"));
try {
  const packed = execFileSync("npm", ["pack", spec, "--silent", "--pack-destination", work], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .pop();

  execFileSync("tar", ["xzf", path.join(work, packed), "-C", work]);

  const pkgRoot = path.join(work, "package");
  const { version: resolvedVersion } = JSON.parse(
    readFileSync(path.join(pkgRoot, "package.json"), "utf8"),
  );

  const toolsDir = path.join(pkgRoot, "src", "core", "tools");
  const groups = {};

  for (const file of readdirSync(toolsDir).sort()) {
    // all.js is the union of every group — indexing it would double-count.
    if (!file.endsWith(".js") || file === "all.js") continue;
    const group = file.replace(/\.js$/, "");
    const source = readFileSync(path.join(toolsDir, file), "utf8");
    // Tool objects are emitted as pretty-printed JSON at a fixed indent, so the
    // 4-space `"name"` key is the tool itself rather than a nested schema field.
    const names = [...source.matchAll(/^ {4}"name":\s*"([^"]+)"/gm)].map((m) => m[1]);
    if (names.length === 0) throw new Error(`No tools parsed from ${file}`);
    groups[group] = names.sort();
  }

  const total = Object.values(groups).reduce((n, g) => n + g.length, 0);
  writeFileSync(
    outFile,
    `${JSON.stringify({ package: "@hostinger/mcp", version: resolvedVersion, total, groups }, null, 2)}\n`,
  );

  console.log(`Wrote ${path.relative(process.cwd(), outFile)}`);
  console.log(`  ${spec} resolved to ${resolvedVersion}`);
  console.log(`  ${total} tools across ${Object.keys(groups).length} groups`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
