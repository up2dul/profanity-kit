import { existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactsDirectory = join(workspaceRoot, "artifacts");

if (existsSync(artifactsDirectory)) {
  for (const file of readdirSync(artifactsDirectory)) {
    if (file.endsWith(".tgz")) rmSync(join(artifactsDirectory, file));
  }
}
