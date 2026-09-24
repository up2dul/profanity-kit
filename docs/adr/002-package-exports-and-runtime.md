# ADR-002 — Package exports, ESM, and runtime contract

**Status:** Accepted

## Context

Zero-configuration English is good DX, while importing English into an
Indonesian-only application violates the bundle-size goal. Supporting separate
ESM and CommonJS artifacts would duplicate output and testing. Modern Node can
synchronously require an ESM graph when it has no top-level await.

## Decision

- `profanity-kit` is the English convenience entry.
- `profanity-kit/core` contains no dictionary.
- `profanity-kit/languages/en` and `/id` are explicit packs.
- Language packs are not re-exported from the root.
- Publish one ESM implementation with named exports and declarations.
- Map `import` and `require` to the same physical ESM files.
- Prohibit top-level await in the public graph.
- Official Node support begins at 22.13.0.
- Browsers follow a capability-based Baseline Widely Available policy until
  final artifact tests establish exact versions.

## Alternatives considered

A dictionary-free root is maximally explicit but damages the simplest quick
start. Language-specific detector factories create too many usage patterns.
Dual `.js` and `.cjs` output supports older tooling but increases artifact size,
test combinations, and the chance of divergent module instances.

## Technical reasoning

Tree shaking cannot be the only defense against hidden dictionary cost because
the root factory genuinely needs English as its default. A separate `/core`
entry makes isolation structural and testable. One synchronous ESM graph keeps
modern CommonJS interoperability without duplicating implementation.

## Consequences

Older Node and legacy bundlers are unsupported. Every public subpath must pass
ESM, modern `require()`, TypeScript resolution, and bundle-isolation fixtures.
No Node, DOM, filesystem, network, or environment API may enter the core.

## Reconsider when

Consumer evidence shows meaningful demand from older CommonJS environments or
artifact tests show that same-file `require(ESM)` is unreliable.
