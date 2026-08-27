import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync } from "node:zlib";

import { build } from "vite";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactsDirectory = join(workspaceRoot, "artifacts");
const reportPath = join(workspaceRoot, "reports", "bundles", "phase-2.json");
const tarballs = readdirSync(artifactsDirectory).filter((file) =>
  file.endsWith(".tgz")
);

if (tarballs.length !== 1) {
  throw new Error(
    `Expected exactly one package tarball in artifacts, found ${tarballs.length}`
  );
}

const temporaryDirectory = join(tmpdir(), "profanity-kit-bundles");
const tarball = join(artifactsDirectory, tarballs[0]);
const outputDirectory = join(temporaryDirectory, "bundles");
const entries = {
  core: `import { createDetector } from "profanity-kit/core";
export const detector = createDetector({ languages: [{ code: "xx", name: "Custom", version: "1.0.0", words: ["customsentinel"] }] });
`,
  root: `import { createDetector } from "profanity-kit";
export const detector = createDetector();
`,
  english: `export { english } from "profanity-kit/languages/en";
`,
  indonesian: `export { indonesian } from "profanity-kit/languages/id";
`,
  combined: `import { createDetector } from "profanity-kit/core";
import { english } from "profanity-kit/languages/en";
import { indonesian } from "profanity-kit/languages/id";
export const detector = createDetector({ languages: [english, indonesian] });
`,
};

// Vite/Rollup can emit small bundle-size differences across supported Node/OS
// combinations. Keep the report useful as a regression guard without requiring
// compressed byte counts to be identical across build environments.
const measurementTolerance = 0.2;

const installEnvironment = {
  ...process.env,
  npm_config_cache: join(temporaryDirectory, "npm-cache"),
};

try {
  rmSync(temporaryDirectory, { recursive: true, force: true });
  mkdirSync(temporaryDirectory);
  writeFileSync(
    join(temporaryDirectory, "package.json"),
    `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`
  );
  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
    {
      cwd: temporaryDirectory,
      env: installEnvironment,
      stdio: "ignore",
    }
  );

  mkdirSync(outputDirectory);
  for (const [name, source] of Object.entries(entries)) {
    const entryPath = join(temporaryDirectory, `${name}.js`);
    writeFileSync(entryPath, source);

    for (const minify of [false, true]) {
      const variant = minify ? "min" : "raw";
      await build({
        configFile: false,
        logLevel: "silent",
        build: {
          emptyOutDir: false,
          lib: {
            entry: entryPath,
            fileName: () => `${name}.${variant}.js`,
            formats: ["es"],
          },
          minify,
          outDir: outputDirectory,
          sourcemap: false,
        },
      });
    }
  }

  const measurements = {};
  for (const name of Object.keys(entries)) {
    const raw = readFileSync(join(outputDirectory, `${name}.raw.js`));
    const minified = readFileSync(join(outputDirectory, `${name}.min.js`));
    measurements[name] = {
      raw: raw.byteLength,
      minified: minified.byteLength,
      gzip: gzipSync(minified, { level: 9 }).byteLength,
      brotli: brotliCompressSync(minified).byteLength,
    };
  }

  const coreBundle = readFileSync(join(outputDirectory, "core.min.js"), "utf8");
  const rootBundle = readFileSync(join(outputDirectory, "root.min.js"), "utf8");
  const indonesianBundle = readFileSync(
    join(outputDirectory, "indonesian.min.js"),
    "utf8"
  );
  const combinedBundle = readFileSync(
    join(outputDirectory, "combined.min.js"),
    "utf8"
  );
  if (
    coreBundle.includes("englishsentinel") ||
    coreBundle.includes("indonesiansentinel")
  ) {
    throw new Error("Core bundle contains built-in dictionary data");
  }
  if (
    !rootBundle.includes("englishsentinel") ||
    rootBundle.includes("indonesiansentinel")
  ) {
    throw new Error("Root bundle language isolation failed");
  }
  if (
    !indonesianBundle.includes("indonesiansentinel") ||
    indonesianBundle.includes("englishsentinel")
  ) {
    throw new Error("Indonesian bundle language isolation failed");
  }
  if (
    !combinedBundle.includes("englishsentinel") ||
    !combinedBundle.includes("indonesiansentinel")
  ) {
    throw new Error("Combined bundle is missing language data");
  }

  const workspaceManifest = JSON.parse(
    readFileSync(join(workspaceRoot, "package.json"), "utf8")
  );
  const report = `${JSON.stringify(
    {
      schemaVersion: 1,
      packageVersion: "0.0.0",
      consumerRuntime: "node22.13.0",
      tools: {
        vite: workspaceManifest.devDependencies.vite,
      },
      bytes: measurements,
      assertions: {
        coreExcludesBuiltInDictionaries: true,
        indonesianExcludesEnglish: true,
        rootExcludesIndonesian: true,
      },
    },
    null,
    2
  )}\n`;

  if (process.argv.includes("--check")) {
    const expected = JSON.parse(readFileSync(reportPath, "utf8"));
    const actual = JSON.parse(report);
    const mismatches = [];

    for (const name of Object.keys(entries)) {
      for (const metric of ["raw", "minified", "gzip", "brotli"]) {
        const expectedBytes = expected.bytes?.[name]?.[metric];
        const actualBytes = actual.bytes?.[name]?.[metric];
        if (
          !Number.isInteger(expectedBytes) ||
          !Number.isInteger(actualBytes)
        ) {
          mismatches.push(`${name}.${metric} is missing or invalid`);
          continue;
        }

        const drift = Math.abs(actualBytes - expectedBytes) / expectedBytes;
        if (drift > measurementTolerance) {
          mismatches.push(
            `${name}.${metric}: expected ${expectedBytes}, got ${actualBytes}`
          );
        }
      }
    }

    if (
      expected.schemaVersion !== actual.schemaVersion ||
      expected.packageVersion !== actual.packageVersion ||
      expected.tools?.vite !== actual.tools?.vite ||
      JSON.stringify(expected.assertions) !== JSON.stringify(actual.assertions)
    ) {
      mismatches.push("report metadata or assertions differ");
    }

    if (mismatches.length > 0) {
      throw new Error(
        `Bundle measurements differ from reports/bundles/phase-2.json:\n- ${mismatches.join("\n- ")}`
      );
    }
  } else {
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, report);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
