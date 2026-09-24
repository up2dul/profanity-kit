# Profanity Kit — v1 Readiness Audit and Release Plan

> Status: v1.0.0 published and registry-verified. Release workflow propagation
> handling is being hardened based on the first publish run.
> Scope: **fix and verify actionable audit findings**, not a broad refactor or language expansion.
>
> Repository: https://github.com/up2dul/profanity-kit  
> Audited branch: `main` (Git tree `a9c8f83bc5d5d59f3cbccc1cacd9cabb7e9532ca`; package version `0.2.0`).  
> Note: Findings below are based on source/configuration inspection; tests, builds, and benchmarks were **not executed during the audit**. Revalidate against the latest branch before changing anything.

## Decisions confirmed with the maintainer

- Publish `1.0.0` directly after the release gates pass; do not publish a
  prerelease first.
- Preserve global, pack-order-independent allowlist precedence. Preserve custom
  blocklist precedence and report overlapping matches as `source: "custom"`
  with no language attribution.
- Validate pack words and custom list entries synchronously as exactly one
  Unicode token made of letters, combining marks, or numbers.
- Remove `anjing`, `babi`, `wedus`, `sempak`, and `setan` from Indonesian; keep
  the profanity-specific spelling `anjg`. Track neutral excluded terms
  separately from ordinary clean and expected-match corpus cases.
- Start both language-pack data versions at `1.0.0`. Version each pack
  independently: major for a fundamental curation/compatibility-policy change,
  minor for reviewed word additions/removals, patch for metadata/provenance-only
  corrections.
- Make `tsconfig.json` changes trigger quality and package workflows. Require
  the audit criteria, CI, packed consumer checks, bundle/performance budgets,
  docs checks/build, and Qalbwise integration validation before publishing.
- Accept ADRs 002, 003, 004, and 009 now; accept ADR-006 after verification.
  Keep ADRs 005 and 007 provisional. Update ADR-008 for direct stable release
  and Qalbwise validation evidence.

## Goal and guardrails

Prepare the existing English/Indonesian package for a stable v1 API and direct `1.0.0` release after all gates pass. Keep whole-word-only scope, zero runtime dependencies, dictionary-free core, independent language imports, and documented Unicode/UTF-16 behavior. Do **not** add new built-in languages, phrase matching, contextual classification, aggressive obfuscation handling, or major architectural changes as part of this task.

Inspect current code, tests, ADRs, and open issues/PRs. Some observations may reflect **intentional behavior**, not bugs; verify the contract and demonstrate a failing test or clear documentation mismatch before modifying public semantics. Prefer the smallest compatible change. If a change intentionally alters observable behavior, document it in a Changeset and update related documentation. Publish through the repository's release workflow after all agreed gates pass.

## P1 — Matching semantics: allowlist across locale indexes

**Inspect:** `packages/profanity-kit/src/core/detector.ts` — `compileIndexes()` and `findEntry()`; `packages/profanity-kit/src/core/detector.test.ts`; the customization and matching docs.

Currently `findEntry()` checks each normalization index and returns `undefined` immediately when an index's normalized token belongs to that index's `allowed` set, even if a match was found in a different index earlier in the loop. That may be the intended **global allowlist precedence**; do not assume it is a bug. The contract needs to be explicit and order-independent, particularly when different language packs declare different `normalization.caseLocale` values.

**Tasks:**

1. Define/document whether a token allowed under _any_ configured normalization is globally allowed, or whether allowlisting is locale/pack-specific. Preserve the existing global-allowlist behavior unless a documented requirement justifies otherwise.
2. Add regression tests with multiple packs using distinct case locales, including swapped pack order, a word present in one or more packs, and a corresponding allowlist entry. Assert the intended result is independent of pack order.
3. If tests expose a true order-dependence or contract violation, fix `findEntry()` with minimal impact and retain early exit where safe. Do not change the API or detection semantics merely to restructure the loop.

**Acceptance:** the intended allowlist precedence is documented, cross-locale/order tests pass, and existing allowlist and language-attribution tests remain green.

## P1 — Custom blocklist attribution and precedence

**Inspect:** `packages/profanity-kit/src/core/detector.ts` — `compileIndexes()`; `packages/profanity-kit/src/core/types.ts`; core tests and API/customization docs.

When a normalized word appears in both a built-in language pack and `blockList`, the custom entry overwrites the dictionary entry. `findAll()` then reports `source: "custom"` and `languages: []`. The current core unit test **explicitly asserts** this precedence. This is a **public-contract decision**, not a proven defect.

**Tasks:**

1. Confirm the intended semantics with the existing API docs/ADRs: custom precedence versus preserving dictionary-language attribution.
2. Prefer retaining current behavior for a stabilization release unless there is a compelling usage issue. If retained, add an explicit example to the API/customization docs showing overlap behavior, and keep a regression test.
3. If changing semantics is necessary, decide the new metadata contract first, update types/tests/docs together, and record the behavior change in a Changeset. Do not silently change the meaning of `source`/`languages`.

**Acceptance:** overlap behavior is deliberately specified and tested; `findAll()` metadata matches its documentation.

## P1 — Reject dictionary entries that cannot match as one token

**Inspect:** `packages/profanity-kit/src/core/detector.ts` — `validateDictionaryEntry()`; `packages/profanity-kit/src/core/tokenize.ts`; `scripts/generate-dictionaries.mjs`; core tests; customization docs.

The runtime validator currently checks for a non-empty string. The tokenizer uses `/[\p{L}\p{M}\p{N}]+/gu`, so custom dictionary entries containing spaces, hyphens, underscores, or other delimiters cannot match as a **single** whole-word entry. Canonical built-in sources already have separate generator validation; this task concerns runtime-provided language packs and custom `blockList`/`allowList` as well.

**Tasks:**

1. Define a shared, explicit entry contract: one complete token according to current Unicode tokenizer semantics, with the existing normalization policy. Decide whether leading/trailing whitespace is rejected (recommended), rather than silently trimmed.
2. Validate words in custom language packs **and** custom lists during detector creation, using the existing stable error-code conventions (`INVALID_DICTIONARY_ENTRY` for entries; preserve meaningful pack errors where applicable).
3. Add tests for valid Unicode letters/combining marks/numbers and invalid examples such as `bad word`, `bad-word`, `bad_word`, whitespace-only and punctuation-only strings. Test that invalid entries fail synchronously and valid existing built-in packs continue to load.
4. Document the restriction and direct developers to `blockList` for _single words_ only; phrase matching remains out of scope.

**Acceptance:** no accepted entry is intrinsically unmatchable due to token-boundary syntax; error behavior and docs are consistent; dictionary generation/check still pass.

## P1 — Dictionary quality: reviewed exclusions and evaluation corpus

**Inspect:** `dictionaries/en/words.txt`, `dictionaries/id/words.txt`, their metadata, `dictionaries/README.md`, `packages/profanity-kit/src/index.test.ts`, and existing dictionary generation checks.

Words such as `anjing`, `babi`, `setan`, `sempak`, and `wedus` can also appear in non-offensive contexts. This is an expected limitation of dictionary-based whole-word detection, **not** evidence that these entries must be deleted or that the engine should perform contextual moderation.

**Tasks:**

1. Exclude ordinary literal terms whose offensive use depends on context. For this release remove Indonesian `anjing`, `babi`, `wedus`, `sempak`, and `setan`; retain the profanity-specific altered form `anjg`.
2. Maintain a deterministic public-entry evaluation corpus with three labels: `match`, `clean`, and `excluded-ambiguous`. Include capitalization, punctuation, Unicode, reviewed variants, embedded substrings, and neutral contexts. Keep corpus provenance/review guidance consistent with `dictionaries/README.md`.
3. Document that a match does not prove abusive intent and that applications may add context-dependent words with `blockList`.
4. Update `words.txt`, metadata pack version, generated module, tests, and Changeset together, per ADR-004.

**Acceptance:** evaluation cases are repeatable; the five approved exclusions and retained `anjg` are tested; behavior changes are visible in CI; no unsupported accuracy claims.

## P2 — CI trigger coverage

**Inspect:** `.github/workflows/quality.yaml` and `.github/workflows/package.yaml`.

Both workflows currently ignore `**/tsconfig.json`. A TS config change can affect types or build compatibility without triggering these checks.

**Tasks:** remove that exclusion from both workflows (and review other ignored config paths only if they materially affect these checks). Keep docs-only optimization where appropriate. If docs-content changes need MDX validation, ensure a docs-specific workflow covers them without forcing every documentation edit through the full package pipeline.

**Acceptance:** editing any `tsconfig.json` triggers relevant quality/package validation; existing release and docs workflows remain operational.

## P2 — Focused regression tests and package verification

Existing coverage already includes Unicode offsets, locale casing, whole-word boundaries, immutable configuration, custom lists, ESM/CJS consumer imports, TypeScript declarations, Vite bundling, `publint`, and `attw`. **Extend it; do not rebuild it from scratch.**

**Tasks:** add the missing tests from the P1 sections; include a filter test using astral Unicode symbols to distinguish code-point replacement length from UTF-16 offsets; verify cross-locale pack-order behavior. Run the project's existing tests and packed-consumer validations.

Suggested verification commands (check actual scripts on current `main` before running):

```bash
pnpm install --frozen-lockfile
pnpm dictionary:check
pnpm check
pnpm package:artifact
pnpm package:measure:check
pnpm performance:check
pnpm docs:check
pnpm docs:build
```

`package:artifact` writes a tarball to `artifacts/`; ensure only one tarball is present when running package/bundle scripts. Confirm CI results independently; do not claim tests passed if not executed. If a command fails for an unrelated environment issue, report it separately with the exact command/output.

**Acceptance:** all applicable checks pass; packed package behavior is verified, not just workspace imports.

## P3 — ADR status and documentation alignment

**Inspect:** `docs/adr/003-unicode-matching-algorithm.md`, `docs/adr/004-dictionary-architecture.md`, other provisional ADRs, and the docs under `apps/docs/src/content/docs/`.

ADR-003 and ADR-004 currently show `Status: Provisional` despite corresponding implementation existing. Implementation alone does **not** automatically imply acceptance.

**Tasks:** compare each ADR's decisions with actual code. Recommend changing `Provisional` to `Accepted` **only when the maintainer confirms it is the intended stable decision**; otherwise leave the status and note outstanding questions. Update docs for any clarified runtime entry/allowlist/attribution contracts. Avoid unrelated editorial rewrites.

**Acceptance:** statuses are not misleading and documentation reflects actual public behavior.

## Implementation and verification results

The confirmed decisions above are implemented. `profanity-kit@1.0.0` is
published on npm and the GitHub release is available.

- `pnpm check` — passed: formatting, lint, types, and 39 tests across 4 files.
- `pnpm dictionary:check` — passed.
- `pnpm package:artifact` — passed: packed Node ESM and `require()` checks,
  TypeScript consumer compilation, Vite build, publint, and Are The Types Wrong.
- `pnpm package:measure:check` and `pnpm performance:check` — passed.
- `pnpm docs:check` and `pnpm docs:build` — passed.
- Qalbwise integration — the production build passed in a temporary checkout at
  commit `5997b6a9f0229e0ec62c0f555edbe3a27d48ea87` using the `1.0.0` tarball.
  The source checkout was not changed; it still pins `0.1.0-next.2`.
- GitHub had no open issues or pull requests at audit time. npm now tags
  `1.0.0` as `latest`; the GitHub release tag is `profanity-kit@1.0.0`.

The first GitHub Release workflow published successfully through npm Trusted
Publishing, but its post-publish verifier exhausted its initial wait while the
npm metadata was visible before the tarball CDN stopped returning a cached 404.
After the CDN cache expired, `pnpm release:verify` passed, including package
installation, imports, registry signature, and provenance attestation. The
verifier now retries tarball installation to cover this propagation delay.

**Conclusion:** v1.0.0 is released. The local quality, package, performance,
documentation, and Qalbwise integration gates passed; registry integrity and
provenance also passed after the CDN refreshed.

## Deliverables for handoff

- Minimal implementation changes plus focused unit/regression tests.
- Updated matching/customization/API/dictionary documentation as needed.
- Small evaluation corpus and its repeatable test/check.
- CI trigger correction and any justified ADR status proposal.
- Changeset(s) for observable package or dictionary behavior changes, with clear release notes.
- Final report: what changed, which decisions were intentionally retained, exact verification commands/results, remaining limitations, and whether a v1.0.0 release is now justified.

**Release decision:** This task should prepare a candidate; it must **not** automatically bump to `1.0.0` or publish. If changes are behavioral and require a pre-v1 stabilization release, recommend an appropriate version with rationale. Do not add languages as a substitute for resolving the above contract/quality issues.
