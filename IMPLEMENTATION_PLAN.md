# Profanity Kit — Implementation Plan

**Status:** Phase 3 complete; Phase 4 is next

The plan converts the API contract and ADRs into small validation gates. A phase
is complete only when its evidence exists; later phases may revise provisional
ADRs when implementation data disagrees with assumptions.

## Phase 0 — Repository foundation

- **Status:** Complete.
- [x] Initialize the pnpm workspace and private docs app boundary.
- [x] Configure exact tool versions, formatting, linting, type checking, testing,
      Lefthook, commitlint, Changesets, and Renovate.
- [x] Add MIT licensing and contribution guidance.
- [x] Create minimal GitHub Actions quality and package workflows.

**Gate:** `pnpm install --frozen-lockfile`, `pnpm check`, and the package build
succeed locally; the publishable workspace has no runtime dependencies. The
quality and package workflows enforce the same checks in CI.

## Phase 1 — Matcher proof of concept

- **Status:** Complete.
- [x] Implement normalization, Unicode tokenization, the compiled map index, and
      original-offset tracking.
- [x] Implement immutable `createDetector()` closures.
- [x] Add `check`, `isClean`, `findAll`, and `filter` contract tests.
- [x] Use tiny test dictionaries rather than the production corpus.

**Gate:** boundary, Unicode, repeated occurrence, early exit, callback safety,
and replacement semantics pass without optimizing prematurely.

## Phase 2 — Package boundaries and artifacts

- **Status:** Complete.
- [x] Implement root, `/core`, `/languages/en`, and `/languages/id` entry points.
- [x] Configure tsdown and explicit export maps.
- [x] Build and inspect the npm tarball.
- [x] Add Node ESM/require, Vite, TypeScript, publint, and type-resolution
      fixtures.
- [x] Measure core and language bundle isolation.

**Gate:** Indonesian-only output contains no English data; all public entry
points resolve from the packed artifact.

## Phase 3 — Dictionary pipeline

- **Status:** Complete.
- [x] Define canonical authoring schema and validation rules.
- [x] Build deterministic generation and regenerate-diff CI.
- [x] Research licensed sources and design the AI-assisted human review workflow.
- [x] Curate initial English and Indonesian corpora with edge-case tests.
- [x] Establish pack versioning and provenance metadata.

**Gate:** every entry is reviewed or traceable, generation is reproducible, and
corpus behavior is evaluated for representative false positives. The canonical
sources live under `dictionaries/`, generated modules are checked by CI, and
the initial corpora carry project-curated, human-reviewed provenance metadata.

## Phase 4 — Performance evidence

- Run the benchmark matrix against real corpora.
- Measure consumer bundles in raw, minified, gzip, and Brotli forms.
- Compare the simplest relevant competitors without tailoring benchmarks to a
  predetermined winner.
- Set regression budgets from measured baselines.

**Gate:** published performance claims are reproducible and CI catches material
bundle regressions.

## Phase 5 — Documentation MVP

- Set up pinned Nimbus and generated API Markdown.
- Write quick start, language selection, custom dictionary, allowlist, matching
  semantics, Zod recipe, unsupported features, and migration-oriented examples.
- Build the Svelte playground island.
- Generate Markdown twins, `llms.txt`, and `llms-full.txt` from shared sources.

**Gate:** documentation builds in CI, code samples compile, and playground state
produces copyable code consistent with the API.

## Phase 6 — Release rehearsal and integration

- Test the package in a own project as the first real consumer.
- Run a Changesets prerelease rehearsal through the `next` channel.
- Verify npm Trusted Publishing, provenance, tarball contents, changelog, and
  install instructions.
- Collect integration feedback before committing to `1.0.0`.

**Gate:** the package is consumed from a registry artifact—not a workspace
shortcut—in a real application and all release checks are repeatable.
