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
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = join(root, "artifacts");
const reportPath = join(root, "reports", "performance", "phase-4.json");
const tarballs = readdirSync(artifacts).filter((file) => file.endsWith(".tgz"));
if (tarballs.length !== 1) {
  throw new Error(
    `Expected exactly one package tarball in artifacts, found ${tarballs.length}`
  );
}

const temporaryDirectory = join(tmpdir(), "profanity-kit-performance");
const installEnvironment = {
  ...process.env,
  npm_config_cache: join(temporaryDirectory, "npm-cache"),
};
const iterations = 10_000;
const samples = 5;

const benchmark = (name, operation) => {
  const timings = [];
  for (let sample = 0; sample < samples; sample += 1) {
    const start = performance.now();
    for (let index = 0; index < iterations; index += 1) operation();
    timings.push(performance.now() - start);
  }
  timings.sort((left, right) => left - right);
  return {
    name,
    medianMs: Number(timings[Math.floor(timings.length / 2)].toFixed(3)),
  };
};

try {
  rmSync(temporaryDirectory, { recursive: true, force: true });
  mkdirSync(temporaryDirectory, { recursive: true });
  writeFileSync(
    join(temporaryDirectory, "package.json"),
    '{"private":true,"type":"module"}\n'
  );
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      join(artifacts, tarballs[0]),
    ],
    {
      cwd: temporaryDirectory,
      env: installEnvironment,
      stdio: "ignore",
    }
  );

  const { createDetector } = await import(
    join(temporaryDirectory, "node_modules/profanity-kit/dist/index.js")
  );
  const { createDetector: createCoreDetector } = await import(
    join(temporaryDirectory, "node_modules/profanity-kit/dist/core/index.js")
  );
  const { english } = await import(
    join(temporaryDirectory, "node_modules/profanity-kit/dist/languages/en.js")
  );
  const { indonesian } = await import(
    join(temporaryDirectory, "node_modules/profanity-kit/dist/languages/id.js")
  );

  const englishDetector = createDetector();
  const indonesianDetector = createCoreDetector({ languages: [indonesian] });
  const combinedDetector = createCoreDetector({
    languages: [english, indonesian],
  });
  const longClean = "hello world ".repeat(200);
  const longLate = `${"hello world ".repeat(200)}shit`;
  const cases = [
    benchmark("initialization.english", () => createDetector()),
    benchmark("initialization.oneLanguage", () =>
      createCoreDetector({ languages: [indonesian] })
    ),
    benchmark("initialization.multipleLanguages", () =>
      createCoreDetector({ languages: [english, indonesian] })
    ),
    benchmark("check.shortNoMatch", () => englishDetector.check("hello world")),
    benchmark("check.shortEarlyMatch", () =>
      englishDetector.check("shit hello")
    ),
    benchmark("check.longNoMatch", () => englishDetector.check(longClean)),
    benchmark("check.longLateMatch", () => englishDetector.check(longLate)),
    benchmark("findAll.repeatedMatches", () =>
      englishDetector.findAll("shit hello shit hello shit")
    ),
    benchmark("check.indonesian", () =>
      indonesianDetector.check("ini sangat goblok")
    ),
    benchmark("check.combined", () => combinedDetector.check("hello goblok")),
  ];

  const report = `${JSON.stringify(
    {
      schemaVersion: 1,
      packageVersion: "0.0.0",
      runtime: "node22.13.0",
      iterations,
      samples,
      measurements: Object.fromEntries(
        cases.map(({ name, medianMs }) => [name, { medianMs }])
      ),
      budgets: Object.fromEntries(
        cases.map(({ name, medianMs }) => [
          name,
          { maxMedianMs: Math.max(1, Number((medianMs * 3).toFixed(3))) },
        ])
      ),
      comparison: {
        status: "reference-only",
        note: "Competitor comparisons require equivalent licensed corpora; this report uses neutral API fixtures and does not claim a competitor advantage.",
      },
    },
    null,
    2
  )}\n`;

  if (process.argv.includes("--check")) {
    const expected = JSON.parse(readFileSync(reportPath, "utf8"));
    const actual = JSON.parse(report);
    const failures = [];
    for (const [name, budget] of Object.entries(expected.budgets ?? {})) {
      const measured = actual.measurements?.[name]?.medianMs;
      if (!Number.isFinite(measured) || measured > budget.maxMedianMs) {
        failures.push(`${name}: ${measured}ms exceeds ${budget.maxMedianMs}ms`);
      }
    }
    if (
      expected.schemaVersion !== actual.schemaVersion ||
      failures.length > 0
    ) {
      throw new Error(
        `Performance regression detected:\n- ${failures.join("\n- ")}`
      );
    }
  } else {
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, report);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
