import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { retryOperation } from "./retry-operation.mjs";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(
    join(workspaceRoot, "packages", "profanity-kit", "package.json"),
    "utf8"
  )
);
const specification = `${manifest.name}@${manifest.version}`;
const temporaryDirectory = mkdtempSync(
  join(tmpdir(), "profanity-kit-registry-")
);
const run = (command, arguments_, options = {}) =>
  execFileSync(command, arguments_, {
    cwd: temporaryDirectory,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: join(temporaryDirectory, "npm-cache"),
    },
    ...options,
  });
const wait = (milliseconds) =>
  new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
const registryLookupAttempts = 61;
const registryLookupIntervalMs = 5_000;
const packageInstallAttempts = 61;
const packageInstallIntervalMs = 5_000;

try {
  const registryManifest = await retryOperation(
    (attempt) =>
      JSON.parse(
        run("npm", ["view", specification, "--json"], {
          env: {
            ...process.env,
            npm_config_cache: join(
              temporaryDirectory,
              `npm-cache-view-${attempt}`
            ),
          },
        })
      ),
    {
      attempts: registryLookupAttempts,
      intervalMs: registryLookupIntervalMs,
      wait,
    }
  );
  if (registryManifest.version !== manifest.version) {
    throw new Error(
      `Registry returned ${registryManifest.version} for ${specification}`
    );
  }
  if (
    !registryManifest.dist?.tarball ||
    !registryManifest.dist?.integrity ||
    !registryManifest.dist?.attestations?.url ||
    !registryManifest.dist?.attestations?.provenance?.predicateType
  ) {
    throw new Error(
      `${specification} is missing registry integrity or provenance`
    );
  }

  writeFileSync(
    join(temporaryDirectory, "package.json"),
    `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`
  );
  await retryOperation(
    (attempt) =>
      run(
        "npm",
        [
          "install",
          "--save-exact",
          "--ignore-scripts",
          "--no-audit",
          "--no-fund",
          specification,
        ],
        {
          env: {
            ...process.env,
            npm_config_cache: join(
              temporaryDirectory,
              `npm-cache-install-${attempt}`
            ),
          },
        }
      ),
    {
      attempts: packageInstallAttempts,
      intervalMs: packageInstallIntervalMs,
      wait,
    }
  );
  writeFileSync(
    join(temporaryDirectory, "verify.mjs"),
    `import { createDetector } from "profanity-kit";
import { createDetector as createCoreDetector } from "profanity-kit/core";
import { indonesian } from "profanity-kit/languages/id";

if (!createDetector().check("bullshit")) throw new Error("root registry import failed");
if (!createCoreDetector({ languages: [indonesian] }).check("brengsek")) throw new Error("language registry import failed");
`
  );
  run(process.execPath, [join(temporaryDirectory, "verify.mjs")], {
    stdio: "inherit",
  });
  run("npm", ["audit", "signatures"], { stdio: "inherit" });
  console.log(`Verified registry release ${specification}`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
