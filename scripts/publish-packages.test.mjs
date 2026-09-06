import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const fixtures = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { force: true, recursive: true });
  }
});

function createFixture(preState) {
  const workspaceRoot = mkdtempSync(join(tmpdir(), "publish-packages-"));
  fixtures.push(workspaceRoot);

  const scriptsDirectory = join(workspaceRoot, "scripts");
  const changesetDirectory = join(workspaceRoot, ".changeset");
  const binaryDirectory = join(workspaceRoot, "bin");
  mkdirSync(scriptsDirectory);
  mkdirSync(changesetDirectory);
  mkdirSync(binaryDirectory);

  copyFileSync(
    new URL("./publish-packages.mjs", import.meta.url),
    join(scriptsDirectory, "publish-packages.mjs")
  );

  const preStatePath = join(changesetDirectory, "pre.json");
  if (preState !== undefined) {
    writeFileSync(preStatePath, preState);
  }

  const recordPath = join(workspaceRoot, "publish-record.json");
  const fakePnpmPath = join(binaryDirectory, "pnpm");
  writeFileSync(
    fakePnpmPath,
    `#!/usr/bin/env node
const { existsSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

writeFileSync(
  process.env.PUBLISH_TEST_RECORD,
  JSON.stringify({
    arguments: process.argv.slice(2),
    preStateExists: existsSync(join(process.cwd(), ".changeset", "pre.json")),
  })
);
process.exit(Number(process.env.PUBLISH_TEST_EXIT_CODE || 0));
`
  );
  chmodSync(fakePnpmPath, 0o755);

  return { binaryDirectory, preStatePath, recordPath, workspaceRoot };
}

function runPublish(fixture, exitCode = 0) {
  return spawnSync(
    process.execPath,
    [join(fixture.workspaceRoot, "scripts", "publish-packages.mjs")],
    {
      cwd: fixture.workspaceRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${fixture.binaryDirectory}${delimiter}${process.env.PATH}`,
        PUBLISH_TEST_EXIT_CODE: String(exitCode),
        PUBLISH_TEST_RECORD: fixture.recordPath,
      },
    }
  );
}

function readRecord(fixture) {
  return JSON.parse(readFileSync(fixture.recordPath, "utf8"));
}

describe("prerelease publishing", () => {
  it("hides prerelease state while publishing with its npm tag", () => {
    const preState = '{\n  "mode": "pre",\n  "tag": "next"\n}\n';
    const fixture = createFixture(preState);

    const result = runPublish(fixture);

    expect(result.status).toBe(0);
    expect(readRecord(fixture)).toEqual({
      arguments: ["exec", "changeset", "publish", "--tag", "next"],
      preStateExists: false,
    });
    expect(readFileSync(fixture.preStatePath, "utf8")).toBe(preState);
    expect(existsSync(`${fixture.preStatePath}.publish-backup`)).toBe(false);
  });

  it("restores prerelease state when publishing fails", () => {
    const preState = '{"mode":"pre","tag":"next"}\n';
    const fixture = createFixture(preState);

    const result = runPublish(fixture, 23);

    expect(result.status).not.toBe(0);
    expect(readRecord(fixture).preStateExists).toBe(false);
    expect(readFileSync(fixture.preStatePath, "utf8")).toBe(preState);
    expect(existsSync(`${fixture.preStatePath}.publish-backup`)).toBe(false);
  });

  it("uses normal Changesets publishing outside active prerelease mode", () => {
    const fixture = createFixture('{"mode":"exit","tag":"next"}\n');

    const result = runPublish(fixture);

    expect(result.status).toBe(0);
    expect(readRecord(fixture)).toEqual({
      arguments: ["exec", "changeset", "publish"],
      preStateExists: true,
    });
  });

  it("refuses to overwrite an existing prerelease backup", () => {
    const preState = '{"mode":"pre","tag":"next"}\n';
    const fixture = createFixture(preState);
    const backupPath = `${fixture.preStatePath}.publish-backup`;
    writeFileSync(backupPath, "recovery data\n");

    const result = runPublish(fixture);

    expect(result.status).not.toBe(0);
    expect(existsSync(fixture.recordPath)).toBe(false);
    expect(readFileSync(fixture.preStatePath, "utf8")).toBe(preState);
    expect(readFileSync(backupPath, "utf8")).toBe("recovery data\n");
  });
});
