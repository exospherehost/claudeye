#!/usr/bin/env node

import { getDefaultClaudeProjectsPath } from "../lib/paths";
import { spawn, execSync } from "child_process";
import { randomBytes } from "crypto";

import { resolve } from "path";
import { parseScriptArgs } from "./parse-script-args";

// Parse command-line arguments
const { claudeProjectsPath: parsedPath, evalsPath, cacheMode, cachePath, authUsers, remainingArgs } = parseScriptArgs(process.argv.slice(2));

console.log(`
  ____ _                 _
 / ___| | __ _ _   _  __| | ___ _   _  ___
| |   | |/ _\` | | | |/ _\` |/ _ \\ | | |/ _ \\
| |___| | (_| | |_| | (_| |  __/ |_| |  __/
 \\____|_|\\__,_|\\__,_|\\__,_|\\___|\\__, |\\___|
                                |___/
`);

let claudeProjectsPath = parsedPath;

// If no path provided, use default
if (!claudeProjectsPath) {
  claudeProjectsPath = getDefaultClaudeProjectsPath();
  console.log(`Using default .claude projects path: ${claudeProjectsPath}`);
} else {
  console.log(`Using custom .claude projects path: ${claudeProjectsPath}`);
}

// Build evals dist if --evals is specified (needed for import resolution)
if (evalsPath) {
  console.log("Building evals dist...");
  execSync("npx tsc -p tsconfig.evals.json", { stdio: "inherit" });
}

// Set environment variable and spawn Next.js production server
process.env.CLAUDE_PROJECTS_PATH = claudeProjectsPath;

const distPath = resolve(process.cwd(), "dist");

// Merge CLI --auth-user values with existing CLAUDEYE_AUTH_USERS env var
const existingAuthUsers = process.env.CLAUDEYE_AUTH_USERS ?? "";
const allAuthUsers = [...(existingAuthUsers ? existingAuthUsers.split(",") : []), ...authUsers]
  .filter(Boolean)
  .join(",");
const authEnv: Record<string, string> = {};
if (allAuthUsers) {
  authEnv.CLAUDEYE_AUTH_USERS = allAuthUsers;
  authEnv.CLAUDEYE_AUTH_SECRET = process.env.CLAUDEYE_AUTH_SECRET ?? randomBytes(32).toString("hex");
  const usernames = allAuthUsers.split(",").map((u) => u.split(":")[0]);
  console.log(`Auth: enabled for ${usernames.join(", ")}`);
  if (authUsers.length > 0) {
    console.log(`  (tip: use CLAUDEYE_AUTH_USERS env var to avoid passwords appearing in npm output)`);
  }
}

const nextProcess = spawn("npx", ["next", "start", ...remainingArgs], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    CLAUDE_PROJECTS_PATH: claudeProjectsPath,
    ...(evalsPath ? { CLAUDEYE_EVALS_MODULE: evalsPath, CLAUDEYE_DIST_PATH: distPath } : {}),
    ...(cacheMode === "off" ? { CLAUDEYE_CACHE: "off" } : {}),
    ...(cachePath ? { CLAUDEYE_CACHE_PATH: cachePath } : {}),
    ...authEnv,
  },
});

nextProcess.on("error", (error) => {
  console.error("Error starting Next.js:", error);
  process.exit(1);
});

nextProcess.on("exit", (code) => {
  process.exit(code || 0);
});
