import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactsDirectory = join(workspaceRoot, "artifacts");
const tarballs = readdirSync(artifactsDirectory).filter((file) =>
  file.endsWith(".tgz")
);

if (tarballs.length !== 1) {
  throw new Error(
    `Expected exactly one package tarball in artifacts, found ${tarballs.length}`
  );
}

const tarball = join(artifactsDirectory, tarballs[0]);
const temporaryDirectory = mkdtempSync(
  join(tmpdir(), "profanity-kit-consumer-")
);
const packageDirectory = join(
  temporaryDirectory,
  "node_modules",
  "profanity-kit"
);
const bin = (name) => join(workspaceRoot, "node_modules", ".bin", name);
const run = (command, arguments_, options = {}) =>
  execFileSync(command, arguments_, {
    cwd: workspaceRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: join(temporaryDirectory, "npm-cache"),
    },
    stdio: "inherit",
    ...options,
  });

try {
  writeFileSync(
    join(temporaryDirectory, "package.json"),
    `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`
  );
  run(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
    { cwd: temporaryDirectory }
  );

  const publishedFiles = readdirSync(packageDirectory);
  for (const required of ["LICENSE", "README.md", "dist", "package.json"]) {
    if (!publishedFiles.includes(required)) {
      throw new Error(`Packed artifact is missing ${required}`);
    }
  }
  for (const excluded of ["src", "tsconfig.json", "tsdown.config.mjs"]) {
    if (publishedFiles.includes(excluded)) {
      throw new Error(`Packed artifact unexpectedly contains ${excluded}`);
    }
  }

  writeFileSync(
    join(temporaryDirectory, "esm.mjs"),
    `import { createDetector } from "profanity-kit";
import { createDetector as createCoreDetector } from "profanity-kit/core";
import { english } from "profanity-kit/languages/en";
import { indonesian } from "profanity-kit/languages/id";

if (!createDetector().check("englishsentinel")) throw new Error("root ESM failed");
if (!createCoreDetector({ languages: [english] }).check("englishsentinel")) throw new Error("English ESM failed");
if (!createCoreDetector({ languages: [indonesian] }).check("indonesiansentinel")) throw new Error("Indonesian ESM failed");
`
  );
  writeFileSync(
    join(temporaryDirectory, "cjs.cjs"),
    `const { createDetector } = require("profanity-kit");
const { createDetector: createCoreDetector } = require("profanity-kit/core");
const { english } = require("profanity-kit/languages/en");
const { indonesian } = require("profanity-kit/languages/id");

if (!createDetector().check("englishsentinel")) throw new Error("root require failed");
if (!createCoreDetector({ languages: [english, indonesian] }).check("indonesiansentinel")) throw new Error("combined require failed");
`
  );
  run(process.execPath, [join(temporaryDirectory, "esm.mjs")]);
  run(process.execPath, [join(temporaryDirectory, "cjs.cjs")]);

  writeFileSync(
    join(temporaryDirectory, "type-test.ts"),
    `import { createDetector, type ProfanityDetector } from "profanity-kit";
import { createDetector as createCoreDetector, type LanguagePack } from "profanity-kit/core";
import { indonesian } from "profanity-kit/languages/id";

const root: ProfanityDetector<"en"> = createDetector();
const explicit: ProfanityDetector<"id"> = createCoreDetector({ languages: [indonesian] });
const community = { code: "xx", name: "Example", version: "1.0.0", words: ["word"] } as const satisfies LanguagePack<"xx">;
const custom: ProfanityDetector<"xx"> = createCoreDetector({ languages: [community] });

root.check("input");
explicit.check("input");
custom.check("input");
// @ts-expect-error The root factory is fixed to English.
createDetector({ languages: [indonesian] });
`
  );
  writeFileSync(
    join(temporaryDirectory, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          strict: true,
          target: "ES2024",
        },
        files: ["type-test.ts"],
      },
      null,
      2
    )}\n`
  );
  run(bin("tsc"), ["--project", join(temporaryDirectory, "tsconfig.json")]);

  const viteDirectory = join(temporaryDirectory, "vite-dist");
  writeFileSync(
    join(temporaryDirectory, "index.html"),
    '<script type="module" src="/vite-entry.ts"></script>\n'
  );
  writeFileSync(
    join(temporaryDirectory, "vite-entry.ts"),
    `import { createDetector } from "profanity-kit/core";
import { indonesian } from "profanity-kit/languages/id";
document.body.textContent = String(createDetector({ languages: [indonesian] }).check("indonesiansentinel"));
`
  );
  run(
    bin("vite"),
    ["build", temporaryDirectory, "--outDir", viteDirectory, "--emptyOutDir"],
    {
      cwd: temporaryDirectory,
    }
  );

  run(bin("publint"), [packageDirectory]);
  run(bin("attw"), [tarball, "--profile", "esm-only"]);

  const packageManifest = JSON.parse(
    readFileSync(join(packageDirectory, "package.json"), "utf8")
  );
  if (Object.keys(packageManifest.dependencies ?? {}).length !== 0) {
    throw new Error("Published package has runtime dependencies");
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
