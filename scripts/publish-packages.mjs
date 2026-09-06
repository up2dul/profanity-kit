import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const preStatePath = join(workspaceRoot, ".changeset", "pre.json");
const preStateBackupPath = `${preStatePath}.publish-backup`;
const arguments_ = ["exec", "changeset", "publish"];
let maskPreState = false;

if (existsSync(preStatePath)) {
  const preState = JSON.parse(readFileSync(preStatePath, "utf8"));
  if (preState.mode === "pre" && preState.tag) {
    arguments_.push("--tag", preState.tag);
    maskPreState = true;
  }
}

if (process.argv.includes("--dry-run")) {
  console.log(arguments_.join(" "));
} else {
  if (maskPreState) {
    if (existsSync(preStateBackupPath)) {
      throw new Error(
        `Refusing to publish because the prerelease backup already exists: ${preStateBackupPath}`
      );
    }
    renameSync(preStatePath, preStateBackupPath);
  }

  try {
    execFileSync(
      process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      arguments_,
      {
        cwd: workspaceRoot,
        stdio: "inherit",
      }
    );
  } finally {
    if (maskPreState) {
      renameSync(preStateBackupPath, preStatePath);
    }
  }
}
