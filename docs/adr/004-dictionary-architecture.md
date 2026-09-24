# ADR-004 — Dictionary architecture and provenance

**Status:** Accepted

## Context

Dictionary data will dominate bundle size and directly controls false-positive
behavior. It must be reviewable by humans, deterministic in builds, independently
importable, and traceable to permitted sources.

## Decision

Maintain canonical UTF-8 sources under `dictionaries/<language>/words.txt`, one
normalized word per line, accompanied by metadata. A generator validates NFC,
lowercase form, duplicates, whitespace, phrases, and deterministic code-point
ordering, then produces committed TypeScript modules under `src/generated/`.
CI regenerates and fails on diff. Generated files are never edited manually.

Built-in packs expose readonly word data and a lightweight data version. Full
provenance metadata is a separate export so normal imports do not pay for it.
Detectors snapshot pack data and compile independent indexes.

Curate for unambiguous profanity. Omit ordinary literal words whose insulting
meaning depends on context, including `anjing`, `babi`, `wedus`, `sempak`, and
`setan` in Indonesian; retain profanity-specific altered forms such as `anjg`.
Applications that need context-dependent terms can add them in `blockList`.
Maintain a reviewed evaluation corpus with `match`, `clean`, and
`excluded-ambiguous` cases.

Version each pack independently: major for a fundamental curation-policy or
compatibility-boundary change, minor for reviewed word additions or removals,
and patch for metadata/provenance corrections that do not change the effective
word set. Update only the affected pack versions. The package version remains
managed separately by Changesets.

## Alternatives considered

Hand-maintained TypeScript arrays mix source data with syntax and produce noisy
reviews. Runtime loading from JSON or network adds compatibility and latency
costs. Compression is deferred because it may reduce package tarball size while
increasing consumer bundle or initialization cost.

## Consequences

Adding or removing words changes observable behavior and requires a changeset,
release notes, and pack-version update. Dictionary source, generated output, and
tests must move together. The npm artifact publishes generated runtime data,
not authoring files unless a user-facing reason is established.

## Reconsider when

Real bundle measurements justify a different representation, provided it keeps
language isolation, deterministic generation, and inspectable provenance.
