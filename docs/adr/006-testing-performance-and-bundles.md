# ADR-006 — Testing, performance, and bundle validation

**Status:** Accepted

## Context

Claims such as tree-shakeable, lightweight, Unicode-aware, and modern CommonJS
compatible cannot be established by unit tests alone. Arbitrary performance
budgets chosen before the real corpus and implementation would be misleading.

## Decision

Use Vitest for runtime contracts, including a maintainer-reviewed EN/ID
evaluation corpus. Build the real npm tarball and test it through packed
consumer fixtures covering Node ESM, Node `require()`, Vite, and TypeScript.
Compile the TypeScript consumer fixture with `tsc` to validate public type
inference. Validate metadata with publint and package types with Are The Types
Wrong.

Measure raw, minified, gzip, and Brotli consumer bundles for core, root, each
language, combined languages, and optional metadata. Prove that Indonesian-only
imports exclude English. Benchmark initialization, no-match, early/late match,
repeated matches, short/long input, and one/multiple languages.

Establish CI regression budgets from the first validated implementation rather
than inventing numbers in advance. Bundle isolation, zero runtime dependencies,
and `check()` early exit are hard requirements from the start.

## Consequences

The test matrix is larger than a typical small library, but it validates the
actual consumer artifact instead of source assumptions. A release cannot rely
only on `tsc` and unit tests. Performance changes require comparable fixtures
and recorded environments.

## Reconsider when

Fixtures become redundant through a demonstrably equivalent artifact test, or
new supported runtimes require additional consumers.
