import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const preStatePath = join(workspaceRoot, ".changeset", "pre.json");
const arguments_ = ["exec", "changeset", "publish"];

if (existsSync(preStatePath)) {
  const preState = JSON.parse(readFileSync(preStatePath, "utf8"));
  if (preState.mode === "pre" && preState.tag) {
    arguments_.push("--tag", preState.tag);
  }
}

if (process.argv.includes("--dry-run")) {
  console.log(arguments_.join(" "));
} else {
  execFileSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", arguments_, {
    cwd: workspaceRoot,
    stdio: "inherit",
  });
}
